function LinkedList() {
  this.root = null;
  this.last = null;
  this.length = 0;
}

LinkedList.prototype.getLength = function() {
  return this.length;
}

LinkedList.prototype.push = function(connection) {
  var node = new Node(this, connection, this.root, null);
  if (this.root === null) {
    this.root = node;
    this.last = node;
  }
  else {
    this.last.next = node;
    this.last = node;
  }
  this.length++;
  // Keep a reference to the node in the connection
  connection.node = node;
  return node;
}

LinkedList.prototype.unshift = function(connection) {
  var node = new Node(this, connection, null, this.root);
  this.root = node;
  this.length++;
  return node;
}

// Pop a node and return the connection (not the node)
LinkedList.prototype.pop = function() {
  if (this.last === null) {
    console.log("RETURN NULL");
    return null;
  }
  else {
    var last = this.last
    if (this.last.prev === null) {
      // this.last is the root
      this.root = null;
      this.last = null;
    }
    else {
      this.last = this.last.prev;
      this.last.next = null;
    }
    this.length--;
    return last.connection;
  }
}

LinkedList.prototype.shift = function() {
  if (this.root === null) {
    return null;
  }
  var result = this.root;
  this.root = this.root.next;
  this.length--;
  return result.connection;
}

function Node(list, connection, prev, next) {
  this.list = list;
  this.connection = connection;
  this.prev = prev;
  this.next = next;
  this.removed = false;
}

Node.prototype.remove = function() {
  if (this.removed === true) {
    return this.connection;
  }
  this.removed = true;

  if (this.prev === null) {
    if (this.next === null) {
      // The node is the root and has no children
      this.root = null;
      this.last = null;
    }
    else {
      // The node is the root
      this.root = this.next;
    }
  }
  else {
    this.prev.next = this.next;
  }
  this.list.length--;
  return this.connection;
}

module.exports = LinkedList;
