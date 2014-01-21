rethinkdbdash
=============

An attempt for another JavaScript driver for RethinkDB

Use
=============

Example wih koa:

```js
var app = require('koa')();
var r = require('rethinkdbdash');

app.use(function *(){
    var connection = yield r.connect();
    var result = yield r.table("foo").get("bar").run(connection);

    this.body = result;
});

app.listen(3000);
```

Example with bluebird:

```js
var Promise = require('blubird');
var r = require('rethinkdbdash');

var run = Promise.coroutine(function* () {
    var connection, result, dbName, tableName, cursor, i, confirmation, pks, table, query, now

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


What's different?
=============

- Promises with bluebird
- ReqlDriverError instances partially contain the query that leat to the error
- The query object is built little by little
- Long backtraces are split on multiple lines
- Not supported for browser
- Tested with Node 11.10 - Should work with Node >= 10.4


Roadmap
- Port node-protobuf to node 11.10 and switch the protobuf backend
- Automatic tests or port RethinkDB's polyglot tests
