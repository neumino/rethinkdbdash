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



### New features and differences

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

As mentionned before, `rethinkdbdash` has a connection pool and manage all the connections
itself. The connection pool is initialized as soon as you execute the module.

You should never have to worry about connections in rethinkdbdash. Connections are created
as they are needed, and in case of failure, the pool will try to open connections with an
exponential back off algorithm.

The driver will execute one query per connection as queries are not executed in parallel
on a single connection at the moment - [rethinkdb/rethinkdb#3296](https://github.com/rethinkdb/rethinkdb/issues/3296).

Because the connection pool will keep some connections available, a script will not
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
r.expr([1, 2, 3]).run().then(function(result) {
  console.log(JSON.stringify(result)) // print [1, 2, 3]
})
```

```js
r.expr([1, 2, 3]).run({cursor: true}).then(function(result) {
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

  Because I would like to give rethinkdbdash to RethinkDB, I would like to
  keep ownership of the code (mostly because I don't like dealing with legal stuff).
  So I would rather not merge pull requests. That being said, feedback,
  bug reports etc. are welcome!

  If you want to write code, come help with [thinky](https://github.com/neumino/thinky)!
