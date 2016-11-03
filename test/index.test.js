import chai from 'chai';
import Promise from '../index';
import sinon from 'sinon';
let expect = chai.expect;
const PENDING = 0;
const FULFILLED = 1;
const REJECTED = 2;
let noop = function() {};

describe('#Promise', function() {
  it('create a new Promise', function() {
    let promise = new Promise(function() {});
    expect(promise).to.be.an.instanceof(Promise);
    expect(promise).to.be.property('states', PENDING);
    expect(promise).to.have.property('subjections').that.is.an('array');
    expect(promise).to.be.property('value', null);
  });
});


describe('#promise.prototype.resolve', function() {
  it('throw err if promise resolve self', function() {
    let promise = new Promise(function(resolve) {
      resolve(this);
      expect(resolve).to.throw(Error);
    });
  });

  it('call Promise.prototype.resolve with a simple value', function() {
    let promise = new Promise(function(resolve) {
      resolve('1');
    });
    expect(promise).to.be.property('states', FULFILLED);
    expect(promise).to.be.property('value', '1');
    expect(promise).to.be.property('subjections').to.be.empty;
  });

  it('call Promise.prototype.resolve with another promise', function(done) {
    let resolvePromise = new Promise(function(resolve) {
      resolve(1);
    });
    let promise = new Promise(function(resolve) {
      resolve(resolvePromise);
    });
    promise.then(function(x) {
      expect(x).to.equal(1);
      expect(promise.states).to.equal(FULFILLED)
      done();
    });
  });

});


describe('#promise.prototype.reject', function() {

  it('throw err if promise reject self', function() {
    let promise = new Promise(function(resolve, reject) {
      reject(this);
      expect(reject).to.throw(Error);
    });
  });

  it('call Promise.prototype.reject with a simple value', function() {
    let promise = new Promise(function(resolve, reject) {
      reject('err')
    });
    expect(promise).to.be.property('states', REJECTED);
    expect(promise).to.be.property('value', 'err');
    expect(promise).to.be.property('subjections').to.be.empty;
  });

  it('call Promise.prototype.reject with another promise', function() {
    let rejectPromise = new Promise(function(resolve, reject) {
      reject('err');
    });
    let promise = new Promise(function(resolve, reject) {
      reject(rejectPromise)
    });
    expect(promise).to.be.property('states', REJECTED);
    expect(promise).to.be.property('value', rejectPromise);
    expect(promise).to.be.property('subjections').to.be.empty;
    expect(rejectPromise).to.be.property('states', REJECTED);
    expect(rejectPromise).to.be.property('value', 'err');
  });

});


describe('#promise.prototype notify & then & catch', function() {

  it('call then resolve function and notify', function(done) {
    let spy1 = sinon.spy();
    let spy2 = sinon.spy();
    let promise = new Promise(function(resolve, reject) {
      resolve(1);
    });
    let promise1 = promise.then(spy1);
    let promise2 = promise1.then(spy2);
    expect(promise.value).to.equal(1);
    expect(promise).to.be.property('states', FULFILLED);
    expect(spy1.called).to.be.false;
    expect(spy2.called).to.be.false;
    expect(promise.subjections).to.have.lengthOf(1);
    expect(promise1.subjections).to.have.lengthOf(1);
    expect(promise2.subjections).to.have.lengthOf(0);
    setTimeout(function() {
      expect(spy1.called).to.be.true;
      expect(spy2.called).to.be.true;
      done();
    }, 0);
  });

  it('call then reject function and notify', function(done) {
    let spy1 = sinon.spy();
    let spy2 = sinon.spy();
    let promise = new Promise(function(resolve, reject) {
      reject('err');
    });
    let promise1 = promise.then(noop, spy1);
    let promise2 = promise1.then(noop, spy2);
    expect(promise.value).to.equal('err');
    expect(promise).to.be.property('states', REJECTED);
    expect(promise.subjections).to.have.lengthOf(1);
    expect(promise1.subjections).to.have.lengthOf(1);
    expect(promise2.subjections).to.have.lengthOf(0);
    setTimeout(function() {
      expect(spy1.called).to.be.true;
      expect(spy2.called).to.be.true;
      done();
    }, 0);
  });

  it('call catch', function(done) {
    let spy1 = sinon.spy();
    let promise = new Promise(function(resolve, reject) {
      reject('err');
    });
    let promise1 = promise.catch(spy1);
    expect(promise.value).to.equal('err');
    expect(promise).to.be.property('states', REJECTED);
    expect(promise.subjections).to.have.lengthOf(1);
    expect(promise1.subjections).to.have.lengthOf(0);
    setTimeout(function() {
      expect(spy1.called).to.be.true;
      done();
    }, 0);
  })

});

