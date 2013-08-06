/**
 orange-event.js | 5.19.2013 | 0.7.0
 OrangeUI | Copyright (c) 2013 Kevin Kinnebrew.
 */

(function() {

  function proxy(fn, context) {
    var that = context;
    return function() {
      return fn.apply(that, arguments);
    };
  }

  /**
   * @class EventError
   * @extends Error
   * @constructor
   * @param [message]
   */
  function EventError(message) {
    this.name = 'EventError';
    this.message = message || 'Error using a event object.';
  }
  EventError.prototype = new Error();
  EventError.prototype.constructor = EventError;

  /**
   * The target object that is returned to an event listener.
   * @class EventTarget
   * @constructor
   * @param {String} type
   * @param {*} target
   * @param {*} currentTarget
   * @param {*} data
   */
  function EventTarget(type, target, currentTarget, data) {

    this.bubbles = true;
    this.type = type;
    this.target = target;
    this.currentTarget = currentTarget;
    this.data = data;

  }

  /**
   * Stops a event from bubble any other layer.
   * @method stopPropagation
   */
  EventTarget.prototype.stopPropagation = function() {
    this.bubbles = false;
  };


  /**
   * An object that holds references to an event binding for easy detachment later.
   * @class EventHandle
   * @constructor
   * @param {Object} target The target the event is bound to.
   * @param {String} event The name of the event that is bound.
   * @param {Function} listener The listener bound to the given event.
   */
  function EventHandle(target, event, listener) {

    this.listener = listener;
    this.event = event;
    this.target = target;

  }

  /**
   * Detaches the event referenced by the EventHandle.
   * @method detach
   */
  EventHandle.prototype.detach = function() {

    this.target.detach(this.event, this.listener);

    delete this.target;
    delete this.event;
    delete this.listener;

  };


  /**
   * Adds subscriber pattern event handling to a javascript object.
   * @mixin Events
   */
  var EventMixin = {

    /**
     * Binds an event listener with a given context to the object.
     * @method on
     * @param {String} event The event to bind the listener to.
     * @param {Function} listener The listener to bind to the event.
     * @param {Context} [context] The context with which to execute the listener.
     * @return {EventHandle} An object holding references to the event to detach later.
     */
    on: function(event, listener, context) {

      var fn = context ? proxy(listener, context) : listener;

      if (!this._listeners) { this._listeners = {}; }
      if (!this._listeners.hasOwnProperty(event)) { this._listeners[event] = []; }
      this._listeners[event].push(fn);

      return new EventHandle(this, event, fn);

    },

    /**
     * Binds an event listener with a given context to the object to be executed once.
     * @method once
     * @param {String} event The event to bind the listener to.
     * @param {Function} listener The listener to bind to the event to be triggered once.
     * @param {Context} context The context with which to execute the listener.
     */
    once: function(event, listener, context) {

      var fn = context ? proxy(listener, context) : listener, handle;

      var wrap = function() {
        listener.apply(this, arguments);
        handle.detach(event, fn);
      };

      handle = this.on(event, wrap);

    },

    /**
     * Triggers an event on the object. If a parent has been defined, the event will bubble.
     * @method fire
     * @param {String|EventTarget} event The event to trigger on the object.
     */
    fire: function(event /* payload */) {

      if (typeof event !== 'string' && !(event instanceof EventTarget)) {
        throw EventError('Cannot fire event, invalid syntax.');
      }

      var parent = this.parent || null;
      var data = Array.prototype.slice.call(arguments, 1);
      var target = typeof event === 'string' ? new EventTarget(event, this, this, data) : event;

      if (!this._listeners) { this._listeners = {}; }

      if (this._listeners[target.type] instanceof Array) {
        var listeners = this._listeners[target.type];
        for (var i = 0, len = listeners.length; i < len; i++) {
          listeners[i].apply(this, [target].concat(target.data));
        }
      }

      if (parent !== null && target.bubbles && target.type[0] !== '_' && typeof parent.fire === 'function') {
        target.currentTarget = this.parent;
        parent.fire.call(parent, target, data);
      }

    },

    /**
     * Detaches an event listener or set of listeners from the object. No arguments detaches all listeners.
     * @method detach
     * @param {String} event
     * @param {Function} listener
     */
    detach: function(event, listener) {

      if (!this._listeners) { this._listeners = {}; }

      if (!event) {
        this._listeners = {};
      } else if (this._listeners[event] instanceof Array) {
        if (typeof listener === 'function') {
          var listeners = this._listeners[event];
          for (var i = 0, len = listeners.length; i < len; i++) {
            if (listeners[i] === listener) {
              listeners.splice(i, 1);
              break;
            }
          }
        } else {
          this._listeners[event] = [];
        }
      }

    }

  };

  var Event = {

    mixin: function(obj) {
      if (typeof obj !== 'function') {
        throw 'Cannot mix not object';
      }
      obj.prototype.on = EventMixin.on;
      obj.prototype.once = EventMixin.once;
      obj.prototype.fire = EventMixin.fire;
      obj.prototype.detach = EventMixin.detach;
    }

  };

  if (!window.Orange) {
    window.Orange = {};
  }

  Orange.Event = Event;

}());