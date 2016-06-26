// Implement a dequeue with a circular buffer
// The buffer can expand but currently doesn't automatically shrink
// as it is not a desired behavior. We may want to explicitly resize it though.
function Dequeue(size) {
  this.start = 0;
  this.end = 0;

  size = size || 50;
  this.buffer = new Array(size);
}
Dequeue.prototype.get = function(index) {
  if (this.start+index > this.buffer.length) {
    return this.buffer[this.start+index-this.buffer.length]
  }
  else {
    return this.buffer[this.start+index]
  }
}

Dequeue.prototype.toArray = function(index) {
  var result = [];
  for(var i=0; i<this.getLength(); i++) {
    result.push(this.get(i));
  }
  return result;
}

Dequeue.prototype.delete = function(index) {
  var current, next;
  if (this.start+index >= this.buffer.length) {
    current = this.start+index-this.buffer.length;
    next = this.start+index-this.buffer.length+1;
  }
  else {
    current = this.start+index;
    next = this.start+index+1;
  }

  for(var i=index; i<(this.buffer.length-index); i++) {
    if (next === this.buffer.length) next = 0;
    if (current === this.buffer.length) current = 0;

    this.buffer[current] = this.buffer[next];
    current++;
    next++;
  }

  this.end--;
  if (this.end < 0) this.end = this.buffer.length-1
}

Dequeue.prototype.push = function(element) {
  // push on this.end and then increase this.end
  // this.end should NEVER be equal to this.buffer.length
  this.buffer[this.end] = element;
  this.end++;
  if (this.end === this.buffer.length) this.end = 0;

  if (this.start === this.end) {
    // Resize
    var previousBuffer = this.buffer;

    this.buffer = new Array(previousBuffer.length*2);

    var i, k = 0;
    for(i=this.start; i<previousBuffer.length; i++) {
      this.buffer[k++] = previousBuffer[i];
    }
    for(i=0; i<this.start; i++) {
      this.buffer[k++] = previousBuffer[i];
    }
    this.start = 0;
    this.end = previousBuffer.length;
  }
}

Dequeue.prototype.pop = function(element) {
  //TODO: Decrease size when possible/needed? This may not be
  //something we really need/want
  // Return the element in this.end-1
  if (this.getLength() > 0) {
    var pos = this.end-1;
    if (pos < 0) pos = this.buffer.length-1;
    this.end = pos;
    var result = this.buffer[pos];
    this.buffer[pos] = undefined;
    return result;
  }
  else {
    return undefined
  }
}

Dequeue.prototype.unshift = function(element) {
  // push on this.start-1 and then decrease this.start.
  // this.end should NEVER be equal to this.buffer.length

  var pos = this.start-1;
  if (pos < 0) pos = this.buffer.length-1;

  this.buffer[pos] = element;
  this.start = pos;

  if (this.start === this.end) {
    //Resize
    var previousBuffer = this.buffer;

    this.buffer = new Array(previousBuffer.length*2);

    var i, k = 0;
    for(i=this.start; i<previousBuffer.length; i++) {
      this.buffer[k++] = previousBuffer[i];
    }
    for(i=0; i<this.start; i++) {
      this.buffer[k++] = previousBuffer[i];
    }
    this.start = 0;
    this.end = previousBuffer.length;
  }
}

Dequeue.prototype.shift = function() {
  // Return the element in this.start

  if (this.getLength() > 0) {
    var result = this.buffer[this.start];
    this.buffer[this.start] = undefined;
    this.start++;
    if (this.start === this.buffer.length) this.start = 0;
    return result;
  }
}

Dequeue.prototype.getLength = function() {
  if (this.start <= this.end) {
    return this.end-this.start;
  }
  else {
    return this.buffer.length-(this.start-this.end);
  }
}

module.exports = Dequeue;