describe('#resolve', function() {

  it('resolve simple', function() {  
    let promise = Promise.resolve(1);
    expect(promise.value).to.equal(1);
    expect(promise.subjections).to.have.lengthOf(0);
    expect(promise).to.be.property('states', FULFILLED);
    expect(promise).to.be.an.instanceof(Promise);
  });

  it('resolve promise', function(done) {
    Promise.resolve(Promise.resolve('hello')).then(function(x) {
      done();
    })
  })


});

describe('#reject', function() {
  it('reject', function() {  
    let promise = Promise.reject('err');
    expect(promise.value).to.equal('err');
    expect(promise.subjections).to.have.lengthOf(0);
    expect(promise).to.be.property('states', REJECTED);
    expect(promise).to.be.an.instanceof(Promise);
  });
})

describe('#all', function() {

  it('should resolve all with zero promises', function (done) {
    Promise.all([]).then(function (x) {
      expect(x).to.eql([]);
      done();
    });
  });

  it('returns all resolved promises', function (done) {
    Promise.all([Promise.resolve('hello'), Promise.resolve('world')]).then(function (x) {
      done();
    });
  });

  it('rejects the promise if one of all is rejected', function(done) {
    Promise.all([Promise.resolve('world'), Promise.reject('bye')]).then(function() {}, function(r) {
      expect(r).to.eql('bye');
      done();
    })
  });

  it('returns all promises in order with delays', function(done) {
    Promise.all([
      new Promise(function(resolve) {
        setTimeout(function() {
          resolve('world');
        }, 50);
      }),
      Promise.resolve('hello')
    ]).then(function(x) {
      expect(x).to.eql(['hello', 'world']);
      done();
    })
  });

  it('converts a non-promise to a promise', function(done) {
    Promise.all(['hello', Promise.resolve('world')]).then(function(x) {
      expect(x).to.eql(['hello', 'world']);
      done();
    })
  })
});


describe('#race', function() {
  it('should race a single resolved promise', function(done) {
    Promise.race([Promise.resolve('hello')]).then(function(x) {
      expect(x).to.eql('hello');
      done();
    })
  });
  it('should race a single rejected promise', function(done) {
    Promise.race([Promise.reject('bye')]).then(noop, function(e) {
      expect(e).to.eql('bye')
      done();
    });
  });
  it('should race two resolved promises', function(done) {
    Promise.race([Promise.resolve('hello'), Promise.resolve('world')]).then(function(x) {
      expect(x).to.eql('hello');
      done();
    })
  });
  it('should race two rejected promises', function(done) {
    Promise.race([Promise.reject('bye'), Promise.reject('world')]).then(noop, function(e) {
      expect(e).to.eql('bye');
      done();
    });
  });
  it('should race one delayed and one resolved promise', function(done) {
    Promise.race([
      new Promise(function(resolve) {
        setTimeout(function() {
          resolve('world');
        }, 50);
      }),
      Promise.resolve('hello')
    ]).then(function(x) {
      expect(x).to.eql('hello');
      done();
    });
  });
  it('should race one delayed and one rejected promise', function(done) {
    Promise.race([
      new Promise(function(noop, reject) {
        setTimeout(function() {
          reject('bye');
        }, 20);
      }),
      Promise.reject('world')
    ]).then(noop, function(e) {
      expect(e).to.eql('world');
      done();
    });
  });
  it('should race two delayed promises', function(done) {
    Promise.race([
      new Promise(function(resolve) {
        setTimeout(function() {
          resolve('world');
        }, 100);
      }),
      new Promise(function(resolve) {
        setTimeout(function() {
          resolve('hello');
        }, 50);
      })
    ]).then(function(x) {
      expect(x).to.eql('hello');
      done();
    });
  });
  it('converts a non-promise to a promise', function(done) {
    Promise.race(['hello', Promise.resolve('world')]).then(function(x) {
      expect(x).to.eql('hello');
      done();
    });
  });
});

