var config = require(__dirname+'/config.js');
var r = require(__dirname+'/../lib')(config);
var util = require(__dirname+'/util/common.js');
var assert = require('assert');

var uuid = util.uuid;
var It = util.It;

var uuid = util.uuid;
var dbName, tableName, result, result2;


It('`r.now` should return a date', function* (done) {
  try {
    result = yield r.now().run();
    assert(result instanceof Date);

    result = yield r.expr({a: r.now()}).run();
    assert(result.a instanceof Date);

    result = yield r.expr([r.now()]).run();
    assert(result[0] instanceof Date);

    result = yield r.expr([{}, {a: r.now()}]).run();
    assert(result[1].a instanceof Date);

    result = yield r.expr({b: [{}, {a: r.now()}]}).run();
    assert(result.b[1].a instanceof Date);

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`now` is not defined after a term', function* (done) {
  try {
    result = yield r.expr(1).now("foo").run();
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

It('`r.time` should return a date -- with date and time', function* (done) {
  try{
    var now = new Date();
    var result = yield r.time(1986, 11, 3, 12, 0, 0, 'Z').run();
    assert.equal(result instanceof Date, true)

    result = yield r.time(1986, 11, 3, 12, 20, 0, 'Z').minutes().run();
    assert.equal(result, 20)

    done();
  }
  catch(e) {
    done(e);
  }
})

It('`r.time` should work with r.args', function* (done) {
  try{
    var now = new Date();
    var result = yield r.time(r.args([1986, 11, 3, 12, 0, 0, 'Z'])).run();
    assert.equal(result instanceof Date, true)

    done();
  }
  catch(e) {
    done(e);
  }
})

It('`r.time` should return a date -- just with a date', function* (done) {
  try {
    var result = yield r.time(1986, 11, 3, 'Z').run();
    var result2 = yield r.time(1986, 11, 3, 0, 0, 0, 'Z').run();
    assert.equal(result instanceof Date, true)

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`r.time` should throw if no argument has been given', function* (done) {
  try{
    var result = yield r.time().run();
  }
  catch(e) {
    if (e.message === "`r.time` called with 0 argument.\n`r.time` takes 4 or 7 arguments") {
      done()
    }
    else{
      done(e);
    }
  }
})
It('`r.time` should throw if no 5 arguments', function* (done) {
  try{
    var result = yield r.time(1, 1, 1, 1, 1).run();
  }
  catch(e) {
    if (e.message === "`r.time` called with 5 arguments.\n`r.time` takes 4 or 7 arguments") {
      done()
    }
    else{
      done(e);
    }
  }
})

It('`time` is not defined after a term', function* (done) {
  try {
    result = yield r.expr(1).time(1, 2, 3, 'Z').run();
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

It('`epochTime` should work', function* (done) {
  try {
    var now = new Date();
    result = yield r.epochTime(now.getTime()/1000).run();
    assert.deepEqual(now, result);

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`r.epochTime` should throw if no argument has been given', function* (done) {
  try{
    var result = yield r.epochTime().run();
  }
  catch(e) {
    if (e.message === "`r.epochTime` takes 1 argument, 0 provided.") {
      done()
    }
    else{
      done(e);
    }
  }
})
It('`epochTime` is not defined after a term', function* (done) {
  try {
    result = yield r.expr(1).epochTime(Date.now()).run();
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

It('`ISO8601` should work', function* (done) {
  try {
    var result = yield r.ISO8601("1986-11-03T08:30:00-08:00").run();
    assert(result, new Date(1986, 11, 3, 8, 30, 0, -8));

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`ISO8601` should work with a timezone', function* (done) {
  try {
    var result = yield r.ISO8601("1986-11-03T08:30:00", {defaultTimezone: "-08:00"}).run();
    assert(result, new Date(1986, 11, 3, 8, 30, 0, -8));

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`r.ISO8601` should throw if no argument has been given', function* (done) {
  try{
    var result = yield r.ISO8601().run();
  }
  catch(e) {
    if (e.message === "`r.ISO8601` takes at least 1 argument, 0 provided.") {
      done()
    }
    else{
      done(e);
    }
  }
})
It('`r.ISO8601` should throw if too many arguments', function* (done) {
  try{
    var result = yield r.ISO8601(1, 1, 1).run();
  }
  catch(e) {
    if (e.message === "`r.ISO8601` takes at most 2 arguments, 3 provided.") {
      done()
    }
    else{
      done(e);
    }
  }
})

It('`ISO8601` is not defined after a term', function* (done) {
  try {
    result = yield r.expr(1).ISO8601('validISOstring').run();
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

It('`inTimezone` should work', function* (done) {
  try {
    var result = yield r.now().inTimezone('-08:00').hours().do(function(h) {
      return r.branch(
        h.eq(0),
        r.expr(23).eq(r.now().inTimezone('-09:00').hours()),
        h.eq(r.now().inTimezone('-09:00').hours().add(1))
      )
    }).run()
    assert.equal(result, true);

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`inTimezone` should throw if no argument has been given', function* (done) {
  try{
    var result = yield r.now().inTimezone().run();
  }
  catch(e) {
    if (e.message === "`inTimezone` takes 1 argument, 0 provided after:\nr.now()") {
      done()
    }
    else{
      done(e);
    }
  }
})

It('`timezone` should work', function* (done) {
  try {
    var result = yield r.ISO8601("1986-11-03T08:30:00-08:00").timezone().run();
    assert.equal(result, "-08:00");

    done();
  }
  catch(e) {
    done(e);
  }
})

It('`during` should work', function* (done) {
  try {
    var result = yield r.now().during(r.time(2013, 12, 1, "Z"), r.now().add(1000)).run();
    assert.equal(result, true);

    result = yield r.now().during(r.time(2013, 12, 1, "Z"), r.now(), {leftBound: "closed", rightBound: "closed"}).run();
    assert.equal(result, true);

    result = yield r.now().during(r.time(2013, 12, 1, "Z"), r.now(), {leftBound: "closed", rightBound: "open"}).run();
    assert.equal(result, false);

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`during` should throw if no argument has been given', function* (done) {
  try{
    var result = yield r.now().during().run();
  }
  catch(e) {
    if (e.message === "`during` takes at least 2 arguments, 0 provided after:\nr.now()") {
      done()
    }
    else{
      done(e);
    }
  }
})
It('`during` should throw if just one argument has been given', function* (done) {
  try{
    var result = yield r.now().during(1).run();
  }
  catch(e) {
    if (e.message === "`during` takes at least 2 arguments, 1 provided after:\nr.now()") {
      done()
    }
    else{
      done(e);
    }
  }
})
It('`during` should throw if too many arguments', function* (done) {
  try{
    var result = yield r.now().during(1, 1, 1, 1, 1).run();
  }
  catch(e) {
    if (e.message === "`during` takes at most 3 arguments, 5 provided after:\nr.now()") {
      done()
    }
    else{
      done(e);
    }
  }
})

It('`date` should work', function* (done) {
  try {
    var result = yield r.now().date().hours().run();
    assert.equal(result, 0);
    result = yield r.now().date().minutes().run();
    assert.equal(result, 0);
    result = yield r.now().date().seconds().run();
    assert.equal(result, 0);

    done();
  }
  catch(e) {
    done(e);
  }
})

It('`timeOfDay` should work', function* (done) {
  try {
    var result = yield r.now().timeOfDay().run();
    assert(result>=0);

    done();
  }
  catch(e) {
    done(e);
  }
})

It('`year` should work', function* (done) {
  try {
    var result = yield r.now().inTimezone(new Date().toString().match(' GMT([^ ]*)')[1]).year().run();
    assert.equal(result, new Date().getFullYear());

    done();
  }
  catch(e) {
    done(e);
  }
})

It('`month` should work', function* (done) {
  try {
    var result = yield r.now().inTimezone(new Date().toString().match(' GMT([^ ]*)')[1]).month().run();
    assert.equal(result, new Date().getMonth()+1);

    done();
  }
  catch(e) {
    done(e);
  }
})

It('`day` should work', function* (done) {
  try {
    var result = yield r.now().inTimezone(new Date().toString().match(' GMT([^ ]*)')[1]).day().run();
    assert.equal(result, new Date().getDate());

    done();
  }
  catch(e) {
    done(e);
  }
})

It('`dayOfYear` should work', function* (done) {
  try {
    var result = yield r.now().inTimezone(new Date().toString().match(' GMT([^ ]*)')[1]).dayOfYear().run();
    assert(result > (new Date()).getMonth()*28+(new Date()).getDate()-1);

    done();
  }
  catch(e) {
    done(e);
  }
})

It('`dayOfWeek` should work', function* (done) {
  try {
    var result = yield r.now().inTimezone(new Date().toString().match(' GMT([^ ]*)')[1]).dayOfWeek().run();
    if (result === 7) result = 0;
    assert.equal(result, new Date().getDay());

    done();
  }
  catch(e) {
    done(e);
  }
})

It('`toISO8601` should work', function* (done) {
  try {
    var result = yield r.now().toISO8601().run();
    assert.equal(typeof result, "string");

    done();
  }
  catch(e) {
    done(e);
  }
})

It('`toEpochTime` should work', function* (done) {
  try {
    var result = yield r.now().toEpochTime().run();
    assert.equal(typeof result, "number");

    done();
  }
  catch(e) {
    done(e);
  }
})

It('Constant terms should work', function* (done) {
  try {
    var result = yield r.monday.run();
    assert.equal(result, 1)

    result = yield r.expr([r.monday, r.tuesday, r.wednesday, r.thursday, r.friday, r.saturday, r.sunday, r.january, r.february, r.march, r.april, r.may, r.june, r.july, r.august, r.september, r.october, r.november, r.december]).run();
    assert.deepEqual(result, [1,2,3,4,5,6,7, 1,2,3,4,5,6,7,8,9,10,11,12]);

    done();
  }
  catch(e) {
    done(e);
  }
})

It('`epochTime` should work', function* (done) {
  try {
    var now = new Date();
    result = yield r.epochTime(now.getTime()/1000).run({timeFormat: "raw"});
    assert.equal(result.$reql_type$, "TIME")

    done();
  }
  catch(e) {
    done(e);
  }
})
