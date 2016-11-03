const PENDING = 0;
const FULFILLED = 1;
const REJECTED = 2;

const nextTick = (function() {
  const callbacks = [];
  let pending = false;
  let timeFunc = setTimeout;

  function callbacksHandler() {
    pending = false;
    const copies = callbacks.slice(0);
    callbacks.length = 0;
    for (let i = 0, l = copies.length; i < l; i++) {
      copies[i]();
    }
  }
  return function queueNextTick(cb, ctx) {
    let func = ctx ? function() { cb.call(ctx) } : cb;
    callbacks.push(func);
    if (!pending) {
      pending = true;
      timeFunc(callbacksHandler, 0);
    }
  }
})();

/**
* expose 
*/
module.exports = Promise['default'] = Promise;

function Promise(exectutor) {
  this.states = PENDING;
  this.subjections = [];
  this.value = null;
  let promise = this;
  try {
    exectutor(function(x) {
      promise.resolve(x);
    }, function(e) {
      promise.reject(e);
    });
  } catch(e) {
    promise.reject(e);
  }
  return this;
}

Promise.prototype = {
  constructor: Promise,
  resolve: function(x) {
    if (this.states !== PENDING) return;
    if (x === this) throw new Error('Promise settled with itself.');
    let called = false;
    if (called) return;
    let promise = this;
    let then = x && x['then'];
    if (typeof x === 'object' && x !== null && typeof then === 'function') { // resolve another promise
      try {
        then.call(x, function(x) {
          promise.resolve(x);
        }, function(e) {
          promise.reject(e);
        });
        called = true;
      } catch (e) {
        if (!called) {
          this.reject(e);
        }
      }
      return;
    }
    
    this.states = FULFILLED;
    this.value = x;
    this.notify();
  },

  reject: function(e) {
    if (this.states !== PENDING) return;
    if (e === this) throw new Error('Promise settled with itself.');
    this.states = REJECTED;
    this.value = e;
    this.notify();
  },

  notify: function() {
    
    const promise = this;
    nextTick(function() {
      if (promise.states === PENDING) return; 
      while (promise.subjections.length) {
        let subjection = promise.subjections.shift();
        let onFulfilled = subjection[0];
        let onRejected = subjection[1];
        let resolve = subjection[2];
        let reject = subjection[3];
        try {
          if (promise.states === FULFILLED) {
            if (typeof onFulfilled === 'function') {
              resolve(onFulfilled.call(undefined, promise.value));
            } else {
              resolve(promise.value);
            }
          }
          if (promise.states === REJECTED) {
            if (typeof onRejected === 'function') {
              reject(onRejected.call(undefined, promise.value));
            } else {
              reject(promise.value);
            }
          }
        } catch (e) {
          reject(e);
        }
      }
      
    });
  },

  then: function(onFulfilled, onRejected) {
    const prePromise = this;
    return new Promise(function(resolve, reject) {
      prePromise.subjections.push([onFulfilled, onRejected, resolve, reject]);
      prePromise.notify();
    });
  },

  catch: function(onRejected) {
    return this.then(null, onRejected);
  }
}


Promise.resolve = function(x) {
  return new Promise(function(resolve, reject) {
    resolve(x);
  })
};

Promise.reject = function(e) {
  return new Promise(function(resolve, reject) {
    reject(e);
  })
};

Promise.all = function(iterable) {
  return new Promise(function(resolve, reject) {
    const result  = [];
    let count = 0;
    let l = iterable.length;
    if (l === 0) return resolve(result);
    function resolver() {
      return function(x) {
        result.push(x);
        count += 1;
        if (count === l) {
          resolve(result);
        }
      };
    }
    for (let i = 0; i < l; i++) {
      Promise.resolve(iterable[i]).then(resolver(), reject);
    }
  });
};

Promise.race = function(iterable) {
  return new Promise(function(resolve, reject) {
    for (let i = 0, l = iterable.length; i < l; i++) {
      Promise.resolve(iterable[i]).then(resolve, reject);
    }
  });
};

