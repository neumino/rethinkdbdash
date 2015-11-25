import * as net from 'net';
import * as tls from 'tls';
import Promise = require('bluebird');
import * as events from 'events';
import * as util from 'util';

import * as helper from './helper';
import * as Err from './error';
import {Cursor} from './cursor';
import {ReadableStream} from './stream';
import {Metadata} from './metadata';

import protodef from './protodef';
var responseTypes = protodef.Response.ResponseType;

export class Connection extends events.EventEmitter {
  rejectMap;
  timeout;
  open;
  metadata;
  buffer;
  token;
  db;
  timeoutConnect;
  authKey;
  port;
  host;
  r;
  connection;
  timeoutOpen;

  _flush() {
    helper.loopKeys(this.metadata, (metadata, key) => {
      if (typeof metadata[key].reject === 'function') {
        metadata[key].reject(new Err.ReqlServerError(
          'The connection was closed before the query could be completed.',
          metadata[key].query));
      }
      if (typeof metadata[key].endReject === 'function') {
        metadata[key].endReject(new Err.ReqlServerError(
          'The connection was closed before the query could be completed.',
          metadata[key].query));
      }
    });
    this.metadata = {};
  }

  _isOpen() {
    return this.open;
  }

  _isConnection() {
    return true;
  }

  noreplyWait(callback?:(err: any, value?: any) => void) {
    var self = this;
    var token = this._getToken();

    var p = new Promise<any>((resolve, reject) => {
      var query = [protodef.Query.QueryType.NOREPLY_WAIT];

      this._send(query, token, resolve, reject);
    }).nodeify(callback);
    return p;
  }

  noReplyWait() {
    throw new Err.ReqlDriverError('Did you mean to use `noreplyWait` instead of `noReplyWait`?');
  }

