# Passive event listeners

Passive event listeners are a feature that would enable developers to opt-in to better scroll performance by eliminating the need for scrolling to block on touch and wheel event listeners.

## The problem

Smooth scrolling performance is essential to a good experience on the web, especially on touch-based devices.
Yet around 5% of touch scrolls take longer than 100ms to begin on Chrome for Android
(and a catastrophic 500ms delay is not unusual during page load).

All modern browsers have a threaded scrolling feature to permit scrolling to run smoothly even when expensive
JavaScript is running, but this optimization is partially defeated by the need to wait for the results of
any `touchstart` and `touchmove` handlers, which may prevent the scroll entirely by calling [`preventDefault()`](http://www.w3.org/TR/touch-events/#the-touchstart-event)
on the event. However, analysis indicates that the majority of touch event handlers on the web never actually
call `preventDefault()`, so we're often blocking scrolling unneccesarily.

Many developers are surprised to learn that [simply adding an empty touch handler to their document](http://rbyers.github.io/janky-touch-scroll.html) can have a
significant negative impact on scroll performance.  Developers quite reasonably expect that the act of observing an event should not have any side-effects.

The fundamental problem here is not limited to touch events. [`wheel` events](https://w3c.github.io/uievents/#events-wheelevents)
suffer from an identical issue. However [pointer event handlers](https://w3c.github.io/pointerevents/) are
designed to never block scrolling, and so do not suffer from this issue.  Essentially the passive event
listener proposal brings the performance properties of pointer events to touch and wheel events.

This proposal provides a way for authors to indicate at handler registration time whether the handler may call `preventDefault()` on the event (i.e. whether it needs an event that is [cancelable](https://dom.spec.whatwg.org/#dom-event-cancelable)). When no touch handlers at a particular point require a cancelable event, a user agent is free to start scrolling immediately without waiting for JavaScript.

## EventListenerOptions

First, we need a mechanism for attaching additional information to an event listener.  Today the `capture` argument to `addEventListener` is the closest example of something like this, but it's usage is pretty opqaue:

```javascript
  document.addEventListener('touchstart', handler, true);
```

`EventListenerOptions` lets us write this more clearly as:

```javascript
  document.addEventListener('touchstart', handler, {capture: true});
```

Developers / polyfills can do feature detection on specific options as follows:

```javascript
var supportsCaptureOption = false;
document.createElement("div").addEventListener("test", function() {}, {
  get capture() {
    supportsCapture = true;
    return false;
  }
});
function myAddEventListener(target, type, handler, options) {
  var optionsOrCapture = options;
  if (!supportsCaptureOption)
    optionsOrCapture = options.capture;
  target.addEventListener(type, handler, optionsOrCapture);
}
```

## The 'passive' option

The `passive` option is a promise that a listener will never call `preventDefault()` on the event.  If it does, the user agent will just ignore the request (ideally generating at least a console warning), as it already does for events with `Event.cancelable=false`.  A developer can see this is the case by querying `Event.defaultPrevented` before and after calling `preventDefault()`.  Eg:

```javascript
  document.addEventListener("touchstart", function(e) {
    console.log(e.defaultPrevented);  // will be false
    e.preventDefault();   // does nothing since the listener is passive
    console.log(e.defaultPrevented);  // still false
  }, {passive: true});
```

Now rather than the browser having to block scrolling whenever there is any touch or wheel listener, it can do so only when there are *non-passive* listeners.  `passive` listeners are free of performance side-effects.

## Removing the need to cancel touch events

Listeners can be simply updated to be `passive` in a number of common scenarios, eg:
 * User activity monitoring which just wants to know when the user was last active
 * `touchstart` handlers that hide some active UI (like tooltips)
 * `touchstart` and `touchend` handlers that style UI elements (without suppressing the `click` event).

And of course there are scenarios where there is no need to use a `passive` listener because the listener intentionally disables scrolling in all cases, eg:
 * Panning a map
 * Games

But there are a few more complicated scenarios where the handler really wants to suppress scrolling some cases but not in others.  eg:
 * Swiping horizontally to rotate a carousel, dismiss an item or reveal a drawer, while still permitting vertical scrolling.
   * In this case, consider using [touch-action](https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action) to declaratively disable scrolling along one axis without having to call `preventDefault()`.
 * Event delegation patterns where the code that adds the listener won't know if the consumer will cancel the event.
   * Probably the only option here is to do delegation separately for passive and non-passive listeners (as if they were different event types entirely).

## Measuring the benefit

A big part of the reason that this issue hasn't already been addressed is that browsers lack good tooling for understanding the performance impact of this problem.  The Chrome team is working on a proposal for both a [PerformanceTimeline API](https://code.google.com/p/chromium/issues/detail?id=543598) and a [DevTools feature](https://code.google.com/p/chromium/issues/detail?id=520659) to help web developers get better visibility into this problem today.  Without that, the best we can offer is to use [chromium's tracing system](https://www.chromium.org/developers/how-tos/trace-event-profiling-tool) to look at the InputLatency records for scrolling.
