var config = require('./config.js');
var r = require('../lib');
var util = require('./util.js');
var Promise = require('bluebird');
var assert = require('assert');

var uuid = util.uuid;
var connection; // global connection
var dbName;

function It(testName, generatorFn) {
    it(testName, function(done) {
        Promise.coroutine(generatorFn)(done);
    })
}

It("Init for `document-manipulation.js`", function* (done) {
    try {
        connection = yield r.connect();
        assert(connection);
        done();
    }
    catch(e) {
        done(e);
    }
})


It("`r.now` should return a date", function* (done) {
    try {
        var result = yield r.now().run(connection);
        assert(result instanceof Date);

        result = yield r.expr({a: r.now()}).run(connection);
        assert(result.a instanceof Date);

        result = yield r.expr([r.now()]).run(connection);
        result = yield result.toArray();
        assert(result[0] instanceof Date);

        result = yield r.expr([{}, {a: r.now()}]).run(connection);
        result = yield result.toArray();
        assert(result[1].a instanceof Date);

        result = yield r.expr({b: [{}, {a: r.now()}]}).run(connection);
        assert(result.b[1].a instanceof Date);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`now` is not defined after a term", function* (done) {
    try {
        var result = yield r.expr(1).now("foo").run(connection);
    }
    catch(e) {
        if (e.message === "`now` is not defined after:\nr.expr(1)") {
            done()
        }
        else {
            done(e)
        }
    }
})

It("`r.time` should return a date -- with date and time", function* (done) {
    try{
        var now = new Date();
        result = yield r.time(1986, 11, 3, 12, 0, 0, 'Z').run(connection);
        assert.equal(result instanceof Date, true)

        result = yield r.time(1986, 11, 3, 12, 20, 0, 'Z').minutes().run(connection);
        assert.equal(result, 20)

        done();
    }
    catch(e) {
        console.log(e.message);
        done(e);
    }
})

It("`r.time` should return a date -- just with a date", function* (done) {
    try {
        result = yield r.time(1986, 11, 3, 'Z').run(connection);
        result2 = yield r.time(1986, 11, 3, 0, 0, 0, 'Z').run(connection);
        assert.equal(result instanceof Date, true)

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`r.time` should throw if no argument has been given", function* (done) {
    try{
        result = yield r.time().run(connection);
    }
    catch(e) {
        if (e.message, "First argument of `time` cannot be undefined.") {
            done()
        }
        else{
            done(e);
        }
    }
})
It("`time` is not defined after a term", function* (done) {
    try {
        var result = yield r.expr(1).time(1, 2, 3, 'Z').run(connection);
    }
    catch(e) {
        if (e.message === "`time` is not defined after:\nr.expr(1)") {
            done()
        }
        else {
            done(e)
        }
    }
})

It("`epochTime` should work", function* (done) {
    try {
        now = new Date();
        result = yield r.epochTime(now.getTime()/1000).run(connection);
        assert.deepEqual(now, result);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`r.epochTime` should throw if no argument has been given", function* (done) {
    try{
        result = yield r.epochTime().run(connection);
    }
    catch(e) {
        if (e.message, "First argument of `epochTime` cannot be undefined.") {
            done()
        }
        else{
            done(e);
        }
    }
})
It("`epochTime` is not defined after a term", function* (done) {
    try {
        var result = yield r.expr(1).epochTime(Date.now()).run(connection);
    }
    catch(e) {
        if (e.message === "`epochTime` is not defined after:\nr.expr(1)") {
            done()
        }
        else {
            done(e)
        }
    }
})

It("`ISO8601` should work", function* (done) {
    try {
        result = yield r.ISO8601("1986-11-03T08:30:00-08:00").run(connection);
        assert(result, new Date(1986, 11, 3, 8, 30, 0, -8));

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`ISO8601` should work with a timezone", function* (done) {
    try {
        result = yield r.ISO8601("1986-11-03T08:30:00", {defaultTimezone: "-08:00"}).run(connection);
        assert(result, new Date(1986, 11, 3, 8, 30, 0, -8));

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`r.ISO8601` should throw if no argument has been given", function* (done) {
    try{
        result = yield r.ISO8601().run(connection);
    }
    catch(e) {
        if (e.message, "First argument of `ISO8601` cannot be undefined.") {
            done()
        }
        else{
            done(e);
        }
    }
})
It("`ISO8601` is not defined after a term", function* (done) {
    try {
        var result = yield r.expr(1).ISO8601('validISOstring').run(connection);
    }
    catch(e) {
        if (e.message === "`ISO8601` is not defined after:\nr.expr(1)") {
            done()
        }
        else {
            done(e)
        }
    }
})


It("`inTimezone` should work", function* (done) {
    try {
        result = yield r.now().inTimezone('-08:00').hours().eq(r.now().inTimezone('-09:00').hours().add(1)).run(connection);
        assert.equal(result, true);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`inTimezone` should throw if no argument has been given", function* (done) {
    try{
        result = yield r.now().inTimezone().run(connection);
    }
    catch(e) {
        if (e.message, "First argument of `inTimezone` cannot be undefined after:\nr.now()") {
            done()
        }
        else{
            done(e);
        }
    }
})

It("`timezone` should work", function* (done) {
    try {
        result = yield r.ISO8601("1986-11-03T08:30:00-08:00").timezone().run(connection);
        assert.equal(result, "-08:00");

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`during` should work", function* (done) {
    try {
        result = yield r.now().during(r.time(2013, 12, 1, "Z"), r.now().add(1000)).run(connection);
        assert.equal(result, true);

        result = yield r.now().during(r.time(2013, 12, 1, "Z"), r.now(), {leftBound: "closed", rightBound: "closed"}).run(connection);
        assert.equal(result, true);

        result = yield r.now().during(r.time(2013, 12, 1, "Z"), r.now(), {leftBound: "closed", rightBound: "open"}).run(connection);
        assert.equal(result, false);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`during` should throw if no argument has been given", function* (done) {
    try{
        result = yield r.now().during().run(connection);
    }
    catch(e) {
        if (e.message, "First argument of `during` cannot be undefined after:\nr.now()") {
            done()
        }
        else{
            done(e);
        }
    }
})
It("`during` should throw if no argument has been given", function* (done) {
    try{
        result = yield r.now().during(1).run(connection);
    }
    catch(e) {
        if (e.message, "Second argument of `during` cannot be undefined after:\nr.now()") {
            done()
        }
        else{
            done(e);
        }
    }
})
It("`date` should work", function* (done) {
    try {
        result = yield r.now().date().hours().run(connection);
        assert.equal(result, 0);
        result = yield r.now().date().minutes().run(connection);
        assert.equal(result, 0);
        result = yield r.now().date().seconds().run(connection);
        assert.equal(result, 0);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`timeOfDay` should work", function* (done) {
    try {
        result = yield r.now().timeOfDay().run(connection);
        assert(result>0);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`year` should work", function* (done) {
    try {
        result = yield r.now().year().run(connection);
        assert.equal(result, new Date().getFullYear());

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`month` should work", function* (done) {
    try {
        result = yield r.now().month().run(connection);
        assert.equal(result, new Date().getMonth()+1);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`day` should work", function* (done) {
    try {
        result = yield r.now().day().run(connection);
        assert.equal(result, new Date().getUTCDate());

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`dayOfYear` should work", function* (done) {
    try {
        result = yield r.now().dayOfYear().run(connection);
        assert(result > (new Date()).getMonth()*28+(new Date()).getUTCDate()-1);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`dayOfWeek` should work", function* (done) {
    try {
        result = yield r.now().inTimezone('-08:00').dayOfWeek().run(connection);
        assert.equal(result, new Date().getDay());

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`toISO8601` should work", function* (done) {
    try {
        result = yield r.now().toISO8601().run(connection);
        assert.equal(typeof result, "string");

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`toEpochTime` should work", function* (done) {
    try {
        result = yield r.now().toEpochTime().run(connection);
        assert.equal(typeof result, "number");

        done();
    }
    catch(e) {
        done(e);
    }
})

It("Constant terms should work", function* (done) {
    try {
        result = yield r.monday.run(connection);
        assert.equal(result, 1)

        result = yield r.expr([r.monday, r.tuesday, r.wednesday, r.thursday, r.friday, r.saturday, r.sunday, r.january, r.february, r.march, r.april, r.may, r.june, r.july, r.august, r.september, r.october, r.november, r.december]).run(connection);
        result = yield result.toArray();
        assert.deepEqual(result, [1,2,3,4,5,6,7, 1,2,3,4,5,6,7,8,9,10,11,12]);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`tochange` should work", function* (done) {
    try {
        done();
    }
    catch(e) {
        done(e);
    }
})

It("`tochange` should work", function* (done) {
    try {
        done();
    }
    catch(e) {
        done(e);
    }
})

It("`tochange` should work", function* (done) {
    try {
        done();
    }
    catch(e) {
        done(e);
    }
})

It("`tochange` should work", function* (done) {
    try {
        done();
    }
    catch(e) {
        done(e);
    }
})


It("End for `document-manipulation.js`", function* (done) {
    try {
        connection.close();
        done();
    }
    catch(e) {
        done(e);
    }
})


