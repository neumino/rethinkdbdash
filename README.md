rethinkdbdash
-------------

<a href="https://app.wercker.com/project/bykey/10e69719c2031f4995798ddb9221c398"><img alt="Wercker status" src="https://app.wercker.com/status/10e69719c2031f4995798ddb9221c398/m/master" align="right" /></a>

A Node.js driver for RethinkDB with more advanced features.

### Install

```
npm install rethinkdbdash
```

_Note_: The `rethinkdbdash-unstable` package is a relic from the past (rethinkdb < 1.13).

### Quick start

Rethinkdbdash uses almost the same API as the official driver. Please refer to
the [official driver's documentation](http://www.rethinkdb.com/api/javascript/)
for all the ReQL methods (the methods used to build the query).


The main differences are:

- You need to execute the module when you import it:

```js
var r = require('rethinkdbdash')();
// With the official driver:
// var r = require('rethinkdb');
```

- Connections are managed by the driver with an efficient connection pool.
Once you have imported the driver, you can immediately run queries,
you don't need to call `r.connect`, or pass a connection to `run`.

```js
var r = require('rethinkdbdash')();
r.table('users').get('orphee@gmail.com').run().then(function(user) {
  // ...
}).error(handleError)
```

- Cursors are coerced to arrays by default

```js
var r = require('rethinkdbdash')();
r.table('data').run().then(function(result) {
  assert(Array.isArray(result)) // true
  // With the official driver you need to call
  // result.toArray().then(function(result2) {
  //   assert(Array.isArray(result2))
  // })
});
```

#### Drop in

You can replace the official driver with rethinkdbdash by just replacing

```js
var r = require('rethinkdb');
```

With:

```js
var r = require('rethinkdbdash')({
  pool: false,
  cursor: true
});
```

If you want to take advantage of the connection pool, refer to the next section.


#### From the official driver

To switch from the official driver to rethinkdbdash and get the most of it,
here are the few things to do:

1. Change the way to import the driver.

  ```js
  var r = require('rethinkdb');
  ```

  To:

  ```js
  var r = require('rethinkdbdash')();
  // Or if you do not connect to the default local instance:
  // var r = require('rethinkdbdash')({servers: [{host: ..., port: ...}]});
  ```

2. Remove everything related to a connection:

  ```js
  r.connect({host: ..., port: ...}).then(function(connection) {
    connection.on('error', handleError);
    query.run(connection).then(function(result) {
      // console.log(result);
      connection.close();
    });
  });
  ```

  Becomes:

  ```js
  query.run().then(function(result) {
    // console.log(result);
  });
  ```

3. Remove the methods related to the cursor. This typically involves
removing `toArray`:

  ```js
  r.table('data').run(connection).then(function(cursor) {
    cursor.toArray().then(function(result) {
      // console.log(result):
    });
  });
  ```

  Becomes

  ```js
  r.table('data').run().then(function(result) {
    // console.log(result);
  });
  ```


#### Using TLS Connections

_Note_: Support for a TLS proxy is experimental.

RethinkDB does not support TLS connections to the server yet, but in case you want
to run it over an untrusted network and need encryption, you can easily run a TLS proxy
on your server with:

```js
var tls = require('tls');
var net = require('net');
var tlsOpts = {
  key: '', // You private key
  cert: '' // Public certificate
};
tls.createServer(tlsOpts, function (encryptedConnection) {
  var rethinkdbConn = net.connect({
    host: 'localhost',
    port: 28015
  });
  encryptedConnection.pipe(rethinkdbConn).pipe(encryptedConnection);
}).listen(29015);
```

And then safely connect to it with the `tls` option:

```js
var r = require('rethinkdbdash')({
  port: 29015,
  host: 'place-with-no-firewall.com',
  ssl: true
});
```

`ssl` may also be an object that will be passed as the `options` argument to
[`tls.connect`](http://nodejs.org/api/tls.html#tls_tls_connect_options_callback).


### New features and differences

Rethinkdbdash ships with a few interesting features.


#### Importing the driver

When you import the driver, as soon as you execute the module, you will create
a default connection pool (except if you pass `{pool: false}`. The options you
can pass are:

- `db`: `<string>` - The default database to use if none is mentioned.
- `user`: `<string>` - The RethinkDB user, default value is admin.
- `password`: `<string>` - The password for the user, default value is an empty string.
- `discovery`: `<boolean>` - When true, the driver will regularly pull data from the table `server_status` to
keep a list of updated hosts, default `false`
- `pool`: `<boolean>` - Set it to `false`, if you do not want to use a connection pool.
- `buffer`: `<number>` - Minimum number of connections available in the pool, default `50`
- `max`: `<number>` - Maximum number of connections available in the pool, default `1000`
- `timeout`: `<number>` - The number of seconds for a connection to be opened, default `20`
- `pingInterval`: <number> - if `> 0`, the connection will be pinged every `pingInterval` seconds, default `-1`
- `timeoutError`: `<number>` - Wait time before reconnecting in case of an error (in ms), default 1000
- `timeoutGb`: `<number>` - How long the pool keep a connection that hasn't been used (in ms), default 60\*60\*1000
- `maxExponent`: `<number>` - The maximum timeout before trying to reconnect is 2^maxExponent x timeoutError, default 6 (~60 seconds for the longest wait)
- `silent`: <boolean> - console.error errors, default `false`
- `servers`: an array of objects `{host: <string>, port: <number>}` representing RethinkDB nodes to connect to
- `optionalRun`: <boolean> - if `false`, yielding a query will not run it, default `true`
- `log`: <function> - will be called with the log events by the pool master

In case of a single instance, you can directly pass `host` and `port` in the top level parameters.

Examples:

```js
// connect to localhost:8080, and let the driver find other instances
var r = require('rethinkdbdash')({
    discovery: true
});

// connect to and only to localhost:8080
var r = require('rethinkdbdash')();

// Do not create a connection pool
var r = require('rethinkdbdash')({pool: false});

// Connect to a cluster seeding from `192.168.0.100`, `192.168.0.101`, `192.168.0.102`
var r = require('rethinkdbdash')({
    servers: [
        {host: '192.168.0.100', port: 28015},
        {host: '192.168.0.101', port: 28015},
        {host: '192.168.0.102', port: 28015},
    ]
});

// Connect to a cluster containing `192.168.0.100`, `192.168.0.100`, `192.168.0.102` and
// use a maximum of 3000 connections and try to keep 300 connections available at all time.
var r = require('rethinkdbdash')({
    servers: [
        {host: '192.168.0.100', port: 28015},
        {host: '192.168.0.101', port: 28015},
        {host: '192.168.0.102', port: 28015},
    ],
    buffer: 300,
    max: 3000
});
```

You can also pass `{cursor: true}` if you want to retrieve RethinkDB streams as cursors
and not arrays by default.

_Note_: The option `{stream: true}` that asynchronously returns a stream is deprecated. Use `toStream` instead.

_Note_: The option `{optionalRun: false}` will disable the optional run for all instances of the driver.

_Note_: Connections are created with TCP keep alive turned on, but some routers seem to ignore this setting. To make
sure that your connections are kept alive, set the `pingInterval` to the interval in seconds you want the
driver to ping the connection.

_Note_: The error `__rethinkdbdash_ping__` is used for internal purposes (ping). Do not use it.

#### Connection pool

As mentioned before, `rethinkdbdash` has a connection pool and manage all the connections
itself. The connection pool is initialized as soon as you execute the module.

You should never have to worry about connections in rethinkdbdash. Connections are created
as they are needed, and in case of a host failure, the pool will try to open connections with an
exponential back off algorithm.

The driver execute one query per connection. Now that [rethinkdb/rethinkdb#3296](https://github.com/rethinkdb/rethinkdb/issues/3296)
is solved, this behavior may be changed in the future.

Because the connection pool will keep some connections available, a script will not
terminate. If you have finished executing your queries and want your Node.js script
to exit, you need to drain the pool with:

```js
r.getPoolMaster().drain();
```

The pool master by default will log all errors/new states on `stderr`. If you do not
want to pollute `stderr`, pass `silent: true` when you import the driver and
provide your own `log` method.

```js
r = require('rethinkdbdash')({
  silent: true,
  log: function(message) {
    console.log(message);
  }
});
```

##### Advanced details about the pool

The pool is composed of a `PoolMaster` that retrieve connections for `n` pools where `n` is the number of
servers the driver is connected to. Each pool is connected to a unique host.

To access the pool master, you can call the method `r.getPoolMaster()`.

The pool emits a few events:
- `draining`: when `drain` is called
- `queueing`: when a query is added/removed from the queue (queries waiting for a connection), the size of the queue is provided
- `size`: when the number of connections changes, the number of connections is provided
- `available-size`: when the number of available connections changes, the number of available connections is provided

You can get the number of connections (opened or being opened).
```js
r.getPoolMaster().getLength();
```

You can also get the number of available connections (idle connections, without
a query running on it).

```js
r.getPoolMaster().getAvailableLength();
```

You can also drain the pool as mentionned earlier with;

```js
r.getPoolMaster().drain();
```

You can access all the pools with:
```js
r.getPoolMaster().getPools();
```

The pool master emits the `healthy` when its state change. Its state is defined as:
- healthy when at least one pool is healthy: Queries can be immediately executed or will be queued.
- not healthy when no pool is healthy: Queries will immediately fail.

A pool being healthy is it has at least one available connection, or it was just
created and opening a connection hasn't failed.

```js
r.getPoolMaster().on('healthy', function(healthy) {
  if (healthy === true) {
    console.log('We can run queries.');
  }
  else {
    console.log('No queries can be run.');
  }
});
```


##### Note about connections

If you do not wish to use rethinkdbdash connection pool, you can implement yours. The
connections created with rethinkdbdash emits a "release" event when they receive an
error, an atom, or the end (or full) sequence.

A connection can also emit a "timeout" event if the underlying connection times out.


#### Arrays by default, not cursors

Rethinkdbdash automatically coerce cursors to arrays. If you need a raw cursor,
you can call the `run` command with the option `{cursor: true}` or import the
driver with `{cursor: true}`.

```js
r.expr([1, 2, 3]).run().then(function(result) {
  console.log(JSON.stringify(result)) // print [1, 2, 3]
})
```

```js
r.expr([1, 2, 3]).run({cursor: true}).then(function(cursor) {
  cursor.toArray().then(function(result) {
    console.log(JSON.stringify(result)) // print [1, 2, 3]
  });
})
```

__Note__: If a query returns a cursor, the connection will not be
released as long as the cursor hasn't fetched everything or has been closed.


#### Readable streams

[Readable streams](http://nodejs.org/api/stream.html#stream_class_stream_readable) can be
synchronously returned with the `toStream([connection])` method.

```js
var fs = require('fs');
var file = fs.createWriteStream('file.txt');

var r = require('rethinkdbdash')();
r.table('users').toStream()
  .on('error', console.log)
  .pipe(file)
  .on('error', console.log)
  .on('end', function() {
    r.getPool().drain();
  });
```

_Note:_ The stream will emit an error if you provide it with a single value (streams, arrays
and grouped data work fine).

_Note:_ `null` values are currently dropped from streams.

#### Writable and Transform streams

You can create a [Writable](http://nodejs.org/api/stream.html#stream_class_stream_writable)
or [Transform](http://nodejs.org/api/stream.html#stream_class_stream_transform) streams by
calling `toStream([connection, ]{writable: true})` or
`toStream([connection, ]{transform: true})` on a table.

By default, a transform stream will return the saved documents. You can return the primary
key of the new document by passing the option `format: 'primaryKey'`.

This makes a convenient way to dump a file your database.

```js
var file = fs.createReadStream('users.json')
var table = r.table('users').toStream({writable: true});

file.pipe(transformer) // transformer would be a Transform stream that splits per line and call JSON.parse
    .pipe(table)
    .on('finish', function() {
        console.log('Done');
        r.getPool().drain();
    });
```


#### Optional `run` with `yield`

The `then` and `catch` methods are implemented on a `Term` - returned by any methods
like `filter`, `update` etc. They are shortcut for `this.run().then(callback)` and
`this.run().catch(callback)`.

This means that you can `yield` any query without calling `run.`

```js
var bluebird = require('bluebird');
var r = require('rethinkdbdash')();

bluebird.coroutine(function*() {
  try {
    var result = yield r.table('users').get('orphee@gmail.com').update({name: 'Michel'});
    assert.equal(result.errors, 0);
  } catch(err) {
    console.log(err);
  }
});
```

_Note_: You have to start Node >= 0.11 with the `--harmony` flag.


#### Global default values

You can set the maximum nesting level and maximum array length on all your queries with:

```js
r.setNestingLevel(<number>)
```

```js
r.setArrayLimit(<number>)
```

#### Undefined values

Rethinkdbdash will ignore the keys/values where the value is `undefined` instead
of throwing an error like the official driver.


#### Better errors


##### Backtraces

If your query fails, the driver will return an error with a backtrace; your query
will be printed and the broken part will be highlighted.

Backtraces in rethinkdbdash are tested and properly formatted. Typically, long backtraces
are split on multiple lines and if the driver cannot serialize the query,
it will provide a better location of the error.


##### Arity errors

The server may return confusing error messages when the wrong number
of arguments is provided (See [rethinkdb/rethinkdb#2463](https://github.com/rethinkdb/rethinkdb/issues/2463) to track progress).
Rethinkdbdash tries to make up for it by catching errors before sending
the query to the server if possible.


#### Performance

The tree representation of the query is built step by step and stored which avoid
recomputing it if the query is re-run.  

The code was partially optimized for v8, and is written in pure JavaScript which avoids
errors like [issue #2839](https://github.com/rethinkdb/rethinkdb/issues/2839)


### Run tests

Update `test/config.js` if your RethinkDB instance doesn't run on the default parameters.

Make sure you run a version of Node that supports generators and run:
```
npm test
```

Longer tests for the pool:

```
mocha long_test/discovery.js -t 50000
mocha long_test/static.js -t 50000
```


Tests are also being run on [wercker](http://wercker.com/):
- Builds: [https://app.wercker.com/#applications/52dffe8ba4acb3ef16010ef8/tab](https://app.wercker.com/#applications/52dffe8ba4acb3ef16010ef8/tab)
- Box: 
  - Github: [https://github.com/neumino/box-rethinkdbdash](https://github.com/neumino/box-rethinkdbdash)
  - Wercker builds: [https://app.wercker.com/#applications/52dffc65a4acb3ef16010b60/tab](https://app.wercker.com/#applications/52dffc65a4acb3ef16010b60/tab)


### FAQ

- __Why rethinkdbdash?__

  Rethinkdbdash was built as an experiment for promises and a connection pool. Its
  purpose was to test new features and improve the official driver. Today,
  rethinkdbdash still tries to make the developer experience as pleasant as possible -
  like with the recent support for Node.js streams.

  Some features like promises have been back ported to the official driver, some like
  the connection pool and streams are on their way.


- __Is it stable?__

  Yes. Rethinkdbdash is used by quite many people. The driver is also used by `thinky`,
  and has been and is still being tested in the wild.


- __Does it work with io.js?__

  All the tests pass with io.js so yes.


- __Is rethinkdbdash going to become the JavaScript official driver?__

  Not (yet?), maybe :)

  Completely replacing the driver requires some work:
  - Integrate the driver in RethinkDB suite test.
  - Support HTTP connections.
  - Rollback some default like the coercion of cursors to arrays.


- __Can I contribute?__

  Feel free to send a pull request. If you want to implement a new feature, please open
  an issue first, especially if it's a non backward compatible one.

### Browserify

To build the browser version of rethinkdbdash, run:

```
node browserify.js
```
