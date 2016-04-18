var config = require(__dirname+'/config.js');
var r = require(__dirname+'/../lib')(config);
var util = require(__dirname+'/util/common.js');
var assert = require('assert');

var uuid = util.uuid;
var It = util.It;

var uuid = util.uuid;
var dbName, tableName, result;


It('Init for `writing-data.js`', function* (done) {
  try {
    dbName = uuid();
    tableName = uuid();

    result = yield r.dbCreate(dbName).run();
    assert.equal(result.dbs_created, 1);

    result = yield r.db(dbName).tableCreate(tableName).run();
    assert.equal(result.tables_created, 1);

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`insert` should work - single insert`', function* (done) {
  try {
    var result = yield r.db(dbName).table(tableName).insert({}).run();
    assert.equal(result.inserted, 1);

    result = yield r.db(dbName).table(tableName).insert(eval('['+new Array(100).join('{}, ')+'{}]')).run();
    assert.equal(result.inserted, 100);


    done();
  }
  catch(e) {
    done(e);
  }
})


It('`insert` should work - batch insert 1`', function* (done) {
  try {
    var result = yield r.db(dbName).table(tableName).insert([{}, {}]).run();
    assert.equal(result.inserted, 2);

    done();
  }
  catch(e) {
    done(e);
  }
})

It('`insert` should work - batch insert 2`', function* (done) {
  try {
    var result = yield r.db(dbName).table(tableName).insert(eval('['+new Array(100).join('{}, ')+'{}]')).run();
    assert.equal(result.inserted, 100);

    done();
  }
  catch(e) {
    done(e);
  }
})

It('`insert` should work - with returnChanges true`', function* (done) {
  try {
    var result = yield r.db(dbName).table(tableName).insert({}, {returnChanges: true}).run();
    assert.equal(result.inserted, 1);
    assert(result.changes[0].new_val);
    assert.equal(result.changes[0].old_val, null);

    done();
  }
  catch(e) {
    done(e);
  }
})


It('`insert` should work - with returnChanges false`', function* (done) {
  try {
    var result = yield r.db(dbName).table(tableName).insert({}, {returnChanges: false}).run();
    assert.equal(result.inserted, 1);
    assert.equal(result.changes, undefined);
    assert.equal(result.changes, undefined);

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`insert` should work - with durability soft`', function* (done) {
  try {
    var result = yield r.db(dbName).table(tableName).insert({}, {durability: 'soft'}).run();
    assert.equal(result.inserted, 1);

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`insert` should work - with durability hard`', function* (done) {
  try {
    result = yield r.db(dbName).table(tableName).insert({}, {durability: 'hard'}).run();
    assert.equal(result.inserted, 1);

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`insert` should work - testing conflict`', function* (done) {
  try {
    result = yield r.db(dbName).table(tableName).insert({}, {conflict: 'update'}).run();
    assert.equal(result.inserted, 1);

    var pk = result.generated_keys[0];

    result = yield r.db(dbName).table(tableName).insert({id: pk, val:1}, {conflict: 'update'}).run();
    assert.equal(result.replaced, 1);

    result = yield r.db(dbName).table(tableName).insert({id: pk, val:2}, {conflict: 'replace'}).run();
    assert.equal(result.replaced, 1);

    result = yield r.db(dbName).table(tableName).insert({id: pk, val:3}, {conflict: 'error'}).run();
    assert.equal(result.errors, 1);

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`insert` should throw if no argument is given', function* (done) {
  try{
    var result = yield r.db(dbName).table(tableName).insert().run();
  }
  catch(e) {
    if (e.message === "`insert` takes at least 1 argument, 0 provided after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")") {
      done()
    }
    else {
      done(e);
    }
  }
})
It('`insert` work with dates - 1', function* (done) {
  try {
    var result = yield r.db(dbName).table(tableName).insert({name: "Michel", age: 27, birthdate: new Date()}).run()
    assert.deepEqual(result.inserted, 1);
    done();
  }
  catch(e) {
    done(e);
  }
})
It('`insert` work with dates - 2', function* (done) {
  try {
    var result = yield r.db(dbName).table(tableName).insert([{name: "Michel", age: 27, birthdate: new Date()}, {name: "Sophie", age: 23}]).run()
    assert.deepEqual(result.inserted, 2);
    done();
  }
  catch(e) {
    done(e);
  }
})
It('`insert` work with dates - 3', function* (done) {
  try {
    var result = yield r.db(dbName).table(tableName).insert({
      field: 'test',
      field2: { nested: 'test' },
      date: new Date()
    }).run()
    assert.deepEqual(result.inserted, 1);
    done();
  }
  catch(e) {
    done(e);
  }
})
It('`insert` work with dates - 4', function* (done) {
  try {
    var result = yield r.db(dbName).table(tableName).insert({
      field: 'test',
      field2: { nested: 'test' },
      date: r.now()
    }).run()
    assert.deepEqual(result.inserted, 1);
    done();
  }
  catch(e) {
    done(e);
  }
})

It('`insert` should throw if non valid option', function* (done) {
  try{
    var result = yield r.db(dbName).table(tableName).insert({}, {nonValidKey: true}).run();
  }
  catch(e) {
    if (e.message === 'Unrecognized option `nonValidKey` in `insert` after:\nr.db("'+dbName+'").table("'+tableName+'")\nAvailable options are returnChanges <bool>, durability <string>, conflict <string>') {
      done()
    }
    else {
      done(e);
    }
  }
})

It('`insert` with a conflict method', function* (done) {
  try{
    var result = yield r.db(dbName).table(tableName).insert({
      count: 7
    }).run();
    var savedId = result.generated_keys[0];
    var result = yield r.db(dbName).table(tableName).insert({
      id: savedId,
      count: 10
    }, {
      conflict: function(id, oldDoc, newDoc) {
        return newDoc.merge({
          count: newDoc('count').add(oldDoc('count'))
        })
      }
    }).run();
    result = yield r.db(dbName).table(tableName).get(savedId)
    assert.deepEqual(result, {
      id: savedId,
      count: 17
    })
    done();
  }
  catch(e) {
    done(e);
  }
})

It('`replace` should throw if no argument is given', function* (done) {
  try{
    var result = yield r.db(dbName).table(tableName).replace().run();
  }
  catch(e) {
    if (e.message === "`replace` takes at least 1 argument, 0 provided after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")") {
      done()
    }
    else {
      done(e);
    }
  }
})
It('`replace` should throw if non valid option', function* (done) {
  try{
    var result = yield r.db(dbName).table(tableName).replace({}, {nonValidKey: true}).run();
  }
  catch(e) {
    if (e.message === 'Unrecognized option `nonValidKey` in `replace` after:\nr.db("'+dbName+'").table("'+tableName+'")\nAvailable options are returnChanges <bool>, durability <string>, nonAtomic <bool>') {
      done()
    }
    else {
      done(e);
    }
  }
})

It('`delete` should work`', function* (done) {
  try {
    result = yield r.db(dbName).table(tableName).delete().run();
    assert(result.deleted > 0);

    result = yield r.db(dbName).table(tableName).delete().run();
    assert.equal(result.deleted, 0);

    done();
  }
  catch(e) {
    done(e);
  }
})

It('`delete` should work -- soft durability`', function* (done) {
  try {
    result = yield r.db(dbName).table(tableName).delete().run();
    assert(result);
    result = yield r.db(dbName).table(tableName).insert({}).run();
    assert(result);

    result = yield r.db(dbName).table(tableName).delete({durability: "soft"}).run();
    assert.equal(result.deleted, 1);


    result = yield r.db(dbName).table(tableName).insert({}).run();
    assert(result);

    result = yield r.db(dbName).table(tableName).delete().run();
    assert.equal(result.deleted, 1);

    done();
  }
  catch(e) {
    done(e);
  }
})



It('`delete` should work -- hard durability`', function* (done) {
  try {
    result = yield r.db(dbName).table(tableName).delete().run();
    assert(result);
    result = yield r.db(dbName).table(tableName).insert({}).run();
    assert(result);

    result = yield r.db(dbName).table(tableName).delete({durability: "hard"}).run();
    assert.equal(result.deleted, 1);

    
    result = yield r.db(dbName).table(tableName).insert({}).run();
    assert(result);

    result = yield r.db(dbName).table(tableName).delete().run();
    assert.equal(result.deleted, 1);

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`delete` should throw if non valid option', function* (done) {
  try{
    var result = yield r.db(dbName).table(tableName).delete({nonValidKey: true}).run();
  }
  catch(e) {
    if (e.message === 'Unrecognized option `nonValidKey` in `delete` after:\nr.db("'+dbName+'").table("'+tableName+'")\nAvailable options are returnChanges <bool>, durability <string>') {
      done()
    }
    else {
      done(e);
    }
  }
})
It('`update` should work - point update`', function* (done) {
  try {
    result = yield r.db(dbName).table(tableName).delete().run();
    assert(result);
    result = yield r.db(dbName).table(tableName).insert({id: 1}).run();
    assert(result);

    result = yield r.db(dbName).table(tableName).get(1).update({foo: "bar"}).run();
    assert.equal(result.replaced, 1);

    result = yield r.db(dbName).table(tableName).get(1).run();
    assert.deepEqual(result, {id: 1, foo: "bar"});

    done();
  }
  catch(e) {
    done(e);
  }
})

It('`update` should work - range update`', function* (done) {
  try {
    result = yield r.db(dbName).table(tableName).delete().run();
    assert(result);
    result = yield r.db(dbName).table(tableName).insert([{id: 1}, {id: 2}]).run();
    assert(result);

    result = yield r.db(dbName).table(tableName).update({foo: "bar"}).run();
    assert.equal(result.replaced, 2);

    result = yield r.db(dbName).table(tableName).get(1).run();
    assert.deepEqual(result, {id: 1, foo: "bar"});
    result = yield r.db(dbName).table(tableName).get(2).run();
    assert.deepEqual(result, {id: 2, foo: "bar"});

    done();
  }
  catch(e) {
    done(e);
  }
})

It('`update` should work - soft durability`', function* (done) {
  try {
    result = yield r.db(dbName).table(tableName).delete().run();
    assert(result);
    result = yield r.db(dbName).table(tableName).insert({id: 1}).run();
    assert(result);

    result = yield r.db(dbName).table(tableName).get(1).update({foo: "bar"}, {durability: "soft"}).run();
    assert.equal(result.replaced, 1);

    result = yield r.db(dbName).table(tableName).get(1).run();
    assert.deepEqual(result, {id: 1, foo: "bar"});

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`update` should work - hard durability`', function* (done) {
  try {
    result = yield r.db(dbName).table(tableName).delete().run();
    assert(result);
    result = yield r.db(dbName).table(tableName).insert({id: 1}).run();
    assert(result);

    result = yield r.db(dbName).table(tableName).get(1).update({foo: "bar"}, {durability: "hard"}).run();
    assert.equal(result.replaced, 1);

    result = yield r.db(dbName).table(tableName).get(1).run();
    assert.deepEqual(result, {id: 1, foo: "bar"});

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`update` should work - returnChanges true', function* (done) {
  try {
    result = yield r.db(dbName).table(tableName).delete().run();
    assert(result);
    result = yield r.db(dbName).table(tableName).insert({id: 1}).run();
    assert(result);

    result = yield r.db(dbName).table(tableName).get(1).update({foo: "bar"}, {returnChanges: true}).run();
    assert.equal(result.replaced, 1);
    assert.deepEqual(result.changes[0].new_val, {id: 1, foo: "bar"});
    assert.deepEqual(result.changes[0].old_val, {id: 1});

    result = yield r.db(dbName).table(tableName).get(1).run();
    assert.deepEqual(result, {id: 1, foo: "bar"});

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`update` should work - returnChanges false`', function* (done) {
  try {
    result = yield r.db(dbName).table(tableName).delete().run();
    assert(result);
    result = yield r.db(dbName).table(tableName).insert({id: 1}).run();
    assert(result);

    result = yield r.db(dbName).table(tableName).get(1).update({foo: "bar"}, {returnChanges: false}).run();
    assert.equal(result.replaced, 1);
    assert.equal(result.changes, undefined);
    assert.equal(result.changes, undefined);

    result = yield r.db(dbName).table(tableName).get(1).run();
    assert.deepEqual(result, {id: 1, foo: "bar"});

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`update` should throw if no argument is given', function* (done) {
  try{
    var result = yield r.db(dbName).table(tableName).update().run();
  }
  catch(e) {
    if (e.message === "`update` takes at least 1 argument, 0 provided after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")") {
      done()
    }
    else {
      done(e);
    }
  }
})
It('`update` should throw if non valid option', function* (done) {
  try{
    var result = yield r.db(dbName).table(tableName).update({}, {nonValidKey: true}).run();
  }
  catch(e) {
    if (e.message === 'Unrecognized option `nonValidKey` in `update` after:\nr.db("'+dbName+'").table("'+tableName+'")\nAvailable options are returnChanges <bool>, durability <string>, nonAtomic <bool>') {
      done()
    }
    else {
      done(e);
    }
  }
})

It('`replace` should work - point replace`', function* (done) {
  try {
    result = yield r.db(dbName).table(tableName).delete().run();
    assert(result);
    result = yield r.db(dbName).table(tableName).insert({id: 1}).run();
    assert(result);

    result = yield r.db(dbName).table(tableName).get(1).replace({id: 1, foo: "bar"}).run();
    assert.equal(result.replaced, 1);

    result = yield r.db(dbName).table(tableName).get(1).run();
    assert.deepEqual(result, {id: 1, foo: "bar"});

    done();
  }
  catch(e) {
    done(e);
  }
})

It('`replace` should work - range replace`', function* (done) {
  try {
    result = yield r.db(dbName).table(tableName).delete().run();
    assert(result);
    result = yield r.db(dbName).table(tableName).insert([{id: 1}, {id: 2}]).run();
    assert(result);

    result = yield r.db(dbName).table(tableName).replace(r.row.merge({foo: "bar"})).run();
    assert.equal(result.replaced, 2);

    result = yield r.db(dbName).table(tableName).get(1).run();
    assert.deepEqual(result, {id: 1, foo: "bar"});

    result = yield r.db(dbName).table(tableName).get(2).run();
    assert.deepEqual(result, {id: 2, foo: "bar"});

    done();
  }
  catch(e) {
    done(e);
  }
})

It('`replace` should work - soft durability`', function* (done) {
  try {
    result = yield r.db(dbName).table(tableName).delete().run();
    assert(result);
    result = yield r.db(dbName).table(tableName).insert({id: 1}).run();
    assert(result);

    result = yield r.db(dbName).table(tableName).get(1).replace({id: 1, foo: "bar"}, {durability: "soft"}).run();
    assert.equal(result.replaced, 1);

    result = yield r.db(dbName).table(tableName).get(1).run();
    assert.deepEqual(result, {id: 1, foo: "bar"});

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`replace` should work - hard durability`', function* (done) {
  try {
    result = yield r.db(dbName).table(tableName).delete().run();
    assert(result);
    result = yield r.db(dbName).table(tableName).insert({id: 1}).run();
    assert(result);

    result = yield r.db(dbName).table(tableName).get(1).replace({id: 1, foo: "bar"}, {durability: "hard"}).run();
    assert.equal(result.replaced, 1);

    result = yield r.db(dbName).table(tableName).get(1).run();
    assert.deepEqual(result, {id: 1, foo: "bar"});

    done();
  }
  catch(e) {
    done(e);
  }
})

It('`replace` should work - returnChanges true', function* (done) {
  try {
    result = yield r.db(dbName).table(tableName).delete().run();
    assert(result);
    result = yield r.db(dbName).table(tableName).insert({id: 1}).run();
    assert(result);

    result = yield r.db(dbName).table(tableName).get(1).replace({id: 1, foo: "bar"}, {returnChanges: true}).run();
    assert.equal(result.replaced, 1);
    assert.deepEqual(result.changes[0].new_val, {id: 1, foo: "bar"});
    assert.deepEqual(result.changes[0].old_val, {id: 1});

    result = yield r.db(dbName).table(tableName).get(1).run();
    assert.deepEqual(result, {id: 1, foo: "bar"});

    done();
  }
  catch(e) {
    done(e);
  }
})
It('`replace` should work - returnChanges false`', function* (done) {
  try {
    result = yield r.db(dbName).table(tableName).delete().run();
    assert(result);
    result = yield r.db(dbName).table(tableName).insert({id: 1}).run();
    assert(result);

    result = yield r.db(dbName).table(tableName).get(1).replace({id: 1, foo: "bar"}, {returnChanges: false}).run();
    assert.equal(result.replaced, 1);
    assert.equal(result.changes, undefined);
    assert.equal(result.changes, undefined);

    result = yield r.db(dbName).table(tableName).get(1).run();
    assert.deepEqual(result, {id: 1, foo: "bar"});

    done();
  }
  catch(e) {
    done(e);
  }
})
