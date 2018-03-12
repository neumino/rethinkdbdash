var config = require(__dirname+'/config.js');
var r = require(__dirname+'/../lib')(config);
var util = require(__dirname+'/util/common.js');
var assert = require('assert');

var uuid = util.uuid;
var It = util.It;

var uuid = util.uuid;
var dbName, tableName;


It('Init for `aggregation.js`', function* (done) {
  try {
    dbName = uuid();
    tableName = uuid();

    var result = yield r.dbCreate(dbName).run();
    assert.equal(result.dbs_created, 1);

    var result = yield r.db(dbName).tableCreate(tableName).run();
    assert.equal(result.tables_created, 1);

    done();
  }
  catch(e) {
    done(e);
  }
})

It('`reduce` should work -- no base ', function* (done) {
  try {
    var result = yield r.expr([1,2,3]).reduce(function(left, right) { return left.add(right) }).run();
    assert.equal(result, 6);
    done();
  }
  catch(e) {
    done(e);
  }
})
It('`reduce` should throw if no argument has been passed', function* (done) {
  try {
    var result = yield r.db(dbName).table(tableName).reduce().run();
  }
  catch(e) {
    if (e.message === "`reduce` takes 1 argument, 0 provided after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")") {
      done()
    }
    else {
      done(e);
    }
  }
})

It('`fold` should work', function* (done) {
  try {
    var result = yield r.expr([1,2,3]).fold(10, function(left, right) { return left.add(right) }).run();
    assert.equal(result, 16);
    done();
  }
  catch(e) {
    done(e);
  }
})
It('`fold` should work -- with emit', function* (done) {
  try {
    var result = yield r.expr(['foo', 'bar', 'buzz', 'hello', 'world']).fold(0, function(acc, row) {
      return acc.add(1);
    }, {
      emit: function(oldAcc, element, newAcc) {
        return [oldAcc, element, newAcc];
      }
    }).run();
    assert.deepEqual(result, [0, 'foo', 1, 1, 'bar', 2, 2, 'buzz', 3, 3, 'hello', 4, 4, 'world', 5]);
    done();
  }
  catch(e) {
    done(e);
  }
})
It('`fold` should work -- with emit and finalEmit', function* (done) {
  try {
    var result = yield r.expr(['foo', 'bar', 'buzz', 'hello', 'world']).fold(0, function(acc, row) {
      return acc.add(1);
    }, {
      emit: function(oldAcc, element, newAcc) {
        return [oldAcc, element, newAcc];
      },
      finalEmit: function(acc) {
        return [acc]
      }
    }).run();
    assert.deepEqual(result, [0, 'foo', 1, 1, 'bar', 2, 2, 'buzz', 3, 3, 'hello', 4, 4, 'world', 5, 5]);
    done();
  }
  catch(e) {
    done(e);
  }
})


