var browserify = require('browserify');
var fs = require('fs');

var REQUIRE_FILES = [
  'connection.js',
  'cursor.js',
  'dequeue.js',
  'error.js',
  'helper.js',
  'metadata.js',
  'pool.js',
  'pool_master.js',
  'protodef.js',
  'stream.js',
  'term.js',
  'transform_stream.js',
  'writable_stream.js'
];

var b = browserify('./lib/')
b.add('./lib/index.js')
for(var i=0; i<REQUIRE_FILES.length; i++) {
  b.require('./lib/'+REQUIRE_FILES[i], {expose: './lib/'+REQUIRE_FILES[i]})
}
b.require('./lib/index.js', {expose: 'rethinkdbdash'})
b.bundle(function(err, result) {
  if (err) {
    console.log(err);
    return;
  }
  fs.writeFileSync('./rethinkdbdash.js', result);
});
