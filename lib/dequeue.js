// Implement a dequeue with a circular buffer
function Dequeue(size) {
    this.start = 0;
    this.end = 0;

    size = size || 2; //TODO set default
    this.buffer = new Array(size);;
}
Dequeue.prototype.get = function(index) {
    if (this.start+index > this.buffer.length) {
        return this.buffer[this.start+index-this.buffer.length]
    }
    else {
        return this.buffer[this.start+index]
    }
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
    // Return the element in this.end-1
    if (this.getLength() > 0) {
        var pos = this.end-1;
        if (pos < 0) pos = this.buffer.length-1;
        this.end = pos;
        return this.buffer[pos];
    }
    else {
        return undefined
    }
    var pos = this.end-1;
    if (pos < 0) pos = this.buffer.length-1;

    if (this.end !== this.start) {
        this.end = pos;
        return this.buffer[pos];
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
