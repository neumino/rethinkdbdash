var r = require('./lib/index.js')({
});
var assert = require('assert');

var tableName = 'test'+Math.floor(Math.random()*1000);
var size = 30000;

console.log('Using table', tableName);
r.tableCreate(tableName).run().then(function(result) {
  var table = r.table(tableName).toStream({writable: true});
  table.on('error', console.log);
  for(var i=0; i<size; i++) {
    table.write({
      value: i
    });
  }
  table.end();
  table.on('finish', function() {
    console.log('Stream finished.');
    r.table(tableName).count().run().then(function(result) {
      assert.equal(result, size);
      console.log('Done');
      r.getPoolMaster().drain();
    }).catch(console.log);
  });
}).catch(console.log);
