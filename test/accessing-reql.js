var config = require(__dirname+'/config.js');
var r = require(__dirname+'/../lib')({pool: false});
var util = require(__dirname+'/util.js');
var assert = require('assert');

var uuid = util.uuid;
var It = util.It;

var connection; // global connection
var dbName, tableName, pks;

It("Testing `run` without connection", function* (done) {
    try {
        r.expr(1).run()
    }
    catch(e) {
        if (e.message === '`run` was called without a connection and no pool has been created after:\nr.expr(1)') {
            done()
        }
        else {
            done(e);
        }
    }
})
It("Testing `run` with connection", function* (done) {
    try {
        connection = yield r.connect(config);
        assert(connection);
        connection.close()
        yield r.expr(1).run(connection)
    }
    catch(e) {
        if (e.message === '`run` was called with a closed connection after:\nr.expr(1)') {
            done()
        }
        else {
            done(e);
        }
    }
})


It("Init for `cursor.js`", function* (done) {
    try {
        connection = yield r.connect(config);
        assert(connection);

        dbName = uuid();
        tableName = uuid();

        var result = yield r.dbCreate(dbName).run(connection);
        assert.deepEqual(result, {created:1});

        var result = yield r.db(dbName).tableCreate(tableName).run(connection);
        assert.deepEqual(result, {created:1});

        result = yield r.db(dbName).table(tableName).insert(eval('['+new Array(100).join('{}, ')+'{}]')).run(connection);
        assert.equal(result.inserted, 100);
        pks = result.generated_keys;

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`run` should use the default database", function* (done) {
    try{
        dbName = uuid();
        tableName = uuid();

        var result = yield r.dbCreate(dbName).run(connection);
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).tableCreate(tableName).run(connection);
        assert.deepEqual(result, {created: 1});

        result = yield connection.close();

        connection = yield r.connect({db: dbName, host: config.host, port: config.port, authKey: config.authKey});
        assert(connection);

        result = yield r.tableList().run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [tableName])

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`use` should work", function* (done) {
    try{
        dbName = uuid();
        tableName = uuid();

        var result = yield r.dbCreate(dbName).run(connection);
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).tableCreate(tableName).run(connection);
        assert.deepEqual(result, {created: 1});

        connection.use(dbName);

        result = yield r.tableList().run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [tableName])

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`reconnect` should work", function* (done) {
    try{
        var result = yield r.expr(1).run(connection);
        assert.equal(result, 1);

        result = yield connection.close();

        assert(connection);
        connection = yield connection.reconnect();
        assert(connection);


        result = yield r.tableList().run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [tableName])

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`reconnect` should work with options", function* (done) {
    try{
        var result = yield r.expr(1).run(connection);
        assert.equal(result, 1);

        assert(connection);
        connection = yield connection.reconnect({noreplyWait: true});
        assert(connection);

        result = yield r.expr(1).run(connection);
        assert.equal(result, 1);

        connection = yield connection.reconnect({noreplyWait: false});
        assert(connection);

        result = yield r.expr(1).run(connection);
        assert.equal(result, 1);

        connection = yield connection.reconnect();
        assert(connection);

        result = yield r.expr(1).run(connection);
        assert.equal(result, 1);


        done();
    }
    catch(e) {
        done(e);
    }
})


It("`noReplyWait` should throw", function* (done) {
    try{
        var result = yield connection.noReplyWait()
    }
    catch(e) {
        if (e.message === "Did you mean to use `noreplyWait` instead of `noReplyWait`?") {
            done();
        }
        else {
            done(e);
        }
    }

})
It("`noreplyWait` should work", function* (done) {
    try{
        var result = yield connection.noreplyWait()
        done();
    }
    catch(e) {
        done(e);
    }
})



 
It("`run` should take an argument", function* (done) {
    try {
        var result = yield connection.close();
        assert(connection);
        connection = yield r.connect(config);
        assert(connection);

        var result = yield r.expr(1).run(connection, {useOutdated: true});
        assert.equal(result, 1);

        result = yield r.expr(1).run(connection, {useOutdated: false});
        assert.equal(result, 1);

        result = yield r.expr(1).run(connection, {profile: false});
        assert.equal(result, 1);

        result = yield r.expr(1).run(connection, {profile: true});
        assert(result.profile);
        assert.equal(result.result, 1);

        result = yield r.expr(1).run(connection, {durability: "soft"});
        assert.equal(result, 1);

        result = yield r.expr(1).run(connection, {durability: "hard"});
        assert.equal(result, 1);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`run` should throw on an unrecongized argument", function* (done) {
    try {
        var result = yield r.expr(1).run(connection, {db: "db"});
    }
    catch(e) {
        if (e.message === "Unrecognized option `db` in `run`. Available options are useOutdated <bool>, durability <string>, noreply <bool>, timeFormat <string>, groupFormat: <string>, profile <bool>.") {
            done();
        }
        else{
            done(e);
        }
    }
})


It("`r()` should be a shortcut for r.expr()", function* (done) {
    try {
        var result = yield r(1).run(connection);
        assert.deepEqual(result, 1)
        done();
    }
    catch(e) {
        done(e);
    }
})

It("`timeFormat` should work", function* (done) {
    try {
        var result = yield r.now().run(connection);
        assert(result instanceof Date);

        result = yield r.now().run(connection, {timeFormat: 'native'});
        assert(result instanceof Date);

        result = yield r.now().run(connection, {timeFormat: 'raw'});
        assert.equal(result.$reql_type$, "TIME")

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`groupFormat` should work", function* (done) {
    try {
        var result = yield r.expr([{name: "Michel", grownUp: true},{name: "Laurent", grownUp: true},
            {name: "Sophie", grownUp: true},{name: "Luke", grownUp: false},{name: "Mino", grownUp: false}]).group('grownUp').run(connection, {groupFormat: "raw"});

        assert.deepEqual(result, { "$reql_type$": "GROUPED_DATA", "data": [ [ false, [ { "grownUp": false, "name": "Luke" }, { "grownUp": false, "name": "Mino" } ] ], [ true, [ { "grownUp": true, "name": "Michel" }, { "grownUp": true, "name": "Laurent" }, { "grownUp": true, "name": "Sophie" } ] ] ] })

        done();
    }
    catch(e) {
        done(e);
    }
})


It("`profile` should work", function* (done) {
    try{
        var result = yield r.expr(true).run(connection, {profile: false});
        assert(result)

        result = yield r.expr(true).run(connection, {profile: true});
        assert(result.profile)
        assert.equal(result.result, true)

        result = yield r.expr(true).run(connection, {profile: false});
        assert.equal(result, true)

        done();
    }
    catch(e){
    }
})

/* Since 1.13, the token is stored oustide the query, so this error shouldn't happen anymore
It("`connection` should extend events.Emitter and emit an error if the server failed to parse the protobuf message", function* (done) {
    try{
        connection.addListener('error', function() {
            done();
        });

        var result = yield r.expr(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1).add(1)
            .run(connection);
    }
    catch(e){
        if (e.message === "Client is buggy (failed to deserialize protobuf).\nClosing all outstanding queries...") {
            //done will be called by the listener on "error"
            //done()
        }
        else {
            done(e);
        }
    }
})
*/


It("Test error message when running a query on a closed connection", function* (done) {
    try {
        yield connection.close();
        yield r.expr(1).run(connection)
    }
    catch(e) {
        if (e.message.match('`run` was called with a closed connection after:')) {
            done();
        }
        else {
            done(e);
        }
    }
})
