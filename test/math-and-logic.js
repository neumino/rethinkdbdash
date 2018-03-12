var config = require(__dirname+'/config.js');
var r = require(__dirname+'/../lib')(config);
var util = require(__dirname+'/util/common.js');
var assert = require('assert');

var uuid = util.uuid;
var It = util.It;

var uuid = util.uuid;
var dbName, tableName, result;

It('`add` should work', function* (done) {
  try {
    result = yield r.expr(1).add(1).run();
    assert.equal(result, 2);

    result = yield r.expr(1).add(1).add(1).run();
    assert.equal(result, 3);

    result = yield r.expr(1).add(1, 1).run();
    assert.equal(result, 3);

    result = yield r.add(1, 1, 1).run();
    assert.equal(result, 3);

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`add` should throw if no argument has been passed', function* (done) {
  try {
    var result = yield r.expr(1).add().run();
  }
  catch(e) {
    if (e.message === "`add` takes at least 1 argument, 0 provided after:\nr.expr(1)") {
      done();
    }
    else {
      done(e);
    }
  }
})

It('`add` should throw if no argument has been passed -- r.add', function* (done) {
  try {
    var result = yield r.add().run();
  }
  catch(e) {
    if (e.message === "`r.add` takes at least 2 arguments, 0 provided.") {
      done();
    }
    else {
      done(e);
    }
  }
})
It('`add` should throw if just one argument has been passed -- r.add', function* (done) {
  try {
    var result = yield r.add(1).run();
  }
  catch(e) {
    if (e.message === "`r.add` takes at least 2 arguments, 1 provided.") {
      done();
    }
    else {
      done(e);
    }
  }
})

It('`sub` should work', function* (done) {
  try {
    var result = yield r.expr(1).sub(1).run();
    assert.equal(result, 0);

    result = yield r.sub(5, 3, 1).run();
    assert.equal(result, 1);

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`sub` should throw if no argument has been passed', function* (done) {
  try {
    var result = yield r.expr(1).sub().run();
  }
  catch(e) {
    if (e.message === "`sub` takes at least 1 argument, 0 provided after:\nr.expr(1)") {
      done();
    }
    else {
      done(e);
    }
  }
})
It('`sub` should throw if no argument has been passed -- r.sub', function* (done) {
  try {
    var result = yield r.sub().run();
  }
  catch(e) {
    if (e.message === "`r.sub` takes at least 2 arguments, 0 provided.") {
      done();
    }
    else {
      done(e);
    }
  }
})
It('`sub` should throw if just one argument has been passed -- r.sub', function* (done) {
  try {
    var result = yield r.sub(1).run();
  }
  catch(e) {
    if (e.message === "`r.sub` takes at least 2 arguments, 1 provided.") {
      done();
    }
    else {
      done(e);
    }
  }
})
It('`mul` should work', function* (done) {
  try {
    var result = yield r.expr(2).mul(3).run();
    assert.equal(result, 6);

    result = yield r.mul(2, 3, 4).run();
    assert.equal(result, 24);

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`mul` should throw if no argument has been passed', function* (done) {
  try {
    var result = yield r.expr(1).mul().run();
  }
  catch(e) {
    if (e.message === "`mul` takes at least 1 argument, 0 provided after:\nr.expr(1)") {
      done();
    }
    else {
      done(e);
    }
  }
})
It('`mul` should throw if no argument has been passed -- r.mul', function* (done) {
  try {
    var result = yield r.mul().run();
  }
  catch(e) {
    if (e.message === "`r.mul` takes at least 2 arguments, 0 provided.") {
      done();
    }
    else {
      done(e);
    }
  }
})
It('`mul` should throw if just one argument has been passed -- r.mul', function* (done) {
  try {
    var result = yield r.mul(1).run();
  }
  catch(e) {
    if (e.message === "`r.mul` takes at least 2 arguments, 1 provided.") {
      done();
    }
    else {
      done(e);
    }
  }
})
It('`div` should work', function* (done) {
  try {
    var result = yield r.expr(24).div(2).run();
    assert.equal(result, 12);

    result = yield r.div(20, 2, 5, 1).run();
    assert.equal(result, 2);

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`div` should throw if no argument has been passed', function* (done) {
  try {
    var result = yield r.expr(1).div().run();
  }
  catch(e) {
    if (e.message === "`div` takes at least 1 argument, 0 provided after:\nr.expr(1)") {
      done();
    }
    else {
      done(e);
    }
  }
})
It('`div` should throw if no argument has been passed -- r.div', function* (done) {
  try {
    var result = yield r.div().run();
  }
  catch(e) {
    if (e.message === "`r.div` takes at least 2 arguments, 0 provided.") {
      done();
    }
    else {
      done(e);
    }
  }
})
It('`div` should throw if just one argument has been passed -- r.div', function* (done) {
  try {
    var result = yield r.div(1).run();
  }
  catch(e) {
    if (e.message === "`r.div` takes at least 2 arguments, 1 provided.") {
      done();
    }
    else {
      done(e);
    }
  }
})
It('`mod` should work', function* (done) {
  try {
    var result = yield r.expr(24).mod(7).run();
    assert.equal(result, 3);

    result = yield r.mod(24, 7).run();
    assert.equal(result, 3);

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`mod` should throw if no argument has been passed', function* (done) {
  try {
    var result = yield r.expr(1).mod().run();
  }
  catch(e) {
    if (e.message === "`mod` takes 1 argument, 0 provided after:\nr.expr(1)") {
      done();
    }
    else {
      done(e);
    }
  }
})
It('`mod` should throw if more than two arguments -- r.mod', function* (done) {
  try {
    var result = yield r.mod(24, 7, 2).run();
  }
  catch(e) {
    if (e.message === "`r.mod` takes 2 arguments, 3 provided.") {
      done();
    }
    else {
      done(e);
    }
  }
})
It('`and` should work', function* (done) {
  try {
    var result = yield r.expr(true).and(false).run();
    assert.equal(result, false);

    result = yield r.expr(true).and(true).run();
    assert.equal(result, true);

    result = yield r.and(true, true, true).run();
    assert.equal(result, true);

    result = yield r.and(true, true, true, false).run();
    assert.equal(result, false);

    result = yield r.and(r.args([true, true, true])).run();
    assert.equal(result, true);

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`and` should work if no argument has been passed -- r.and', function* (done) {
  try {
    var result = yield r.and().run();
    assert.equal(result, true);
    done();
  }
  catch(e) {
    done(e);
  }
})
It('`or` should work', function* (done) {
  try {
    var result = yield r.expr(true).or(false).run();
    assert.equal(result, true);

    result = yield r.expr(false).or(false).run();
    assert.equal(result, false);

    result = yield r.or(true, true, true).run();
    assert.equal(result, true);

    result = yield r.or(r.args([false, false, true])).run();
    assert.equal(result, true);


    result = yield r.or(false, false, false, false).run();
    assert.equal(result, false);
    done();
  }
  catch(e) {
    done(e);
  }
})
It('`or` should work if no argument has been passed -- r.or', function* (done) {
  try {
    var result = yield r.or().run();
    assert.equal(result, false);
    done();
  }
  catch(e) {
    done(e);
  }
})

It('`eq` should work', function* (done) {
  try {
    var result = yield r.expr(1).eq(1).run();
    assert.equal(result, true);

    result = yield r.expr(1).eq(2).run();
    assert.equal(result, false);

    result = yield r.eq(1, 1, 1, 1).run();
    assert.equal(result, true);

    result = yield r.eq(1, 1, 2, 1).run();
    assert.equal(result, false);

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`eq` should throw if no argument has been passed', function* (done) {
  try {
    var result = yield r.expr(1).eq().run();
  }
  catch(e) {
    if (e.message === "`eq` takes at least 1 argument, 0 provided after:\nr.expr(1)") {
      done();
    }
    else {
      done(e);
    }
  }
})
It('`eq` should throw if no argument has been passed -- r.eq', function* (done) {
  try {
    var result = yield r.eq().run();
  }
  catch(e) {
    if (e.message === "`r.eq` takes at least 2 arguments, 0 provided.") {
      done();
    }
    else {
      done(e);
    }
  }
})
It('`eq` should throw if just one argument has been passed -- r.eq', function* (done) {
  try {
    var result = yield r.eq(1).run();
  }
  catch(e) {
    if (e.message === "`r.eq` takes at least 2 arguments, 1 provided.") {
      done();
    }
    else {
      done(e);
    }
  }
})
It('`ne` should work', function* (done) {
  try {
    var result = yield r.expr(1).ne(1).run();
    assert.equal(result, false);

    result = yield r.expr(1).ne(2).run();
    assert.equal(result, true);

    result = yield r.ne(1, 1, 1, 1).run();
    assert.equal(result, false);

    result = yield r.ne(1, 1, 2, 1).run();
    assert.equal(result, true);


    done();
  }
  catch(e) {
    done(e);
  }
})
It('`ne` should throw if no argument has been passed', function* (done) {
  try {
    var result = yield r.expr(1).ne().run();
  }
  catch(e) {
    if (e.message === "`ne` takes at least 1 argument, 0 provided after:\nr.expr(1)") {
      done();
    }
    else {
      done(e);
    }
  }
})
It('`ne` should throw if no argument has been passed -- r.ne', function* (done) {
  try {
    var result = yield r.ne().run();
  }
  catch(e) {
    if (e.message === "`r.ne` takes at least 2 arguments, 0 provided.") {
      done();
    }
    else {
      done(e);
    }
  }
})
It('`ne` should throw if just one argument has been passed -- r.ne', function* (done) {
  try {
    var result = yield r.ne(1).run();
  }
  catch(e) {
    if (e.message === "`r.ne` takes at least 2 arguments, 1 provided.") {
      done();
    }
    else {
      done(e);
    }
  }
})
It('`gt` should work', function* (done) {
  try {
    var result = yield r.expr(1).gt(2).run();
    assert.equal(result, false);
    result = yield r.expr(2).gt(2).run();
    assert.equal(result, false);
    result = yield r.expr(3).gt(2).run();
    assert.equal(result, true);

    result = yield r.gt(10, 9, 7, 2).run();
    assert.equal(result, true);

    result = yield r.gt(10, 9, 9, 1).run();
    assert.equal(result, false);

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`gt` should throw if no argument has been passed', function* (done) {
  try {
    var result = yield r.expr(1).gt().run();
  }
  catch(e) {
    if (e.message === "`gt` takes at least 1 argument, 0 provided after:\nr.expr(1)") {
      done();
    }
    else {
      done(e);
    }
  }
})
It('`gt` should throw if no argument has been passed -- r.gt', function* (done) {
  try {
    var result = yield r.gt().run();
  }
  catch(e) {
    if (e.message === "`r.gt` takes at least 2 arguments, 0 provided.") {
      done();
    }
    else {
      done(e);
    }
  }
})
It('`gt` should throw if just one argument has been passed -- r.gt', function* (done) {
  try {
    var result = yield r.gt(1).run();
  }
  catch(e) {
    if (e.message === "`r.gt` takes at least 2 arguments, 1 provided.") {
      done();
    }
    else {
      done(e);
    }
  }
})
It('`ge` should work', function* (done) {
  try {
    var result = yield r.expr(1).ge(2).run();
    assert.equal(result, false);
    result = yield r.expr(2).ge(2).run();
    assert.equal(result, true);
    result = yield r.expr(3).ge(2).run();
    assert.equal(result, true);

    result = yield r.ge(10, 9, 7, 2).run();
    assert.equal(result, true);

    result = yield r.ge(10, 9, 9, 1).run();
    assert.equal(result, true);

    result = yield r.ge(10, 9, 10, 1).run();
    assert.equal(result, false);

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`ge` should throw if no argument has been passed', function* (done) {
  try {
    var result = yield r.expr(1).ge().run();
  }
  catch(e) {
    if (e.message === "`ge` takes at least 1 argument, 0 provided after:\nr.expr(1)") {
      done();
    }
    else {
      done(e);
    }
  }
})
It('`ge` should throw if no argument has been passed -- r.ge', function* (done) {
  try {
    var result = yield r.ge().run();
  }
  catch(e) {
    if (e.message === "`r.ge` takes at least 2 arguments, 0 provided.") {
      done();
    }
    else {
      done(e);
    }
  }
})
It('`ge` should throw if just one argument has been passed -- r.ge', function* (done) {
  try {
    var result = yield r.ge(1).run();
  }
  catch(e) {
    if (e.message === "`r.ge` takes at least 2 arguments, 1 provided.") {
      done();
    }
    else {
      done(e);
    }
  }
})
It('`lt` should work', function* (done) {
  try {
    var result = yield r.expr(1).lt(2).run();
    assert.equal(result, true);
    result = yield r.expr(2).lt(2).run();
    assert.equal(result, false);
    result = yield r.expr(3).lt(2).run();
    assert.equal(result, false);

    result = yield r.lt(0, 2, 4, 20).run();
    assert.equal(result, true);

    result = yield r.lt(0, 2, 2, 4).run();
    assert.equal(result, false);

    result = yield r.lt(0, 2, 1, 20).run();
    assert.equal(result, false);

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`lt` should throw if no argument has been passed', function* (done) {
  try {
    var result = yield r.expr(1).lt().run();
  }
  catch(e) {
    if (e.message === "`lt` takes at least 1 argument, 0 provided after:\nr.expr(1)") {
      done();
    }
    else {
      done(e);
    }
  }
})
It('`lt` should throw if no argument has been passed -- r.lt', function* (done) {
  try {
    var result = yield r.lt().run();
  }
  catch(e) {
    if (e.message === "`r.lt` takes at least 2 arguments, 0 provided.") {
      done();
    }
    else {
      done(e);
    }
  }
})
It('`lt` should throw if just one argument has been passed -- r.lt', function* (done) {
  try {
    var result = yield r.lt(1).run();
  }
  catch(e) {
    if (e.message === "`r.lt` takes at least 2 arguments, 1 provided.") {
      done();
    }
    else {
      done(e);
    }
  }
})
It('`le` should work', function* (done) {
  try {
    var result = yield r.expr(1).le(2).run();
    assert.equal(result, true);
    result = yield r.expr(2).le(2).run();
    assert.equal(result, true);
    result = yield r.expr(3).le(2).run();
    assert.equal(result, false);

    result = yield r.le(0, 2, 4, 20).run();
    assert.equal(result, true);

    result = yield r.le(0, 2, 2, 4).run();
    assert.equal(result, true);

    result = yield r.le(0, 2, 1, 20).run();
    assert.equal(result, false);

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`le` should throw if no argument has been passed', function* (done) {
  try {
    var result = yield r.expr(1).le().run();
  }
  catch(e) {
    if (e.message === "`le` takes at least 1 argument, 0 provided after:\nr.expr(1)") {
      done();
    }
    else {
      done(e);
    }
  }
})
It('`le` should throw if no argument has been passed -- r.le', function* (done) {
  try {
    var result = yield r.le().run();
  }
  catch(e) {
    if (e.message === "`r.le` takes at least 2 arguments, 0 provided.") {
      done();
    }
    else {
      done(e);
    }
  }
})
It('`le` should throw if just one argument has been passed -- r.le', function* (done) {
  try {
    var result = yield r.le(1).run();
  }
  catch(e) {
    if (e.message === "`r.le` takes at least 2 arguments, 1 provided.") {
      done();
    }
    else {
      done(e);
    }
  }
})
It('`not` should work', function* (done) {
  try {
    var result = yield r.expr(true).not().run();
    assert.equal(result, false);
    result = yield r.expr(false).not().run();
    assert.equal(result, true);

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`random` should work', function* (done) {
  try {
    var result = yield r.random().run();
    assert((result > 0) && (result < 1));

    result = yield r.random(10).run();
    assert((result >= 0) && (result < 10));
    assert.equal(Math.floor(result), result);

    result = yield r.random(5, 10).run();
    assert((result >= 5) && (result < 10));
    assert.equal(Math.floor(result), result);

    result = yield r.random(5, 10, {float: true}).run();
    assert((result >= 5) && (result < 10));
    assert.notEqual(Math.floor(result), result); // that's "almost" safe

    result = yield r.random(5, {float: true}).run();
    assert((result < 5) && (result > 0));
    assert.notEqual(Math.floor(result), result); // that's "almost" safe

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`r.floor` should work', function* (done) {
  try {
    var result = yield r.floor(1.2).run();
    assert.equal(result, 1);
    result = yield r.expr(1.2).floor().run();
    assert.equal(result, 1);
    result = yield r.floor(1.8).run();
    assert.equal(result, 1);
    result = yield r.expr(1.8).floor().run();
    assert.equal(result, 1);

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`r.ceil` should work', function* (done) {
  try {
    var result = yield r.ceil(1.2).run();
    assert.equal(result, 2);
    result = yield r.expr(1.2).ceil().run();
    assert.equal(result, 2);
    result = yield r.ceil(1.8).run();
    assert.equal(result, 2);
    result = yield r.expr(1.8).ceil().run();
    assert.equal(result, 2);

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`r.round` should work', function* (done) {
  try {
    var result = yield r.round(1.8).run();
    assert.equal(result, 2);
    result = yield r.expr(1.8).round().run();
    assert.equal(result, 2);
    result = yield r.round(1.2).run();
    assert.equal(result, 1);
    result = yield r.expr(1.2).round().run();
    assert.equal(result, 1);

    done();
  }
  catch(e) {
    done(e);
  }
})

