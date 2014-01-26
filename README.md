rethinkdbdash
=============

<a href="https://app.wercker.com/project/bykey/10e69719c2031f4995798ddb9221c398"><img alt="Wercker status" src="https://app.wercker.com/status/10e69719c2031f4995798ddb9221c398/m" align="right" /></a>

An attempt for another JavaScript driver for RethinkDB
__Note:__ Still in development.

Use
=============

Example wih koa:

```js
var app = require('koa')();
var r = require('rethinkdbdash');
r.createPool();

app.use(function *(){
    var result = yield r.table("foo").get("bar").run();

    this.body = JSON.stringify(result);
});

app.listen(3000);
```

Example with bluebird:

```js
var Promise = require('blubird');
var r = require('rethinkdbdash');
r.createPool();

var run = Promise.coroutine(function* () {
    var result

    try{
        result = yield r.table("foo").get("bar").run();
        console.log(JSON.stringify(result, null, 2));
    }
    catch(e) {
        console.log(e);
    }
})
```

Note: You have to start node with the `--harmony` flag.


Install
============
- Build node 0.11.10 (checkout `v0.11.10-release`) from source (binaries won't work with
`node-protobuf` -- some libraries are not properly linked).
- Install rethinkdbdash with `npm`.

```
npm install rethinkdbdash
```

Documentation
============
While rethinkdbdash has almost the same syntax as the official driver, there are still
a few differences.

This section will reference all the differences. For all the other methods not
mentionned, please read the
[official driver's documentation](http://www.rethinkdb.com/api/javascript/).



The differences are:

- Module name

Import `rethinkdbdash`:
```
var r = require('rethinkdbdash');
```

- Promises

Rethinkdbdash will return a promise when a method with the official driver takes a callback.

Example with `yield`:
```js
try{
    var connection = yield r.connect();
    var cursor = yield r.table("foo").run(connection);
    var result = yield cursor.toArray();
    yield connection.close();
}
else {
    console.log(e.message);
}
```

Example `then` and `error`:
```js
r.connect().then(function(connection) {
    //...
}).error(function(e) {
    console.log(e.mssage)
})
```

- Connection pool

Rethinkdbdash implements a connection pool. You can create one with `r.createPool`.
Then you can call `run` without any arguments, or just with options.

```js
var r = require('rethinkdbdash');
r.createPool({
    min: <number>, // minimum number of connections in the pool
    max: <number>, // maximum number of connections in the pool
    bufferSize: <number>, // minimum number of connections available in the pool
    timeoutError: <number>, // wait time before reconnecting in case of an error (in ms)
    timeoutGb: <number>, // how long the pool keep a connection that hasn't been used (in ms)
});
try {
    var result = yield r.table("foo").run();
    var cursor = yield r.table("foo").run(connection);
    var result = yield cursor.toArray();
}
catch(e) {
    console.log(e.message);
}
```

__Note__: If a query returns a cursor, the connection will not be released as long as the
cursor hasn't fetch everything or has been closed.

- Errors

In case an error occured because the server cannot parse the protobuf message, the
official driver emits an `error` on the connection.
Rethinkdbdash emits an error and reject all queries running on this connection and
eventually close the connection. This is the only way now to avoid having some
part of your program hang forever.

- Maximum nesting depth

The maximum nesting depth is your documents are by default 100 (instead of 20).
You can change this setting with
```js
r.setNestingLevel(<number>)
```

Run tests
============

Update `test/config.js` if your RethinkDB instance doesn't run on the default parameters.

Run
```
mocha --harmony-generators
```


What's different?
=============

- Promises with bluebird
- ReqlDriverError instances partially contain the query that leat to the error
- The query object is built little by little
- Long backtraces are split on multiple lines
- Not supported for browser
- Tested with Node 11.10 - Should work with Node >= 10.4


Roadmap
- Pool
