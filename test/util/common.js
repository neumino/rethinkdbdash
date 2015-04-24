var Promise = require('bluebird');
Promise.coroutine.addYieldHandler(function(yieldedValue) {
  if (Array.isArray(yieldedValue)) return Promise.all(yieldedValue);
});


function s4() {
  return Math.floor((1+Math.random())*0x10000).toString(16).substring(1);
};

function uuid() {
  return s4()+s4()+s4()+s4()+s4()+s4()+s4()+s4();
}

function It(testName, generatorFn) {
  it(testName, function(done) {
    Promise.coroutine(generatorFn)(done);
  })
}
function sleep(timer) {
  return new Promise(function(resolve, reject) {
    setTimeout(resolve, timer);
  });
}

module.exports.uuid = uuid
module.exports.It = It
module.exports.sleep = sleep
