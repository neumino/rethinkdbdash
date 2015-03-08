var helper = require(__dirname+"/helper.js");
var Sequence = require(__dirname+"/sequence.js");
var util = require('util');

function Group(groups) {
    this.groups = groups || []; // {group : <group>, reduction: <reduction>}
    // this.type?
}

// Import methods from Sequence
var keys = Object.keys(Sequence.prototype);
for(var i=0; i<keys.length; i++) {
    (function(key) {
        Group.prototype[key] = function() {
            var groups = new Group();
            for(var k=0; k<this.groups.length; k++) {
                groups.addGroup(this.groups[k].group, this.groups[k].reduction[key].apply(this.groups[k].reduction, arguments))
            }
            return groups;
        }
    })(keys[i]);
}

Group.prototype.typeOf = function() {
    if ((this.groups.length > 0) && (this.groups[0].reduction instanceof Sequence)) {
        return "GROUPED_STREAM";
    }
    else {
        return "GROUPED_DATA";
    }
}

Group.prototype.toDatum = function() {
    var result = [];
    for(var i=0; i<this.groups.length; i++) {
        result.push({
            group: this.groups[i].group,
            reduction: helper.toDatum(this.groups[i].reduction)
        })
    }
    return result;
}
Group.prototype.ungroup = function() {
    var result = new Sequence();
    for(var i=0; i<this.groups.length; i++) {
        result.push(this.groups[i]);
    }
    return result;
}

Group.prototype.addGroup = function(group, value) {
    this.groups.push({
        group: group,
        reduction: value
    })
}
Group.prototype.push = function(group, value) {
    var found = false;
    for(var i=0; i<this.groups.length; i++) {
        if (helper.eq(this.groups[i].group, group)) {
            this.groups[i].reduction.push(value);
            found = true;
            break;
        }
    }
    if (found === false) {
        this.groups.push({
            group: group,
            reduction: new Sequence([value])
        });
    }
    return this;
}
module.exports = Group;
