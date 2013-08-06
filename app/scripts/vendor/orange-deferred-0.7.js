/**
 deferred.js | 5.19.2013 | 0.7.0
 OrangeUI | Copyright (c) 2013 Kevin Kinnebrew.
 */

(function() {

  function proxy(fn, context) {
    var that = context;
    return function() {
      return fn.apply(that, arguments);
    };
  }

  // status constants
  var PENDING = 0;
  var RESOLVED = 1;
  var REJECTED = 2;

  /**
   * A utility object for binding callbacks to synchronous or asynchronous method calls.
   * @class Deferred
   * @constructor
   */
  function Deferred() {

    this.alwaysCallbacks = [];
    this.successCallbacks = [];
    this.failureCallbacks = [];

    this.status = PENDING;

    this.data = undefined;

  }

  /**
   * Adds a function to be called when the deferred is either rejected or resolved.
   * @method always
   * @param {Function} callback The method to be called.
   * @param {Object} [context] The optional context of the method to be called.
   */
  Deferred.prototype.always = function(callback, context) {

    if (this.status !== PENDING) {
      callback.apply(context, this.data);
    } else {
      this.alwaysCallbacks.push(proxy(callback, context || this));
    }

  };

  /**
   * Adds a function to be called when the deferred is resolved.
   * @method done
   * @param {Function} callback The method to be called.
   * @param {Object} [context] The optional context of the method to be called.
   */
  Deferred.prototype.done = function(callback, context) {

    if (this.status === RESOLVED) {
      callback.apply(context, this.data);
    } else {
      this.successCallbacks.push(proxy(callback, context || this));
    }

  };

  /**
   * Adds a fucntion to be called when the deferred is rejected.
   * @method fail
   * @param {Function} callback The method to be called.
   * @param {Object} [context] The optional context of the method to be called.
   */
  Deferred.prototype.fail = function(callback, context) {

    if (this.status === REJECTED) {
      callback.apply(context, this.data);
    } else {
      this.failureCallbacks.push(proxy(callback, context || this));
    }

  };

  /**
   * Returns if the deferred has been rejected.
   * @method isRejected
   * @return {Boolean} Whether or not the deferred has been rejected.
   */
  Deferred.prototype.isRejected = function() {

    return this.status === REJECTED;

  },

  /**
   * Returns if the deferred has be resolved.
   * @method isResolved
   * @return {Boolean} Whether or not the deferred has been resolved.
   */
  Deferred.prototype.isResolved = function() {

    return this.status === RESOLVED;

  };

  /**
   * Rejects the deferred object with an optional set of arguments to be passed to the callbacks.
   * @method reject
   */
  Deferred.prototype.reject = function() {

    if (this.status === RESOLVED) {
      throw 'Deferred has already been resolved';
    } else if (this.status === REJECTED) {
      throw 'Deferred has already be rejected';
    }

    this.status = REJECTED;

    for (var i = 0; i < this.failureCallbacks.length; i++) {
      this.failureCallbacks[i].apply(this, arguments);
    }

    for (var j = 0; j < this.alwaysCallbacks.length; j++) {
      this.alwaysCallbacks[j].apply(this, arguments);
    }

    this.data = arguments;

  };

  /**
   * Resolves the deferred object with an optional set of arguments to be passed to the callbacks.
   * @method resolve
   */
  Deferred.prototype.resolve = function(/* arguments */) {

    if (this.status === RESOLVED) {
      throw 'Deferred has already been resolved';
    } else if (this.status === REJECTED) {
      throw 'Deferred has already be rejected';
    }

    this.status = RESOLVED;

    for (var i = 0; i < this.successCallbacks.length; i++) {
      this.successCallbacks[i].apply(this, arguments);
    }

    for (var j = 0; j < this.alwaysCallbacks.length; j++) {
      this.alwaysCallbacks[j].apply(this, arguments);
    }

    this.data = arguments;

  };

  /**
   * Takes a success and failure callback that will be executed when the state of the deferred changes.
   * @method then
   * @param {Function} success The success callback to bind.
   * @param {Function} failure The failure callback to bind.
   * @param {Object} context The optional context to execute the callbacks with.
   */
  Deferred.prototype.then = function(success, failure, context) {

    context = arguments[2] || (typeof failure !== 'function' ? failure : this);

    if (typeof success !== 'function') {
      throw 'Success callback for deferred not a function';
    }

    if (this.status === RESOLVED) {

      success.apply(context, this.data);

    } else if (this.status === REJECTED && typeof failure === 'function') {

      failure.apply(context, this.data);

    } else if (this.status === PENDING) {

      this.successCallbacks.push(proxy(success, context));

      if (typeof failure === 'function') {
        this.failureCallbacks.push(proxy(failure, context));
      }

    }

  };

  /**
   * Binds a variable number of deferred objects into a new deferred.
   * @method when
   * @static
   * @return {Deferred} The new deferred object that resolves when all bound deferreds resolve.
   */
  Deferred.when = function(/* arguments */) {

    var deferred = new Deferred();

    var count = 0;
    var deferreds = Array.prototype.slice.call(arguments);

    function success() {
      count--;
      if (count === 0 && !deferred.isRejected()) {
        deferred.resolve();
      }
    }

    function failure() {
      count--;
      if (!deferred.isRejected()) {
        deferred.reject();
      }
    }

    for (var i = 0, len = deferreds.length; i < len; i++) {
      if (deferreds[i] instanceof Deferred) {
        deferreds[i].then(success, failure);
        count++;
      }
    }

    return deferred;

  };

  if (!window.Orange) {
    window.Orange = {};
  }

  Orange.Deferred = Deferred;

}());