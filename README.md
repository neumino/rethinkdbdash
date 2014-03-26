rethinkdbdash
=============

<a href="https://app.wercker.com/project/bykey/10e69719c2031f4995798ddb9221c398"><img alt="Wercker status" src="https://app.wercker.com/status/10e69719c2031f4995798ddb9221c398/m/master" align="right" /></a>

A Node.js driver for RethinkDB with promises and a connection pool.

Status: Beta


### Quick start ###
-------------

Example wih [koa](https://github.com/koajs/koa):

```js
var app = require('koa')();
var r = require('rethinkdbdash')();

app.use(function *(){
    var result = yield r.table("foo").get("bar").run();

    this.body = JSON.stringify(result);
});

app.listen(3000);
```

Example with [bluebird](https://github.com/petkaantonov/bluebird):

```js
var Promise = require('bluebird');
var r = require('rethinkdbdash')();

var run = Promise.coroutine(function* () {
    var result

    try{
        result = yield r.table("foo").get("bar").run();
        console.log(JSON.stringify(result, null, 2));
    }
    catch(e) {
        console.log(e);
    }
})();
```

Note: You have to start node with the `--harmony` flag.


### Install ###
-------------
- Build node 0.11.10 (checkout `v0.11.10-release`) from source.  
Binaries won't work with `node-protobuf` -- some libraries are not properly linked.
- Install the `libprotobuf` binary and development files (required to build `node-protobuf` in the next step).
- Install rethinkdbdash with `npm`.

```
npm install rethinkdbdash
```


### Documentation ###
-------------
While rethinkdbdash uses almost the same syntax as the official driver, there are still
a few differences.

This section references all the differences. For all the other methods not
mentionned here, please refer to the
[official driver's documentation](http://www.rethinkdb.com/api/javascript/).



The differences are:

#### Module name ####

Import rethinkdbdash:
```js
var r = require('rethinkdbdash')(options);
```

`options` can be:
- `{pool: false}` -- if you do not want to use a connection pool.
- the options for the connection pool, which can be:

```js
{
    min: <number>, // minimum number of connections in the pool, default 50
    max: <number>, // maximum number of connections in the pool, default 1000
    bufferSize: <number>, // minimum number of connections available in the pool, default 50
    timeoutError: <number>, // wait time before reconnecting in case of an error (in ms), default 1000
    timeoutGb: <number>, // how long the pool keep a connection that hasn't been used (in ms), default 60*60*1000
}
```


#### Promises ####

Rethinkdbdash returns a bluebird promise when a method with the official driver
takes a callback.

Example 1 with `yield`:
```js
try{
    var cursor = yield r.table("foo").run();
    var result = yield cursor.toArray();
    //process(result);
}
else {
    console.log(e.message);
}
```

Example 2 with `yield`:
```js
try{
    var cursor = yield r.table("foo").run();
    var row;
    while(cursor.hasNext()) {
        row = yield cursor.next();
        //process(row);
    }
}
else {
    console.log(e.message);
}
```

Example with `then` and `error`:
```js
r.table("foo").run().then(function(connection) {
    //...
}).error(function(e) {
    console.log(e.mssage)
})
```


#### Connection pool ####

Rethinkdbdash implements a connection pool and is created by default.

If you do not want to use a connection pool, iniitialize rethinkdbdash with `{pool: false}` like that:
```js
var r = require('rethinkdbdash)({pool: false});
```

You can provide options for the connection pool with the following syntax:
```js
var r = require('rethinkdbdash')({
    min: <number>, // minimum number of connections in the pool, default 50
    max: <number>, // maximum number of connections in the pool, default 1000
    bufferSize: <number>, // minimum number of connections available in the pool, default 50
    timeoutError: <number>, // wait time before reconnecting in case of an error (in ms), default 1000
    timeoutGb: <number>, // how long the pool keep a connection that hasn't been used (in ms), default 60*60*1000
});

try {
    var cursor = yield r.table("foo").run();
    var result = yield cursor.toArray(); // The connection used in the cursor will be released when all the data will be retrieved
}
catch(e) {
    console.log(e.message);
}
```

Get the number of connections
```js
r.getPool().getLength();
```

Get the number of available connections
```js
r.getPool().getAvailableLength();
```

Drain the pool
```js
r.getPool().drain();
```


__Note__: If a query returns a cursor, the connection will not be released as long as the
cursor hasn't fetched everything or has been closed.




#### Cursor ####

Rethinkdbdash does not extend `Array` with methods and returns a cursor as long as your
result is a sequence.

```js
var cursor = yield r.expr([1, 2, 3]).run()
console.log(JSON.stringify(cursor)) // does *not* print [1, 2, 3]

var result = yield cursor.toArray();
console.log(JSON.stringify(result)) // print [1, 2, 3]
```


#### Errors ####
- Better backtraces

Long backtraces are split on multiple lines.  
In case the driver cannot parse the query, it provides a better location of the error.

- Different handling for queries that cannot be parsed on the server.

In case an error occured because the server cannot parse the protobuf message, the
official driver emits an `error` on the connection.  
Rethinkdbdash emits an error and rejects all queries running on this connection and
close the connection. This is the only way now to avoid having some part of your
program hang forever.


#### Miscellaneous ####


- Maximum nesting depth

The maximum nesting depth is your documents is by default 100 (instead of 20).
You can change this setting with

```js
r.setNestingLevel(<number>)
```

- Performance

The tree representation of the query is built step by step and stored which avoid
recomputing it if the query is re-run.  
`exprJSON`, internal method used by `insert`, is more efficient in the worst case.

- Connection

If you do not wish to use rethinkdbdash connection pool, you can implement yours. The
connections created with rethinkdbdash emits a "release" event when they receive an
error, an atom, or the end (or full) sequence.

A connection can also emit a "timeout" event if the underlying connection times out.

### Run tests ###
-------------

Update `test/config.js` if your RethinkDB instance doesn't run on the default parameters.

Run
```
mocha --harmony-generators
```


Tests are also being run on [wercker](http://wercker.com/):
- Builds: [https://app.wercker.com/#applications/52dffe8ba4acb3ef16010ef8/tab](https://app.wercker.com/#applications/52dffe8ba4acb3ef16010ef8/tab)
- Box: 
  - Github: [https://github.com/neumino/box-rethinkdbdash](https://github.com/neumino/box-rethinkdbdash)
  - Wercker builds: [https://app.wercker.com/#applications/52dffc65a4acb3ef16010b60/tab](https://app.wercker.com/#applications/52dffc65a4acb3ef16010b60/tab)


### Roadmap ###
============
- Pre-serialize a query (not sure if possible though)
