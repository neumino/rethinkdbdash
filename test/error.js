var config = require(__dirname+'/config.js');
var r = require(__dirname+'/../lib')(config);
var util = require(__dirname+'/util/common.js');
var assert = require('assert');

var uuid = util.uuid;
var It = util.It;

var uuid = util.uuid;
var dbName, tableName, result;

It("ReqlResourceError", function* (done) {
  try {
    result = yield r.expr([1,2,3,4]).run({arrayLimit: 2});
  }
  catch(e) {
    assert.equal(e.name, 'ReqlResourceError');
    done()
  }
})
It("ReqlLogicError", function* (done) {
  try {
    result = yield r.expr(1).add("foo").run();
  }
  catch(e) {
    assert.equal(e.name, 'ReqlLogicError');
    done()
  }
})

It("ReqlOpFailedError", function* (done) {
  try {
    result = yield r.db('DatabaseThatDoesNotExist').tableList().run();
  }
  catch(e) {
    assert.equal(e.name, 'ReqlOpFailedError');
    done()
  }
})

It("ReqlUserError", function* (done) {
  try {
    result = yield r.branch(r.error('a'), 1, 2).run()
  }
  catch(e) {
    assert.equal(e.name, 'ReqlUserError');
    done()
  }
})

// Missing tests for ReqlInternalError and ReqlOpIndeterminateError
// as there are no easy way to trigger those
