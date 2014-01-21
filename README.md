rethinkdbdash
=============

An attempt for another JavaScript driver for RethinkDB

Use
=============

```
var app = require('koa')();
var r = require('rethinkdbdash');

// response

app.use(function *(){
    var connection = yield r.connect();
    var result = yield r.table("foo").get("bar").run(connection);

    this.body = result;
});

app.listen(3000);
```

What's different?
=============

- Promises with bluebird
- ReqlDriverError instances partially contain the query that leat to the error
- The query object is built little by little
- Long backtraces are split on multiple lines
- Not supported for browser


Roadmap
- Port node-protobuf to node 11.10 and switch the protobuf backend
- Automatic tests or port RethinkDB's polyglot tests
