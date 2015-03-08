var Table = require(__dirname+"/table.js");

function Database(name) {
    this.name = name;
    this.tables = {};
}

Database.prototype.table = function(name) {
    return this.tables[name];
}
Database.prototype.tableDrop = function(name) {
    delete this.tables[name];
}
Database.prototype.tableCreate = function(name) {
    this.tables[name] = new Table(name)
}
Database.prototype.typeOf = function() {
    return "DB";
}

module.exports = Database;
