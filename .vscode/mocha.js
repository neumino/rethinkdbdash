'use strict';

// Dependencies
var Mocha = require('mocha');

// Determine which tests to run based on argument passed to runner
var args = process.argv.splice(2);
var files;



//Define Mocha
var mocha = new Mocha({
  timeout: 6000,
  reporter: 'spec',
  globals: ['Associations', 'CREATE_TEST_WATERLINE', 'DELETE_TEST_WATERLINE']
});

args.forEach(mocha.addFile.bind(mocha));

//Run unit tests
mocha.run(function (failures) {
    process.exit(failures);
});