It('`count` should work -- no arg ', function* (done) {
  try {
    var result = yield r.expr([0, 1, 2, 3, 4, 5]).count().run();
    assert.equal(result, 6);

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`count` should work -- filter ', function* (done) {
  try {
    var result = yield r.expr([0, 1, 2, 3, 4, 5]).count(r.row.eq(2)).run();
    assert.equal(result, 1);

    result = yield r.expr([0, 1, 2, 3, 4, 5]).count(function(doc) { return doc.eq(2) }).run();
    assert.equal(result, 1);

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`group` should work ', function* (done) {
  try {
    var result = yield r.expr([{name: "Michel", grownUp: true},{name: "Laurent", grownUp: true},
      {name: "Sophie", grownUp: true},{name: "Luke", grownUp: false},{name: "Mino", grownUp: false}]).group('grownUp').run();
    result.sort();

    assert.deepEqual(result, [ { "group": false, "reduction": [ { "grownUp": false, "name": "Luke" }, { "grownUp": false, "name": "Mino" } ] }, { "group": true, "reduction": [ { "grownUp": true, "name": "Michel" }, { "grownUp": true, "name": "Laurent" }, { "grownUp": true, "name": "Sophie" } ] } ])

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`group` should work with r.row', function* (done) {
  try {
    var result = yield r.expr([{name: "Michel", grownUp: true},{name: "Laurent", grownUp: true},
      {name: "Sophie", grownUp: true},{name: "Luke", grownUp: false},{name: "Mino", grownUp: false}]).group(r.row('grownUp')).run();
    result.sort();

    assert.deepEqual(result, [ { "group": false, "reduction": [ { "grownUp": false, "name": "Luke" }, { "grownUp": false, "name": "Mino" } ] }, { "group": true, "reduction": [ { "grownUp": true, "name": "Michel" }, { "grownUp": true, "name": "Laurent" }, { "grownUp": true, "name": "Sophie" } ] } ])

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`group` should work with an index ', function* (done) {

  try {
    var result = yield r.db(dbName).table(tableName).insert([
      {id:1, group: 1},
      {id:2, group: 1},
      {id:3, group: 1},
      {id:4, group: 4},
      ]).run();
    result = yield r.db(dbName).table(tableName).indexCreate("group").run();
    result = yield r.db(dbName).table(tableName).indexWait("group").run();
    result = yield r.db(dbName).table(tableName).group({index: "group"}).run();

    assert.equal(result.length, 2);
    assert(result[0].reduction.length === 3 || result[0].reduction.length === 1);
    assert(result[1].reduction.length === 3 || result[1].reduction.length === 1);
    done();
  }
  catch(e) {
    console.log(e);
    done(e);
  }
})

It('`groupFormat` should work -- with raw', function* (done) {
  try {
    var result = yield r.expr([{name: "Michel", grownUp: true},{name: "Laurent", grownUp: true},
      {name: "Sophie", grownUp: true},{name: "Luke", grownUp: false},{name: "Mino", grownUp: false}]).group('grownUp').run({groupFormat: "raw"});

    assert.deepEqual(result, { "$reql_type$": "GROUPED_DATA", "data": [ [ false, [ { "grownUp": false, "name": "Luke" }, { "grownUp": false, "name": "Mino" } ] ], [ true, [ { "grownUp": true, "name": "Michel" }, { "grownUp": true, "name": "Laurent" }, { "grownUp": true, "name": "Sophie" } ] ] ] })

    done();
  }
  catch(e) {
    done(e);
  }
})

It('`group` results should be properly parsed ', function* (done) {
  try {
    var result = yield r.expr([{name: "Michel", date: r.now()},{name: "Laurent", date: r.now()},
        {name: "Sophie", date: r.now().sub(1000)}]).group('date').run();
    assert.equal(result.length, 2);
    assert(result[0].group instanceof Date);
    assert(result[0].reduction[0].date instanceof Date);
    done();
  }
  catch(e) {
    done(e);
  }
})


It('`ungroup` should work ', function* (done) {
  try {
    var result = yield r.expr([{name: "Michel", grownUp: true},{name: "Laurent", grownUp: true},
      {name: "Sophie", grownUp: true},{name: "Luke", grownUp: false},{name: "Mino", grownUp: false}]).group('grownUp').ungroup().run();
    result.sort();

    assert.deepEqual(result, [ { "group": false, "reduction": [ { "grownUp": false, "name": "Luke" }, { "grownUp": false, "name": "Mino" } ] }, { "group": true, "reduction": [ { "grownUp": true, "name": "Michel" }, { "grownUp": true, "name": "Laurent" }, { "grownUp": true, "name": "Sophie" } ] } ])

    done();
  }
  catch(e) {
    done(e);
  }
})

It('`contains` should work ', function* (done) {
  try{
    var result = yield r.expr([1,2,3]).contains(2).run();
    assert.equal(result, true);

    result = yield r.expr([1,2,3]).contains(1, 2).run();
    assert.equal(result, true);

    result = yield r.expr([1,2,3]).contains(1, 5).run();
    assert.equal(result, false);

    result = yield r.expr([1,2,3]).contains(function(doc) { return doc.eq(1) }).run();
    assert.equal(result, true);

    result = yield r.expr([1,2,3]).contains(r.row.eq(1)).run();
    assert.equal(result, true);

    result = yield r.expr([1,2,3]).contains(r.row.eq(1), r.row.eq(2)).run();
    assert.equal(result, true);

    result = yield r.expr([1,2,3]).contains(r.row.eq(1), r.row.eq(5)).run();
    assert.equal(result, false);

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`contains` should throw if called without arguments', function* (done) {
  try {
    var result = yield r.db(dbName).table(tableName).contains().run();
  }
  catch(e) {
    if (e.message === "`contains` takes at least 1 argument, 0 provided after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")") {
      done()
    }
    else {
      done(e);
    }
  }
})

It('`sum` should work ', function* (done) {
  try{
    var result = yield r.expr([1,2,3]).sum().run();
    assert.equal(result, 6);

    done();
  }
  catch(e) {
    done(e);
  }
})

It('`sum` should work with a field', function* (done) {
  try {
    var result = yield r.expr([{a: 2}, {a: 10}, {a: 9}]).sum('a').run();
    assert.deepEqual(result, 21)
    done();
  }
  catch(e) {
    done(e);
  }
})



It('`avg` should work ', function* (done) {
  try{
    var result = yield r.expr([1,2,3]).avg().run();
    assert.equal(result, 2);
    done();
  }
  catch(e) {
    done(e);
  }
})
It('`r.avg` should work ', function* (done) {
  try{
    var result = yield r.avg([1,2,3]).run();
    assert.equal(result, 2);
    done();
  }
  catch(e) {
    done(e);
  }
})

It('`avg` should work with a field', function* (done) {
  try {
    var result = yield r.expr([{a: 2}, {a: 10}, {a: 9}]).avg('a').run();
    assert.equal(result, 7);
    done();
  }
  catch(e) {
    done(e);
  }
})
It('`r.avg` should work with a field', function* (done) {
  try {
    var result = yield r.avg([{a: 2}, {a: 10}, {a: 9}], 'a').run();
    assert.equal(result, 7);
    done();
  }
  catch(e) {
    done(e);
  }
})

It('`min` should work ', function* (done) {
  try{
    var result = yield r.expr([1,2,3]).min().run();
    assert.equal(result, 1);
    done();
  }
  catch(e) {
    done(e);
  }
})
It('`r.min` should work ', function* (done) {
  try{
    var result = yield r.min([1,2,3]).run();
    assert.equal(result, 1);
    done();
  }
  catch(e) {
    done(e);
  }
})

It('`min` should work with a field', function* (done) {
  try {
    var result = yield r.expr([{a: 2}, {a: 10}, {a: 9}]).min('a').run();
    assert.deepEqual(result, {a: 2});
    done();
  }
  catch(e) {
    done(e);
  }
})
It('`r.min` should work with a field', function* (done) {
  try {
    var result = yield r.min([{a: 2}, {a: 10}, {a: 9}], 'a').run();
    assert.deepEqual(result, {a: 2});
    done();
  }
  catch(e) {
    done(e);
  }
})

It('`max` should work ', function* (done) {
  try{
    var result = yield r.expr([1,2,3]).max().run();
    assert.equal(result, 3);
    done();
  }
  catch(e) {
    done(e);
  }
})
It('`r.max` should work ', function* (done) {
  try{
    var result = yield r.max([1,2,3]).run();
    assert.equal(result, 3);
    done();
  }
  catch(e) {
    done(e);
  }
})

It('`distinct` should work', function* (done) {
  try {
    var result = yield r.expr([1,2,3,1,2,1,3,2,2,1,4]).distinct().orderBy(r.row).run();
    assert.deepEqual(result, [1,2,3,4]);
    done();
  }
  catch(e) {
    console.log(e);
    done(e);
  }
})
It('`r.distinct` should work', function* (done) {
  try {
    var result = yield r.distinct([1,2,3,1,2,1,3,2,2,1,4]).orderBy(r.row).run();
    assert.deepEqual(result, [1,2,3,4]);
    done();
  }
  catch(e) {
    console.log(e);
    done(e);
  }
})

It('`distinct` should work with an index', function* (done) {
  try {
    var result = yield r.db(dbName).table(tableName).distinct({index: "id"}).count().run();
    var result2 = yield r.db(dbName).table(tableName).count().run();
    assert.equal(result, result2);
    done();
  }
  catch(e) {
    console.log(e);
    done(e);
  }
})
