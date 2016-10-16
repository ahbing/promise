const PENDING = 0;
const FULFILLED = 1;
const REJECTED = 2;

const nextTick = (function() {
  const callbacks = [];
  let pending = false;
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
      setTimeout(callbacksHandler, 0);
    }
  }
})();

export default function Promise(exectutor) {
  let start = Date.now();
  this.states = PENDING;
  this.subjections = [];
  this.value = null;
  let promise = this;
  try {
    exectutor(function(x) {
      promise.reslove(x);
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
  reslove: function(x) {
    if (this.states !== PENDING) return;
    if (x === this) throw new TypeError('Promise settled with itself.');
    let called = false;
    if (called) return;
    let then = x && x['then'];
    if (typeof x === 'object' && x !== null && typeof then === 'function') { // reslove another promise
      try {
        then.call(x, function(x) {
          this.reslove(x);
        }, function(e) {
          this.reject(e);
        });
        called = true;
      } catch (e) {
        if (!called) {
          this.reject(e);
        }
      }
    }
    
    this.states = FULFILLED;
    this.value = x;
    this.notify();
  },

  reject: function(e) {
    if (this.states !== PENDING) return;
    if (e === this) throw new TypeError('Promise settled with itself.');
    let called = false;
    if (called) return;
    called = true;
    this.states = REJECTED;
    this.value = e;
    this.notify();
  },

  notify: function() {
    if (this.states === PENDING) return;
    const promise = this;
    nextTick(function() {
      while (promise.subjections.length) {
        let subjection = promise.subjections.shift();
        let onFulfilled = subjection[0];
        let onRejected = subjection[1];
        let reslove = subjection[2];
        let reject = subjection[3];
        try {
          if (promise.states === FULFILLED) {
            if (typeof onFulfilled === 'function') {
              reslove(onFulfilled.call(undefined, promise.value));
            } else {
              reslove(promise.value);
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
    return new Promise(function(reslove, reject) {
      prePromise.subjections.push([onFulfilled, onRejected, reslove, reject]);
      prePromise.notify();
    });
  },

  catch: function(onRejected) {
    return this.then(null, onRejected);
  }
}


Promise.reslove = function(x) {
  return new Promise(function(reslove, reject) {
    reslove(x);
  })
};

Promise.reject = function(e) {
  return new Promise(function(reslove, reject) {
    reject(e);
  })
};

Promise.all = function(iterable) {
  return new Promise(function(reslove, reject) {
    const result  = [];
    let count = 0;
    function reslover(i) {
      return function(x) {
        result[i] = x;
        count += 1;
        if (count === iterable.length) {
          reslove(result);
        }
      };
    }
    for (let i = 0, l = iterable.length; i < l; i++) {
      Promise.reslove(iterable[i]).then(reslover(i), reject);
    }
  });
};

Promise.race = function(iterable) {
  return new Promise(function(reslove, reject) {
    for (let i = 0, l = iterable.length; i < l; i++) {
      Promise.reslove(iterable[i]).then(reslove, reject);
    }
  });
};

