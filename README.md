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

app.use(function *(){
    var connection = yield r.connect();
    var result = yield r.table("foo").get("bar").run(connection);

    this.body = JSON.stringify(result);
});

app.listen(3000);
```

Example with bluebird:

```js
var Promise = require('blubird');
var r = require('rethinkdbdash');

var run = Promise.coroutine(function* () {
    var connection, result

    try{
        connection = yield r.connect();
    }
    catch(e) {
        console.log(e);
    }

    try{
        result = yield r.table("foo").get("bar").run(connection);
        console.log(JSON.stringify(result, null, 2));
    }
    catch(e) {
        console.log(e);
    }

    connection.close();
})
```

Note: You have to start node with the `--harmony` flag.


Install
============
- Build node 0.11.10 (checkout `v0.11.10-release`) from source (binary won't work with node-protobuf (some libraries are not properly linked).
- Install rethinkdbdash with `npm`.

```
npm install rethinkdbdash
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
