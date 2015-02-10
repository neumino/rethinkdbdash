rethinkdbdash
-------------

<a href="https://app.wercker.com/project/bykey/10e69719c2031f4995798ddb9221c398"><img alt="Wercker status" src="https://app.wercker.com/status/10e69719c2031f4995798ddb9221c398/m/master" align="right" /></a>

An Node.js driver for RethinkDB with more advanced features.

### Install
=============

```
npm install rethinkdbdash
```

The `rethinkdbdash-unstable` package is a relic from the past when the driver had a dependency on `node-protobuf`.



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

- RethinkDB streams are coerced to arrays by default

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


### From the official driver

To switch from the official driver to rethinkdbdash and get the most of it,
here are the few things to do:

1. Change the way to import the driver.

```js
var r = require('rethinkdb');
```

To:

```js
var r = require('rethinkdbdash')();
// Or if you do not connect to the local default instance:
// var r = require('rethinkdbdash')({host: ..., port: ...});
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



### New features and differences ###

Rethinkdbdash ships with a few interesting features.


#### Importing the driver

When you import the driver, as soon as you execute the module, you will create
a default connection pool (except if you pass `{pool: false}`. The options you
can pass are:

- `{pool: false}` -- if you do not want to use a connection pool.
- the options for the connection pool, which can be:

```js
{
    buffer: <number>, // minimum number of connections available in the pool, default 50
    max: <number>, // maximum number of connections in the pool, default 1000
    timeout: <number>, // number of seconds for a connection to be opened, default 20
    timeoutError: <number>, // wait time before reconnecting in case of an error (in ms), default 1000
    timeoutGb: <number>, // how long the pool keep a connection that hasn't been used (in ms), default 60*60*1000
    maxExponent: <number>, // the maximum timeout before trying to reconnect is 2^maxExponent*timeoutError, default 6 (~60 seconds for the longest wait)
    silent: <boolean> // console.error errors (default false)
}
```

You can also pass `{cursor: true}` if you want to retrieve RethinkDB streams as cursors
and not arrays by default.

_Note_: The option `{stream: true}` that asynchronously returns a stream is deprecated. Use `toStream` instead.

#### Connection pool

As mentionned before, `rethinkdbdash` has a connection pool and manage the connection
itself. The connection pool is initialized as soon as you execute the module, which
is why all the options for the connection pool should be passed there.

In the common case, you never have to worry about the connection pool. It will create
connection as it needs respecting the constraints provided. In case the RethinkDB server
is not available, it will retry using an exponential back off algorithm.

Because the connection pool will keep some connections available, your script will not
terminate. If you have finished executing your queries and want your Node.js script
to exit, you need to drain the pool with:

```js
r.getPool().drain();
```


##### Advanced details about the pool

To access the pool, you can call the method `r.getPool()`.

The pool can emits a few events:
- `draining`: when `drain` is called
- `queueing`: when a query is added/removed from the queue (queries waiting for a connection), the size of the queue is provided
- `size`: when the number of connections changes, the number of connections is provided
- `available-size`: when the number of available connections changes, the number of available connections is provided


You can get the number of connections (opened or being opened).
```js
r.getPool().getLength();
```

You can also get the number of available connections (idle connections, without
a query running on it).

```js
r.getPool().getAvailableLength();
```

You can also drain the pool as mentionned earlier with;

```js
r.getPool().drain();
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
var result = yield r.expr([1, 2, 3]).run()
console.log(JSON.stringify(result)) // print [1, 2, 3]
```

```js
// Or with a cursor
var cursor = r.expr([1, 2, 3]).run({cursor: true})
cursor.toArray().then(function(result) {
  console.log(JSON.stringify(result)) // print [1, 2, 3]
});
```

__Note__: If a query returns a cursor, the connection will not be
released as long as the cursor hasn't fetched everything or has been closed.


#### Readable streams

2. Cursors can be returned as [Readable streams](http://nodejs.org/api/stream.html#stream_class_stream_readable) thanks
to the `toStream()` method.

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

_Note:_ The stream will emit an error if you provide it with a single value (arrays and grouped data
work fine).

_Note:_ `null` values are currently dropped from streams.

##### Writable and Transform streams

You can create a [Writable](http://nodejs.org/api/stream.html#stream_class_stream_writable)
or [Transform](http://nodejs.org/api/stream.html#stream_class_stream_transform) streams by
calling `toStream({writable: true})` or
`toStream({transform: true})` on a table.

This makes a convenient way to dump data from multiple places without having to worry
about batching them. The writable streams will sequentially insert data, but may insert
the data in batch.

```
var logs = r.table('logs').toStream({writable: true});

http.createServer(function (req, res) {
  logs.write(req); // log the request

  // Send back "Hello World"
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end("Hello World");
}).listen(8080);
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

Backtraces in rethinkdbdash are tested and properly formatted. For example long backtraces
are split on multiple lines and if the driver cannot serialize the query,
it will provide a better location of the error.


##### Arity errors

The server may return confusing error messages when the wrong number
of arguments is provided (See [issue 2463](https://github.com/rethinkdb/rethinkdb/issues/2463) to track progress).
Rethinkdbdash tries to make up for it by catching errors before sending
the query to the server if possible.


#### Performance

The tree representation of the query is built step by step and stored which avoid
recomputing it if the query is re-run.  

The code was partially optimized for v8, and is written in pure JavaScript which avoids
errors like [issue #2839](https://github.com/rethinkdb/rethinkdb/issues/2839)




### Run tests

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
