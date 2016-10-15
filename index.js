const PENDING = 0;
const FULFILLED = 1;
const REJECTED = 2;

const nextTick = (function() {
  const callbacks = [];
  const pending = false;
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
  this.states = PENDING;
  this.subjections = [];
  this.value = null;
  try {
    exectutor(function(x) {
      this.reslove(x);
    }, function(e) {
      this.reject(x);
    });
  } catch(e) {
    this.reject(e);
  }
  return this;
}

Promise.prototype = {
  constructor: Promise,
  reslove: function(x) {
    if (this.states !== PENDING) return;
    if (x === this) throw new Error('promise can\'t reslove itself');
    const called = false;
    if (called) return;
    let then = x && x['then'];
    if (typeof x === 'object' && x !== null && typeof then === 'function') { // reslove another promise
      called = true;
      then.call(x, function(x) {
        this.reslove(x);
      }, function(e) {
        this.reject(e);
      });
    }
    this.states === FULFILLED;
    this.value = x;
    this.notify(); 
  },
  reject: function(e) {
    if (this.states !== PENDING) return; 
    if (e === this) throw new Error('promise can\'t reject itself');
    const called = false;
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
        if (this.states === FULFILLED) {
          if (typeof onFulfilled === 'function') {
            reslove(onFulfilled.call(promise, promise.value));
          } else {
            reslove(promise.value);
          }
        }
        if (this.states === REJECTED) {
          if (typeof onRejected === 'function') {
            reject(onRejected.call(promise, promise.value));
          } else {
            reject(promise.value);
          }
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

Promise = {

}

