var Dequeue = require(__dirname+'/../lib/dequeue.js')
var assert = require('assert');

var size = 20;
var initSize = 3;
it("Test dequeue - push and shift", function() {
    var q = new Dequeue(initSize);

    for(var i=0; i<size; i++) {
        q.push(i);
    }
    for(var i=0; i<size; i++) {
        assert.equal(i, q.shift());
        assert.equal(q.getLength(), size-1-i);
    }
})

it("Test dequeue - push and pop", function() {
    var q = new Dequeue(initSize);
    for(var i=0; i<size; i++) {
        q.push(i);
    }
    for(var i=0; i<size; i++) {
        assert.equal(size-1-i, q.pop());
        assert.equal(q.getLength(), size-1-i);
    }
})
it("Test dequeue - unshift and shift", function() {
    var q = new Dequeue(initSize);
    for(var i=0; i<size; i++) {
        q.unshift(i);
    }
    for(var i=0; i<size; i++) {

        assert.equal(size-1-i, q.shift());
        assert.equal(q.getLength(), size-1-i);
    }
})

it("Test dequeue - unshift and pop", function() {
    var q = new Dequeue(initSize);
    for(var i=0; i<size; i++) {
        q.unshift(i);
    }
    for(var i=0; i<size; i++) {
        assert.equal(i, q.pop());
        assert.equal(q.getLength(), size-1-i);
    }
})

it("Test dequeue - a little of everything", function() {
    var q = new Dequeue(initSize);
    for(var i=0; i<size; i++) {
        q.unshift(i);
    }
    for(var i=0; i<size; i++) {
        q.push(i+100);
    }
    for(var i=0; i<size-10; i++) {
        assert.equal(size-1+100-i, q.pop());
    }
    for(var i=0; i<size-10; i++) {
        assert.equal(size-i-1, q.shift());
    }

    assert(q.getLength(), size*2-10-10)
})

it("Test dequeue - push/unshift", function() {
    var q = new Dequeue(initSize);
    for(var i=0; i<size; i++) {
        q.push(i);
        q.unshift(i);
    }
    assert(q.getLength(), size*2)
    for(var i=0; i<size*10; i++) {
        q.push(-1);
    }
    assert(q.getLength(), size*(2+10))

})
it("Test dequeue - push and shift -- initSize = num push/shift", function() {
    var q = new Dequeue(initSize);

    for(var i=0; i<initSize; i++) {
        q.push(i);
    }
    for(var i=0; i<initSize; i++) {
        assert.equal(i, q.shift());
        assert.equal(q.getLength(), initSize-1-i);
    }
})

it("Test dequeue - push and pop -- initSize = num push/shift", function() {
    var q = new Dequeue(initSize);
    for(var i=0; i<initSize; i++) {
        q.push(i);
    }
    for(var i=0; i<initSize; i++) {
        assert.equal(initSize-1-i, q.pop());
        assert.equal(q.getLength(), initSize-1-i);
    }
})

it("Test dequeue - unshift and shift -- initSize = num push/shift", function() {
    var q = new Dequeue(initSize);
    for(var i=0; i<initSize; i++) {
        q.unshift(i);
    }
    for(var i=0; i<initSize; i++) {
        assert.equal(initSize-1-i, q.shift());
        assert.equal(q.getLength(), initSize-1-i);
    }
})

it("Test dequeue - unshift and pop -- initSize = num push/shift", function() {
    var q = new Dequeue(initSize);
    for(var i=0; i<initSize; i++) {
        q.unshift(i);
    }
    for(var i=0; i<initSize; i++) {
        assert.equal(i, q.pop());
        assert.equal(q.getLength(), initSize-1-i);
    }
})

it("Test dequeue - push and shift -- initSize = num push/shift+1", function() {
    var q = new Dequeue(initSize);

    for(var i=0; i<initSize+1; i++) {
        q.push(i);
    }
    for(var i=0; i<initSize+1; i++) {
        assert.equal(i, q.shift());
        assert.equal(q.getLength(), initSize+1-1-i);
    }
})

it("Test dequeue - push and pop -- initSize = num push/shift+1", function() {
    var q = new Dequeue(initSize);
    for(var i=0; i<initSize+1; i++) {
        q.push(i);
    }
    for(var i=0; i<initSize+1; i++) {
        assert.equal(initSize+1-1-i, q.pop());
        assert.equal(q.getLength(), initSize+1-1-i);
    }
})

it("Test dequeue - unshift and shift -- initSize = num push/shift+1", function() {
    var q = new Dequeue(initSize);
    for(var i=0; i<initSize+1; i++) {
        q.unshift(i);
    }
    for(var i=0; i<initSize+1; i++) {

        assert.equal(initSize+1-1-i, q.shift());
        assert.equal(q.getLength(), initSize+1-1-i);
    }
})
it("Test dequeue - unshift and pop -- initSize = num push/shift+1", function() {
    var q = new Dequeue(initSize);
    for(var i=0; i<initSize+1; i++) {
        q.unshift(i);
    }
    for(var i=0; i<initSize+1; i++) {
        assert.equal(i, q.pop());
        assert.equal(q.getLength(), initSize+1-1-i);
    }
})



it("Test dequeue - a little of everything", function() {
    var q = new Dequeue(initSize);
    for(var i=0; i<size; i++) {
        q.unshift(i);
    }
    for(var i=0; i<size; i++) {
        q.push(i+100);
    }
    for(var i=0; i<size-10; i++) {
        assert.equal(size-1+100-i, q.pop());
    }
    for(var i=0; i<size-10; i++) {
        assert.equal(size-i-1, q.shift());
    }

    assert(q.getLength(), size*2-10-10)
})



it("Test dequeue - shift returns undefined if no element", function() {
    var q = new Dequeue(initSize);
    assert.equal(q.shift(), undefined);
    assert.equal(q.getLength(), 0)
})

it("Test dequeue - pop returns undefined if no element", function() {
    var q = new Dequeue(initSize);
    assert.equal(q.pop(), undefined);
    assert.equal(q.getLength(), 0)
})
