var config = require(__dirname+'/config.js');
var r = require(__dirname+'/../lib')(config);
var util = require(__dirname+'/util/common.js');
var assert = require('assert');

var uuid = util.uuid;
var It = util.It;

var uuid = util.uuid;
var dbName, tableName, result;


It("Init for `manipulating-databases.js`", function* (done) {
    try {
        result = yield r.expr(1).run();
        assert(result, 1);
        done();
    }
    catch(e) {
        done(e);
    }
})

It("`dbList` should return a cursor", function* (done) {
    try {
        result = yield r.dbList().run();
        assert(Array.isArray(result));
        done();
    }
    catch(e) {
        done(e);
    }
})

It("'`dbCreate` should create a database'", function* (done) {
    try {
        dbName = uuid(); // export to the global scope

        result = yield r.dbCreate(dbName).run();
        assert.equal(result.dbs_created, 1);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`dbCreate` should throw if no argument is given", function* (done) {
    try {
        result = yield r.dbCreate().run();
    }
    catch(e) {
        if (e.message === "`dbCreate` takes 1 argument, 0 provided.") {
            done()
        }
        else {
            done(e)
        }
    }
})
It("`dbCreate` is not defined after a term", function* (done) {
    try {
        result = yield r.expr(1).dbCreate("foo").run();
    }
    catch(e) {
        if (e.message === "`dbCreate` is not defined after:\nr.expr(1)") {
            done()
        }
        else {
            done(e)
        }
    }
})
It("`dbCreate` is not defined after a term", function* (done) {
    try {
        result = yield r.expr(1).db("foo").run();
    }
    catch(e) {
        if (e.message === "`db` is not defined after:\nr.expr(1)") {
            done()
        }
        else {
            done(e)
        }
    }
})
It("'`db` should throw is the name contains special char'", function* (done) {
    try {
        result = yield r.db("-_-").run();
    }
    catch(e) {
        if (e.message.match(/Database name `-_-` invalid \(Use A-Za-z0-9_ only\)/)) { done(); }
        else { done(e); }
    }
})
It("`dbList` should show the database we created", function* (done) {
    try {
        result = yield r.dbList().run();
        assert(Array.isArray(result));

        var found = false;
        for(var i=0; i<result.length; i++) {
            if (result[i] === dbName) {
                found = true; 
                break;
            }
        };

        if (found === false) done(new Error("Previously created database not found."))
        done();
    }
    catch(e) {
        done(e);
    }
})
It("`dbDrop` should drop a table", function* (done) {
    try {
        result = yield r.dbDrop(dbName).run();
        assert.deepEqual(result.dbs_dropped, 1);

        done();
    }
    catch(e) {
        console.log(e);
        done(e);
    }
})
It("`dbDrop` should throw if no argument is given", function* (done) {
    try {
        result = yield r.dbDrop("foo", "bar", "ette").run();
    }
    catch(e) {
        if (e.message === "`dbDrop` takes 1 argument, 3 provided.") {
            done()
        }
        else {
            done(e)
        }
    }
})
It("`dbDrop` should throw if no argument is given", function* (done) {
    try {
        result = yield r.dbDrop().run();
    }
    catch(e) {
        if (e.message === "`dbDrop` takes 1 argument, 0 provided.") {
            done()
        }
        else {
            done(e)
        }
    }
})
It("`dbDrop` is not defined after a term", function* (done) {
    try {
        result = yield r.expr(1).dbDrop("foo").run();
    }
    catch(e) {
        if (e.message === "`dbDrop` is not defined after:\nr.expr(1)") {
            done()
        }
        else {
            done(e)
        }
    }
})
It("`dbList` is not defined after a term", function* (done) {
    try {
        result = yield r.expr(1).dbList("foo").run();
    }
    catch(e) {
        if (e.message === "`dbList` is not defined after:\nr.expr(1)") {
            done()
        }
        else {
            done(e)
        }
    }
})


It("`dbList` shouldn't show the database we dropped", function* (done) {
    try {
        result = yield r.dbList().run();
        assert(Array.isArray(result));

        var found = false;
        for(var i=0; i<result.length; i++) {
            if (result[i] === dbName) {
                found = true; 
                break;
            }
        };

        if (found === true) done(new Error("Previously dropped database found."))
        done();
    }
    catch(e) {
        done(e);
    }
})
