rethinkdbdash
=============

<a href="https://app.wercker.com/project/bykey/10e69719c2031f4995798ddb9221c398"><img alt="Wercker status" src="https://app.wercker.com/status/10e69719c2031f4995798ddb9221c398/m/master" align="right" /></a>

An experimental (yet stable) Node.js driver for RethinkDB with promises and a connection pool.

_Note_: To use `yield` as shown in the examples, you have to start `node` unstable (>= 0.11) with
the `--harmony` flag.


### Quick start ###
-------------

- Example with promises but without generators:

```js
var r = require('rethinkdbdash')();
r.table("foo").get("bar").run().then(function(result) {
    console.log(JSON.stringify(result, null, 2));
}).error(function(err) {
    console.log(err);
});
```

- Example with callback:

```js
var r = require('rethinkdbdash')();
r.table("foo").get("bar").run(function(err, result) {
    if (err) {
        return console.log(err);
    }
    console.log(JSON.stringify(result, null, 2));
})
```


- Example wih [koa](https://github.com/koajs/koa):

```js
var app = require('koa')();
var r = require('rethinkdbdash')();

app.use(function *(){
    var result = yield r.table("foo").get("bar").run();

    this.body = JSON.stringify(result);
});

app.listen(3000);
```
Note: You have to start node with the `--harmony` flag.


- Example with [bluebird](https://github.com/petkaantonov/bluebird):

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

```
npm install rethinkdbdash
```

The `rethinkdbdash-unstable` package is a relic from the past when the driver had a dependency on `node-protobuf`.


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
    buffer: <number>, // minimum number of connections available in the pool, default 50
    max: <number>, // maximum number of connections in the pool, default 1000
    timeout: <number>, // number of seconds for a connections to be opened, default 20
    timeoutError: <number>, // wait time before reconnecting in case of an error (in ms), default 1000
    timeoutGb: <number>, // how long the pool keep a connection that hasn't been used (in ms), default 60*60*1000
    maxExponent: <number>, // the maximum timeout before trying to reconnect is 2^maxExponent*timeoutError, default 6 (~60 seconds for the longest wait)
    silent: <boolean> // console.error errors (default false)
}
```


#### Promises ####

RethinkDB official driver support both syntaxes (promises and callback) since 1.13 (used to support only callback).
Rethinkdbdash support both syntaxes (promises and callback) since 1.14 (used to support only promises).


#### Connection pool ####

Rethinkdbdash implements a connection pool and is created by default.

If you do not want to use a connection pool, iniitialize rethinkdbdash with `{pool: false}` like this:
```js
var r = require('rethinkdbdash')({pool: false});
```

You can provide options for the connection pool with the following syntax:
```js
var r = require('rethinkdbdash')({
    buffer: <number>, // minimum number of connections available in the pool, default 50
    max: <number>, // maximum number of connections in the pool, default 1000
    timeout: <number>, // number of seconds for a connections to be opened, default 20
    timeoutError: <number>, // wait time before reconnecting in case of an error (in ms), default 1000
    timeoutGb: <number>, // how long the pool keep a connection that hasn't been used (in ms), default 60*60*1000
    maxExponent: <number>, // the maximum timeout before trying to reconnect is 2^maxExponent*timeoutError, default 6 (~60 seconds for the longest wait)
    silent: <boolean> // console.error errors (default false)
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


The pool can emits emits:
- `draining`: when `drain` is called
- `queueing`: when a query is added/removed from the queue (queries waiting for a connection), the size of the queue is provided
- `size`: when the number of connections changes, the number of connections is provided
- `available-size`: when the number of available connections changes, the number of available connections is provided

__Note__: If a query returns a cursor, the connection will not be released as long as the
cursor hasn't fetched everything or has been closed.


#### Cursor ####

Rethinkdbdash automatically coerce cursor to arrays. If you need a raw cursor, you can call the
`run` command with the option `{cursor: true}`.

```js
var result = yield r.expr([1, 2, 3]).run()
console.log(JSON.stringify(result)) // print [1, 2, 3]

// Or with a cursor
var cursor = yield r.expr([1, 2, 3]).run({cursor: true})
var result = yield cursor.toArray();

console.log(JSON.stringify(result)) // print [1, 2, 3]

```


#### Errors ####
- Better backtraces

Long backtraces are split on multiple lines.  
In case the driver cannot serialize the query, it provides a better location of the error.

- Arity errors

The server may return confusing error messages when the wrong number
of arguments is provided (See [issue 2463](https://github.com/rethinkdb/rethinkdb/issues/2463) to track progress).
Rethinkdbdash tries to make up for it by catching errors before sending
the query to the server if possible.


#### Miscellaneous ####


- Maximum nesting depth

The maximum nesting depth is your documents is by default 100 (instead of 20).
You can also change this setting with:

```js
r.setNestingLevel(<number>)
```


- Maximum array length

The maximum array length in your result is by default 100000. You can change this limit with
the option `arrayLimit` in `run`, or set it per instance of `r` with:

```js
r.setArrayLimit(<number>)
```

- Performance

The tree representation of the query is built step by step and stored which avoid
recomputing it if the query is re-run.  

The code was partially optimized for v8, and is written in pure JavaScript which avoids
errors like [issue #2839](https://github.com/rethinkdb/rethinkdb/issues/2839)

- Connection

If you do not wish to use rethinkdbdash connection pool, you can implement yours. The
connections created with rethinkdbdash emits a "release" event when they receive an
error, an atom, or the end (or full) sequence.

A connection can also emit a "timeout" event if the underlying connection times out.

- `undefined` values in an object

Rethinkdbdash will ignore the keys/values where the value is `undefined`.

### Run tests ###
-------------

Update `test/config.js` if your RethinkDB instance doesn't run on the default parameters.

Run
```
npm test
```


Tests are also being run on [wercker](http://wercker.com/):
- Builds: [https://app.wercker.com/#applications/52dffe8ba4acb3ef16010ef8/tab](https://app.wercker.com/#applications/52dffe8ba4acb3ef16010ef8/tab)
- Box: 
  - Github: [https://github.com/neumino/box-rethinkdbdash](https://github.com/neumino/box-rethinkdbdash)
  - Wercker builds: [https://app.wercker.com/#applications/52dffc65a4acb3ef16010b60/tab](https://app.wercker.com/#applications/52dffc65a4acb3ef16010b60/tab)
