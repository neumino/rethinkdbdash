var config = require(__dirname+'/config.js');
var r = require(__dirname+'/../lib')(config);
var assert = require('assert');

var connection; // global connection
var dbName, tableName, docs;


function s4() {
    return Math.floor((1+Math.random())*0x10000).toString(16).substring(1);
};

function uuid() {
    return s4()+s4()+s4()+s4()+s4()+s4()+s4()+s4();
}

describe("callback", function() {
    it("Create db", function(done) {
        dbName = uuid();

        r.dbCreate(dbName).run().then(function(result) {
            assert.deepEqual(result, {created: 1});
            done();
        }).error(function(error) {
            done(error);
        })
    })

    it("Create table", function(done) {
        tableName = uuid();

        r.db(dbName).tableCreate(tableName).run().then(function(result) {
            assert.deepEqual(result, {created: 1});
            done();
        }).error(function(error) {
            done(error);
        })
    })

    it("Insert", function(done) {
        r.db(dbName).table(tableName).insert([{name: "Michel", age: 27}, {name: "Sophie", age: 23}]).run().then(function(result) {
            assert.deepEqual(result.inserted, 2);
            done();
        }).error(function(error) {
            done(error);
        })
    })


    it("Table", function(done) {
        r.db(dbName).table(tableName).run().then(function(result) {
            assert(result.length, 2)
            docs = result;
            done();
        }).error(function(error) {
            done(error);
        })
    })

    it("get", function(done) {
        r.db(dbName).table(tableName).get(docs[0].id).run().then(function(result) {
            assert.deepEqual(result, docs[0])
            done();
        }).error(function(error) {
            done(error);
        })
    })

    it("datum", function(done) {
        r.expr({foo: "bar"}).run().then(function(result) {
            assert.deepEqual(result, {foo: "bar"})
            done();
        }).error(function(error) {
            done(error);
        })
    })

    it("date", function(done) {
        r.now().run().then(function(result) {
            assert(result instanceof Date) 
            done();
        }).error(function(error) {
            done(error);
        })
    })

})
