# Passive event listeners

Passive event listeners are a new feature [in the DOM spec](https://dom.spec.whatwg.org/#dom-eventlisteneroptions-passive) that enable developers to opt-in to better scroll performance by eliminating the need for scrolling to block on touch and wheel event listeners.  This feature is [shipping in Chrome 51](https://www.chromestatus.com/features/5745543795965952) ([demo video](https://www.youtube.com/watch?v=NPM6172J22g)).

## The problem

Smooth scrolling performance is essential to a good experience on the web, especially on touch-based devices.
Yet in Chrome for Android we see that 80% of the touch events that block scrolling never actually prevent it.  10% of these events add more than 100ms of delay to the start of scrolling, and a catastrophic delay of at least 500ms occurs in 1% of scrolls.

All modern browsers have a threaded scrolling feature to permit scrolling to run smoothly even when expensive
JavaScript is running, but this optimization is partially defeated by the need to wait for the results of
any `touchstart` and `touchmove` handlers, which may prevent the scroll entirely by calling [`preventDefault()`](http://www.w3.org/TR/touch-events/#the-touchstart-event)
on the event. However, analysis indicates that the majority of touch event handlers on the web never actually
call `preventDefault()`, so we're often blocking scrolling unneccesarily.

Many developers are surprised to learn that [simply adding an empty touch handler to their document](http://rbyers.github.io/janky-touch-scroll.html) can have a
significant negative impact on scroll performance.  Developers quite reasonably expect that the act of observing an event [should not have any side-effects](https://dom.spec.whatwg.org/#observing-event-listeners).

The fundamental problem here is not limited to touch events. [`wheel` events](https://w3c.github.io/uievents/#events-wheelevents)
suffer from an identical issue. However [pointer event handlers](https://w3c.github.io/pointerevents/) are
designed to never block scrolling, and so do not suffer from this issue.  Essentially the passive event
listener proposal brings the performance properties of pointer events to touch and wheel events.

This proposal provides a way for authors to indicate at handler registration time whether the handler may call `preventDefault()` on the event (i.e. whether it needs an event that is [cancelable](https://dom.spec.whatwg.org/#dom-event-cancelable)). When no touch handlers at a particular point require a cancelable event, a user agent is free to start scrolling immediately without waiting for JavaScript.  That is, passive listeners are free from surprising performance side-effects.

## EventListenerOptions

First, we need a mechanism for attaching additional information to an event listener.  Today the `capture` argument to `addEventListener` is the closest example of something like this, but it's usage is pretty opqaue:

```javascript
  document.addEventListener('touchstart', handler, true);
```

[`EventListenerOptions`](https://dom.spec.whatwg.org/#dictdef-eventlisteneroptions) lets us write this more clearly as:

```javascript
  document.addEventListener('touchstart', handler, {capture: true});
```

## Feature Detection

Because older browsers will interpret any object in the 3rd argument as `useCapture=true` it's important for developers to use feature detection or [a polyfill](https://github.com/WICG/EventListenerOptions/blob/gh-pages/EventListenerOptions.polyfill.js) when using this API.  Feature detection for specific options can be done as follows:

```javascript
var supportsCaptureOption = false;
try {
  var opts = Object.defineProperty({}, 'capture', {
    get: function() {
      supportsCaptureOption = true;
    }
  });
  window.addEventListener("test", null, ops);
} catch (e) {}

function addEventListenerWithOptions(target, type, handler, options) {
  var optionsOrCapture = options;
  if (!supportsCaptureOption) {
    optionsOrCapture = options.capture;
  }
  target.addEventListener(type, handler, optionsOrCapture);
}
```

## The 'passive' option

The `passive` option declares up-front that the listener will never call `preventDefault()` on the event.  If it does, the user agent will just ignore the request (ideally generating at least a console warning), as it already does for events with `Event.cancelable=false`.  A developer can see this is the case by querying `Event.defaultPrevented` before and after calling `preventDefault()`.  Eg:

```javascript
  addEventListenerWithOptions(document, "touchstart", function(e) {
    console.log(e.defaultPrevented);  // will be false
    e.preventDefault();   // does nothing since the listener is passive
    console.log(e.defaultPrevented);  // still false
  }, {passive: true});
```

Now rather than the browser having to block scrolling whenever there is any touch or wheel listener, it can do so only when there are *non-passive* listeners (see [TouchEvents spec](http://w3c.github.io/touch-events/#cancelability)).  `passive` listeners are free of performance side-effects.

## Removing the need to cancel touch events

In general touch listeners should always be `passive` unless you know they need to block scrolling.  In a number of common scenarios the `passive` option can be added (with appropriate feature detection) without any other changes, eg:
 * User activity monitoring which just wants to know when the user was last active
 * `touchstart` handlers that hide some active UI (like tooltips)
 * `touchstart` and `touchend` handlers that style UI elements (without suppressing the `click` event).

And of course there are scenarios where there is no need to use a `passive` listener because the listener intentionally disables scrolling in all cases, eg:
 * Panning a map
 * Full-page games

But there are a few more complicated scenarios where the handler really wants to suppress scrolling some cases but not in others.  eg:
 * Swiping horizontally to rotate a carousel, dismiss an item or reveal a drawer, while still permitting vertical scrolling.
   * In this case, use [touch-action](https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action) to declaratively disable scrolling along one axis without having to call `preventDefault()`.
   * To continue to work correctly in all browsers, calls to `preventDefault` should be conditional on the lack of support for the particular `touch-action` rule being used (note that Safari 9 supports `touch-action: manipulation` but not the other values).
 * Event delegation patterns where the code that adds the listener won't know if the consumer will cancel the event.
   * One option here is to do delegation separately for passive and non-passive listeners (as if they were different event types entirely).
   * It's also possible to leverage `touch-action` as above (treating Touch Events as you would [Pointer Events](https://w3c.github.io/pointerevents/).

## Measuring the perceived benefit

A big part of the reason that this issue hasn't already been addressed is that browsers lack good tooling for understanding the performance impact of this problem.  The Chrome team is working on a proposal for both a [PerformanceTimeline API](https://code.google.com/p/chromium/issues/detail?id=543598) and a [DevTools feature](https://code.google.com/p/chromium/issues/detail?id=520659) to help web developers get better visibility into this problem today.  Until then it's also posible to [monitor event timestamps](http://rbyers.net/scroll-latency.html) to measure scroll jank in the wild, and use [chromium's tracing system](https://www.chromium.org/developers/how-tos/trace-event-profiling-tool) to look at the InputLatency records for scrolling when debugging.

## Reducing and breaking up long-running JS is still critical

When a page exhibits substantial scroll jank, it's always an indication of an underlying peformance issue somewhere.  Passive event listeners do nothing to address that underlying issue, we still strongly encourage developers to ensure their application meets the [RAIL guidelines](https://developers.google.com/web/tools/chrome-devtools/profile/evaluate-performance/rail?hl=en) on even low-end phones.  If your site has logic that runs for >100ms at a time, it will still feel sluggish in response to taps / clicks.  Passive event listeners just allow developers to decouple the issue of having JS responsiveness reflected in scroll performance from the desire to monitor input events.  In particular, developers of third-party analytics libraries can now have some confidence that their use of light-weight event listeners will not fundamentally change the observed performance characteristics of any page using their code.

## Further reading and discussion

See the links [here](https://github.com/WICG/EventListenerOptions) for more details.  For questions or concerns, feel free to [file issues on this repo](https://github.com/WICG/EventListenerOptions/issues).