  close(options?, callback?:(err: any, value?: any) => void) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    var p = new Promise<any>((resolve, reject) => {
      if (!helper.isPlainObject(options)) options = {};
      if (options.noreplyWait === true) {
        this.noreplyWait().then((r) => {
          this.open = false;
          this.connection.end();
          resolve(r);
        }).error(e => {
          reject(e);
        });
      }
      else {
        this.open = false;
        this.connection.end();
        resolve();
      }
    }).nodeify(callback);
    return p;
  }

  _getToken() {
    return this.token++;
  }

  server(callback) {
    return new Promise((resolve, reject) => {
      var query = [protodef.Query.QueryType.SERVER_INFO];
      this._send(query, this._getToken(), resolve, reject, undefined, undefined, true);
    }).nodeify(callback);
  }

  use(db) {
    if (typeof db !== 'string') throw new Err.ReqlDriverError('First argument of `use` must be a string');
    this.db = db;
  }

  _end(token, resolve, reject) {
    var query = [protodef.Query.QueryType.STOP];
    this._send(query, token, resolve, reject, undefined, undefined, true);
  }

  _continue(token, resolve, reject) {
    var query = [protodef.Query.QueryType.CONTINUE];
    this._send(query, token, resolve, reject);
  }

  _send(query, token, resolve, reject, originalQuery?, options?, end?) {
    //console.log('Connection.prototype._send: '+token);
    //console.log(JSON.stringify(query, null, 2));

    var self = this;

    var queryStr = JSON.stringify(query);
    var querySize = Buffer.byteLength(queryStr);

    var buffer = new Buffer(8 + 4 + querySize);
    buffer.writeUInt32LE(token & 0xFFFFFFFF, 0);
    buffer.writeUInt32LE(Math.floor(token / 0xFFFFFFFF), 4);
    buffer.writeUInt32LE(querySize, 8);

    buffer.write(queryStr, 12);

    // noreply instead of noReply because the otpions are translated for the server
    if ((!helper.isPlainObject(options)) || (options.noreply != true)) {
      if (!this.metadata[token]) {
        this.metadata[token] = new Metadata(resolve, reject, originalQuery, options);
      }
      else if (end === true) {
        this.metadata[token].setEnd(resolve, reject);
      }
      else {
        this.metadata[token].setCallbacks(resolve, reject);
      }
    }
    else {
      if (typeof resolve === 'function') resolve();
      this.emit('release');
    }

    // This will emit an error if the connection is closed
    helper.tryCatch(() => {
      this.connection.write(buffer);
    }, err => {
      this.metadata[token].reject(err);
      delete this.metadata[token];
    });

  }

  reconnect(options, callback?:(err: any, value?: any) => void) {
    var self = this;

    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    if (!helper.isPlainObject(options)) options = {};

    if (options.noreplyWait === true) {
      var p = new Promise<any>((resolve, reject) => {
        this.close(options).then(() => {
          this.r.connect({
            host: this.host,
            port: this.port,
            authKey: this.authKey,
            db: this.db
          }).then(c => {
            resolve(c);
          }).error(e => {
            reject(e);
          });
        }).error(e => {
          reject(e);
        });
      }).nodeify(callback);
    }
    else {
      return this.r.connect({
        host: this.host,
        port: this.port,
        authKey: this.authKey,
        db: this.db
      }, callback);
    }

    return p;
  }

  _processResponse(response, token) {
    //console.log('Connection.prototype._processResponse: '+token);
    //console.log(JSON.stringify(response, null, 2));
    var self = this;

    var type = response.t;
    var result;
    var cursor;
    var stream;
    var currentResolve, currentReject;
    var datum;
    var options;

    if (type === responseTypes.COMPILE_ERROR) {
      this.emit('release');
      if (typeof this.metadata[token].reject === 'function') {
        this.metadata[token].reject(new Err.ReqlCompileError(helper.makeAtom(response), this.metadata[token].query, response));
      }

      delete this.metadata[token];
    }
    else if (type === responseTypes.CLIENT_ERROR) {
      this.emit('release');

      if (typeof this.metadata[token].reject === 'function') {
        currentResolve = this.metadata[token].resolve;
        currentReject = this.metadata[token].reject;
        this.metadata[token].removeCallbacks();
        currentReject(new Err.ReqlClientError(helper.makeAtom(response), this.metadata[token].query, response));
        if (typeof this.metadata[token].endReject !== 'function') {
          // No pending STOP query, we can delete
          delete this.metadata[token];
        }
      }
      else if (typeof this.metadata[token].endResolve === 'function') {
        currentResolve = this.metadata[token].endResolve;
        currentReject = this.metadata[token].endReject;
        this.metadata[token].removeEndCallbacks();
        currentReject(new Err.ReqlClientError(helper.makeAtom(response), this.metadata[token].query, response));
        delete this.metadata[token];
      }
      else if (token === -1) { // This should not happen now since 1.13 took the token out of the query
        var error:Error = new Err.ReqlClientError(helper.makeAtom(response) + '\nClosing all outstanding queries...');
        this.emit('error', error);
        // We don't want a function to yield forever, so we just reject everything
        helper.loopKeys(this.rejectMap, (rejectMap, key) => {
          rejectMap[key](error);
        });
        this.close();
        delete this.metadata[token];
      }
    }
    else if (type === responseTypes.RUNTIME_ERROR) {
      this.emit('release');
      if (typeof this.metadata[token].reject === 'function') {
      }

      if (typeof this.metadata[token].reject === 'function') {
        currentResolve = this.metadata[token].resolve;
        currentReject = this.metadata[token].reject;
        this.metadata[token].removeCallbacks();
        var error:Error = new Err.ReqlRuntimeError(helper.makeAtom(response), this.metadata[token].query, response);
        error.setName(response.e);
        currentReject(error);
        if (typeof this.metadata[token].endReject !== 'function') {
          // No pending STOP query, we can delete
          delete this.metadata[token];
        }
      }
      else if (typeof this.metadata[token].endResolve === 'function') {
        currentResolve = this.metadata[token].endResolve;
        currentReject = this.metadata[token].endReject;
        this.metadata[token].removeEndCallbacks();
        currentReject(new Err.ReqlRuntimeError(helper.makeAtom(response), this.metadata[token].query, response));
        delete this.metadata[token];
      }
    }
    else if (type === responseTypes.SUCCESS_ATOM) {
      this.emit('release');
      // this.metadata[token].resolve is always a function
      datum = helper.makeAtom(response, this.metadata[token].options);

      if ((Array.isArray(datum)) &&
        ((this.metadata[token].options.cursor === true) || ((this.metadata[token].options.cursor === undefined) && (this.r._options.cursor === true)))) {
        cursor = new Cursor(self, token, this.metadata[token].options, 'cursor');
        if (this.metadata[token].options.profile === true) {
          this.metadata[token].resolve({
            profile: response.p,
            result: cursor
          });
        }
        else {
          this.metadata[token].resolve(cursor);
        }

        cursor._push({ done: true, response: { r: datum } });
      }
      else if ((Array.isArray(datum)) &&
        ((this.metadata[token].options.stream === true || this.r._options.stream === true))) {
        cursor = new Cursor(self, token, this.metadata[token].options, 'cursor');
        stream = new ReadableStream({}, cursor);
        if (this.metadata[token].options.profile === true) {
          this.metadata[token].resolve({
            profile: response.p,
            result: stream
          });
        }
        else {
          this.metadata[token].resolve(stream);
        }

        cursor._push({ done: true, response: { r: datum } });

      }
      else {
        if (this.metadata[token].options.profile === true) {
          result = {
            profile: response.p,
            result: cursor || datum
          };
        }
        else {
          result = datum;
        }
        this.metadata[token].resolve(result);
      }

      delete this.metadata[token];
    }
    else if (type === responseTypes.SUCCESS_PARTIAL) {
      // We save the current resolve function because we are going to call cursor._fetch before resuming the user's yield
      currentResolve = this.metadata[token].resolve;
      currentReject = this.metadata[token].reject;

      // We need to delete before calling cursor._push
      this.metadata[token].removeCallbacks();

      if (!this.metadata[token].cursor) { //No cursor, let's create one
        this.metadata[token].cursor = true;

        var typeResult = 'Cursor';
        var includesStates = false;;
        if (Array.isArray(response.n)) {
          for (var i = 0; i < response.n.length; i++) {
            if (response.n[i] === protodef.Response.ResponseNote.SEQUENCE_FEED) {
              typeResult = 'Feed';
            }
            else if (response.n[i] === protodef.Response.ResponseNote.ATOM_FEED) {
              typeResult = 'AtomFeed';
            }
            else if (response.n[i] === protodef.Response.ResponseNote.ORDER_BY_LIMIT_FEED) {
              typeResult = 'OrderByLimitFeed';
            }
            else if (response.n[i] === protodef.Response.ResponseNote.UNIONED_FEED) {
              typeResult = 'UnionedFeed';
            }
            else if (response.n[i] === protodef.Response.ResponseNote.INCLUDES_STATES) {
              includesStates = true;
            }
            else {
              currentReject(new Err.ReqlDriverError('Unknown ResponseNote ' + response.n[i] + ', the driver is probably out of date.'));
              return;
            }
          }
        }
        cursor = new Cursor(self, token, this.metadata[token].options, typeResult);
        if (includesStates === true) {
          cursor.setIncludesStates();
        }
        if ((this.metadata[token].options.cursor === true) || ((this.metadata[token].options.cursor === undefined) && (this.r._options.cursor === true))) {
          // Return a cursor
          if (this.metadata[token].options.profile === true) {
            currentResolve({
              profile: response.p,
              result: cursor
            });
          }
          else {
            currentResolve(cursor);
          }
        }
        else if ((this.metadata[token].options.stream === true || this.r._options.stream === true)) {
          stream = new ReadableStream({}, cursor);
          if (this.metadata[token].options.profile === true) {
            currentResolve({
              profile: response.p,
              result: stream
            });
          }
          else {
            currentResolve(stream);
          }
        }
        else if (typeResult !== 'Cursor') {
          // Return a feed
          if (this.metadata[token].options.profile === true) {
            currentResolve({
              profile: response.p,
              result: cursor
            });
          }
          else {
            currentResolve(cursor);
          }
        }
        else {
          // When we get SUCCESS_SEQUENCE, we will delete this.metadata[token].options
          // So we keep a reference of it here
          options = this.metadata[token].options;

          // Fetch everything and return an array
          cursor.toArray().then(result => {
            if (options.profile === true) {
              currentResolve({
                profile: response.p,
                result: result
              });
            }
            else {
              currentResolve(result);
            }
          }).error(currentReject);
        }
        cursor._push({ done: false, response: response });
      }
      else { // That was a continue query
        currentResolve({ done: false, response: response });
      }
    }
    else if (type === responseTypes.SUCCESS_SEQUENCE) {
      this.emit('release');

      if (typeof this.metadata[token].resolve === 'function') {
        currentResolve = this.metadata[token].resolve;
        currentReject = this.metadata[token].reject;
        this.metadata[token].removeCallbacks();
      }
      else if (typeof this.metadata[token].endResolve === 'function') {
        currentResolve = this.metadata[token].endResolve;
        currentReject = this.metadata[token].endReject;
        this.metadata[token].removeEndCallbacks();
      }

      if (!this.metadata[token].cursor) { // No cursor, let's create one
        cursor = new Cursor(self, token, this.metadata[token].options, 'Cursor');

        if ((this.metadata[token].options.cursor === true) || ((this.metadata[token].options.cursor === undefined) && (this.r._options.cursor === true))) {
          if (this.metadata[token].options.profile === true) {
            currentResolve({
              profile: response.p,
              result: cursor
            });
          }
          else {
            currentResolve(cursor);
          }

          // We need to keep the options in the else statement, so we clean it inside the if/else blocks
          delete this.metadata[token];
        }
        else if ((this.metadata[token].options.stream === true || this.r._options.stream === true)) {
          stream = new ReadableStream({}, cursor);
          if (this.metadata[token].options.profile === true) {
            currentResolve({
              profile: response.p,
              result: stream
            });
          }
          else {
            currentResolve(stream);
          }

          // We need to keep the options in the else statement, so we clean it inside the if/else blocks
          delete this.metadata[token];
        }
        else {
          cursor.toArray().then(result => {
            if (this.metadata[token].options.profile === true) {
              currentResolve({
                profile: response.p,
                result: result
              });
            }
            else {
              currentResolve(result);
            }
            delete this.metadata[token];
          }).error(currentReject);
        }
        cursor._push({ done: true, response: response });
      }
      else { // That was a continue query
        currentResolve({ done: true, response: response });
      }
    }
    else if (type === responseTypes.WAIT_COMPLETE) {
      this.emit('release');
      this.metadata[token].resolve();

      delete this.metadata[token];
    }
    else if (type === responseTypes.SERVER_INFO) {
      this.emit('release');
      datum = helper.makeAtom(response, this.metadata[token].options);
      this.metadata[token].resolve(datum);
      delete this.metadata[token];
    }

  }

  constructor(r, options, resolve, reject) {
    super();
    var self = this;
    this.r = r;

    // Set default options - We have to save them in case the user tries to reconnect
    if (!helper.isPlainObject(options)) options = {};
    this.host = options.host || r._host;
    this.port = options.port || r._port;
    this.authKey = options.authKey || r._authKey;
    this.timeoutConnect = options.timeout || r._timeoutConnect; // period in *seconds* for the connection to be opened

    if (options.db) this.db = options.db; // Pass to each query

    this.token = 1;
    this.buffer = new Buffer(0);

    this.metadata = {};
    this.open = false; // true only if the user can write on the socket
    this.timeout = null;

    var family = 'IPv4';
    if (net.isIPv6(this.host)) {
      family = 'IPv6';
    }

    var connectionArgs = {
      host: this.host,
      port: this.port,
      family: family
    };
    var tlsOptions = options.ssl || false;
    if (tlsOptions === false) {
      this.connection = net.connect(connectionArgs);
    } else {
      if (helper.isPlainObject(tlsOptions)) {
        // Copy the TLS options in connectionArgs
        helper.loopKeys(tlsOptions, (tlsOptions, key) => {
          connectionArgs[key] = tlsOptions[key];
        });
      }
      this.connection = tls.connect(connectionArgs);
    }

    this.connection.setKeepAlive(true);

    this.timeoutOpen = setTimeout(() => {
      this.connection.end(); // Send a FIN packet
      reject(new Err.ReqlDriverError('Failed to connect to ' + this.host + ':' + this.port + ' in less than ' + this.timeoutConnect + 's').setOperational());
    }, this.timeoutConnect * 1000);

    this.connection.on('end', error => {
      // We emit end or close just once
      this.connection.removeAllListeners();
      this.emit('end');
      // We got a FIN packet, so we'll just flush
      this._flush();
    });
    this.connection.on('close', error => {
      // We emit end or close just once
      clearTimeout(this.timeoutOpen);
      this.connection.removeAllListeners();
      this.emit('closed');
      // The connection is fully closed, flush (in case 'end' was not triggered)
      this._flush();
    });
    this.connection.setNoDelay();
    this.connection.once('error', error => {
      reject(new Err.ReqlDriverError('Failed to connect to ' + this.host + ':' + this.port + '\nFull error:\n' + JSON.stringify(error)).setOperational());
    });
    this.connection.on('connect', () => {
      this.connection.removeAllListeners('error');
      this.connection.on('error', (error) => {
        this.emit('error', error);
      });

      var initBuffer = new Buffer(4);
      initBuffer.writeUInt32LE(protodef.VersionDummy.Version.V0_4, 0);
      var authBuffer = new Buffer(this.authKey, 'ascii');
      var lengthBuffer = new Buffer(4);
      lengthBuffer.writeUInt32LE(authBuffer.length, 0);
      var protocolBuffer = new Buffer(4);
      protocolBuffer.writeUInt32LE(protodef.VersionDummy.Protocol.JSON, 0);
      helper.tryCatch(() => {
        this.connection.write(Buffer.concat([initBuffer, lengthBuffer, authBuffer, protocolBuffer]));
      }, (err) => {
        // The TCP connection is open, but the ReQL connection wasn't established.
        // We can just abort the whole thing
        this.open = false;
        reject(new Err.ReqlDriverError('Failed to perform handshake with ' + this.host + ':' + this.port));
      });
    });
    this.connection.once('end', () => {
      this.open = false;
    });

    this.connection.on('data', buffer => {
      this.buffer = Buffer.concat([this.buffer, buffer]);

      if (this.open == false) {
        for (var i = 0; i < this.buffer.length; i++) {
          if (buffer[i] === 0) {
            clearTimeout(this.timeoutOpen);
            var connectionStatus = buffer.slice(0, i).toString();
            if (connectionStatus === 'SUCCESS') {
              this.open = true;
              resolve(this);
            }
            else {
              reject(new Err.ReqlDriverError('Server dropped connection with message: \'' + connectionStatus + '\''));
            }
            this.buffer = buffer.slice(i + 1);
            break;
          }
        }
        this.connection.removeAllListeners('error');
        this.connection.on('error', (e) => {
          this.open = false;
        });
      }
      else {
        while (this.buffer.length >= 12) {
          var token = this.buffer.readUInt32LE(0) + 0x100000000 * this.buffer.readUInt32LE(4);
          var responseLength = this.buffer.readUInt32LE(8);

          if (this.buffer.length < 12 + responseLength) break;

          var responseBuffer = this.buffer.slice(12, 12 + responseLength);
          var response = JSON.parse(responseBuffer);

          this._processResponse(response, token);

          this.buffer = this.buffer.slice(12 + responseLength);
        }
      }
    });

    this.connection.on('timeout', buffer => {
      this.connection.open = false;
      this.emit('timeout');
    });
    this.connection.toJSON = () => '"A socket object cannot be converted to JSON due to circular references."';
  }
}

// Return the next token and update it.