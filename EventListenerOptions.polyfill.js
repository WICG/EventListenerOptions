// ==ClosureCompiler==
// @compilation_level SIMPLE_OPTIMIZATIONS
// @output_file_name EventListenerOptions.shim.min.js
// @language ECMASCRIPT5
// ==/ClosureCompiler==

(function() {
  var supportsMayCancel = false;
  document.createElement("div").addEventListener("test", function() {}, {
    get mayCancel() {
      supportsMayCancel = true;
      return false;
    }
  });

  if (!supportsMayCancel) {
    var super_add_event_listener = EventTarget.prototype.addEventListener;
    var super_remove_event_listener = EventTarget.prototype.removeEventListener;
    var super_prevent_default = Event.prototype.preventDefault;

    function parseOptions(type, listener, options, action) {
      var needsWrapping = true;
      var useCapture = false;
      var mayCancel = true;
      var fieldId;
      if (options) {
        if (typeof(options) === 'object') {
          mayCancel = options.mayCancel ? options.mayCancel : false;
          useCapture = options.useCapture ? options.useCapture : false;
        } else {
          useCapture = options;
        }
      }
      if (!mayCancel)
        needsWrapping = true;
      if (needsWrapping) {
        fieldId = useCapture.toString();
        fieldId += mayCancel.toString();
      }
      action(needsWrapping, fieldId, useCapture, mayCancel);
    }

    function wrapCancelableEvent(e) {
      Object.defineProperty(e, "cancelable", {value: false, writable: false, configurable: true});
    }

    function unwrapCancelableEvent(e) {
      delete e.cancelable;
    }

    Event.prototype.preventDefault = function() {
      if (!this.cancelable) {
        console.warn("Trying to PreventDefault a non-cancelable event");
        return;
      }
      super_prevent_default.apply(this);
    }

    EventTarget.prototype.addEventListener = function(type, listener, options) {
      parseOptions(type, listener, options,
        function(needsWrapping, fieldId, useCapture, mayCancel) {
          if (needsWrapping) {
            var fieldId = useCapture.toString();
            fieldId += mayCancel.toString();

            if (!this.__event_listeners_options)
              this.__event_listeners_options = {};
            if (!this.__event_listeners_options[type])
              this.__event_listeners_options[type] = {};
            if (!this.__event_listeners_options[type][listener])
              this.__event_listeners_options[type][listener] = [];
            if (this.__event_listeners_options[type][listener][fieldId])
              return;
            var wrapped = {
              handleEvent: function (e) {
                var wrap = !mayCancel && e.cancelable;
                if (wrap)
                  wrapCancelableEvent(e);
                if (typeof(listener) === 'function') {
                  listener(e);
                } else {
                  listener.handleEvent(e);
                }
                if (wrap)
                  unwrapCancelableEvent(e);
              }
            };
            this.__event_listeners_options[type][listener][fieldId] = wrapped;
            super_add_event_listener(type, wrapped, useCapture);
          } else {
            super_add_event_listener(type, listener, useCapture);
          }
        });
    }

    EventTarget.prototype.removeEventListener = function(type, listener, options) {
      parseOptions(type, listener, options,
        function(needsWrapping, fieldId, useCapture, mayCancel) {
          if (needsWrapping &&
              this.__event_listeners_options &&
              this.__event_listeners_options[type] &&
              this.__event_listeners_options[type][listener] &&
              this.__event_listeners_options[type][listener][fieldId]) {
            super_remove_event_listener(type, this.__event_listeners_options[type][listener][fieldId], false);
            delete this.__event_listeners_options[type][listener][fieldId];
            if (this.__event_listeners_options[type][listener].length == 0)
              delete this.__event_listeners_options[type][listener];
          } else {
            super_remove_event_listener(type, listener, useCapture);
          }
        });
    }
  }
})();
