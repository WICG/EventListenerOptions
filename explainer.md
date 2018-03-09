# Passive event listeners

Passive event listeners are a new feature [in the DOM spec](https://dom.spec.whatwg.org/#dom-addeventlisteneroptions-passive) that enable developers to opt-in to better scroll performance by eliminating the need for scrolling to block on touch and wheel event listeners.  Developers can annotate touch and wheel listeners with `{passive: true}` to indicate that they will never invoke `preventDefault`.  This feature [shipped in Chrome 51](https://www.chromestatus.com/features/5745543795965952), [Firefox 49](https://bugzilla.mozilla.org/show_bug.cgi?id=1266066) and [landed in WebKit](https://bugs.webkit.org/show_bug.cgi?id=158601). Check out the video below for a side-by-side of passive event listeners in action:

[demo video](https://www.youtube.com/watch?v=NPM6172J22g)

## The problem

Smooth scrolling performance is essential to a good experience on the web, especially on touch-based devices.
All modern browsers have a threaded scrolling feature to permit scrolling to run smoothly even when expensive
JavaScript is running, but this optimization is partially defeated by the need to wait for the results of
any `touchstart` and `touchmove` handlers, which may prevent the scroll entirely by calling [`preventDefault()`](http://www.w3.org/TR/touch-events/#the-touchstart-event) on the event. While there are particular scenarios where an author may indeed want to prevent scrolling, analysis indicates that the majority of touch event handlers on the web never actually
call `preventDefault()`, so browsers often block scrolling unnecessarily. For instance, in Chrome for Android 80% of the touch events that block scrolling never actually prevent it. 10% of these events add more than 100ms of delay to the start of scrolling, and a catastrophic delay of at least 500ms occurs in 1% of scrolls.

Many developers are surprised to learn that [simply adding an empty touch handler to their document](http://rbyers.github.io/janky-touch-scroll.html) can have a
significant negative impact on scroll performance.  Developers quite reasonably expect that the act of observing an event [should not have any side-effects](https://dom.spec.whatwg.org/#observing-event-listeners).

The fundamental problem here is not limited to touch events. [`wheel` events](https://w3c.github.io/uievents/#events-wheelevents)
suffer from an identical issue. In contrast, [pointer event handlers](https://w3c.github.io/pointerevents/) are
designed to never delay scrolling (though developers can declaratively suppress scrolling altogether with the `touch-action` CSS property), so do not suffer from this issue. Essentially the passive event listener proposal brings the performance properties of pointer events to touch and wheel events.

This proposal provides a way for authors to indicate at handler registration time whether the handler may call `preventDefault()` on the event (i.e. whether it needs an event that is [cancelable](https://dom.spec.whatwg.org/#dom-event-cancelable)). When no touch or wheel handlers at a particular point require a cancelable event, a user agent is free to start scrolling immediately without waiting for JavaScript.  That is, passive listeners are free from surprising performance side-effects.

## EventListenerOptions

First, we need a mechanism for attaching additional information to an event listener.  Today the `capture` argument to `addEventListener` is the closest example of something like this, but its usage is pretty opaque:

```javascript
  document.addEventListener('touchstart', handler, true);
```

[`EventListenerOptions`](https://dom.spec.whatwg.org/#dictdef-eventlisteneroptions) lets us write this more explicitly as:

```javascript
  document.addEventListener('touchstart', handler, {capture: true});
```

This is simply the new (extensible) syntax for existing behavior - specifying [whether you want the listener invoked during the capture phase or bubbling phase](http://javascript.info/tutorial/bubbling-and-capturing#capturing).

## Solution: the 'passive' option

Now that we have an extensible syntax for specifying options at event handler registration time, we can add a new `passive` option which declares up-front that the listener will never call `preventDefault()` on the event.  If it does, the user agent will just ignore the request (ideally generating at least a console warning), as it already does for events with `Event.cancelable=false`.  A developer can verify this by querying `Event.defaultPrevented` before and after calling `preventDefault()`.  Eg:

```javascript
  addEventListener(document, "touchstart", function(e) {
    console.log(e.defaultPrevented);  // will be false
    e.preventDefault();   // does nothing since the listener is passive
    console.log(e.defaultPrevented);  // still false
  }, Modernizr.passiveeventlisteners ? {passive: true} : false);
```

Now rather than having to block scrolling whenever there are any touch or wheel listener, the browser only needs to do this when there are *non-passive* listeners (see [TouchEvents spec](http://w3c.github.io/touch-events/#cancelability)).  `passive` listeners are free of performance side-effects.

**By marking a touch or wheel listener as `passive`, the developer is promising the handler won't call `preventDefault` to disable scrolling.**  This frees the browser up to respond to scrolling immediately without waiting for JavaScript, thus ensuring a reliably smooth scrolling experience for the user.

## Feature Detection

Because older browsers will interpret any object in the 3rd argument as a `true` value for the `capture` argument, it's important for developers to use feature detection or [a polyfill](https://github.com/WebReflection/dom4) when using this API, to avoid unforeseen results.  Feature detection for specific options can be done as follows:

```javascript
// Test via a getter in the options object to see if the passive property is accessed
var supportsPassive = false;
try {
  var opts = Object.defineProperty({}, 'passive', {
    get: function() {
      supportsPassive = true;
    }
  });
  window.addEventListener("testPassive", null, opts);
  window.removeEventListener("testPassive", null, opts);
} catch (e) {}

// Use our detect's results. passive applied if supported, capture will be false either way.
elem.addEventListener('touchstart', fn, supportsPassive ? { passive: true } : false); 
```

To make this simpler you can use the feature detect from [Detect It](https://github.com/rafrex/detect-it), eg:
```javascript
  elem.addEventListener('touchstart', fn,
    detectIt.passiveEvents ? {passive:true} : false);
```

[Modernizr](https://modernizr.com/) also has a detect [here](https://github.com/Modernizr/Modernizr/pull/1982).  There is an [open standards debate](https://github.com/heycam/webidl/issues/107) around providing a simpler API for dictionary member feature detection.


## Removing the need to cancel events

There are scenarios where an author may intentionally want to consistently disable scrolling by cancelling all touch or wheel events. These include:

 * Panning and zooming a map
 * Full-page/full-screen games
 
In these cases, the current behavior (which prevents scrolling optimization) is perfectly adequate, since scrolling itself is being prevented consistently.  There is no need to use passive listeners in these cases, though it's often still a good idea to apply a `touch-action: none` CSS rule to make your intention explicit (eg. supporting browsers with Pointer Events but not Touch Events).

 However, in a number of common scenarios events don't need to block scrolling - for instance:
 
 * User activity monitoring which just wants to know when the user was last active
 * `touchstart` handlers that hide some active UI (like tooltips)
 * `touchstart` and `touchend` handlers that style UI elements (without suppressing the `click` event).
 
For these scenarios, the `passive` option can be added (with appropriate feature detection) without any other code changes, resulting in a significantly smoother scrolling experience.

There are a few more complicated scenarios where the handler only wants to suppress scrolling under certain conditions, such as:

 * Swiping horizontally to rotate a carousel, dismiss an item or reveal a drawer, while still permitting vertical scrolling.
   * In this case, use [touch-action: pan-y](https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action) to declaratively disable scrolling that starts along the horizontal axis without having to call `preventDefault()` ([test page](https://rbyers.github.io/touch-action.html)).
   * To continue to work correctly in all browsers, calls to `preventDefault` should be conditional on the lack of support for the particular `touch-action` rule being used (note that Safari 9 currently only supports `touch-action: manipulation`).
 * A UI element (like YouTube's volume slider) which slides on horizontal wheel events without changing the scrolling behavior on vertical wheel events. Since there is no equivalent of "touch-action" for wheel events, this case can only be implemented with non-passive wheel listeners.
 * Event delegation patterns where the code that adds the listener won't know if the consumer will cancel the event.
   * One option here is to do delegation separately for passive and non-passive listeners (as if they were different event types entirely).
   * It's also possible to leverage `touch-action` as above (treating Touch Events as you would [Pointer Events](https://w3c.github.io/pointerevents/).

## Debugging and measuring the benefit

You can get a quick idea of the benefit possible (and potential breakage) by forcing touch/wheel listeners to be treated as passive via  chrome://flags/#passive-listener-default (new in Chrome 52).  This makes it easy to do your own side-by-side comparisons like [this popular video](https://twitter.com/RickByers/status/719736672523407360).

See [this video](https://www.youtube.com/watch?v=6-D_3yx_KVI) for tips on how to use Chrome's Developer Tools to identify listeners that are blocking scrolling.  You can [monitor event timestamps](http://rbyers.net/scroll-latency.html) to measure scroll jank in the wild, and use [Chromium's tracing system](https://www.chromium.org/developers/how-tos/trace-event-profiling-tool) to look at the InputLatency records for scrolling when debugging.

The Chrome team is working on a proposal for both a [PerformanceTimeline API](https://code.google.com/p/chromium/issues/detail?id=543598) and more [DevTools features](https://code.google.com/p/chromium/issues/detail?id=520659) to help web developers get better visibility into this problem today.  

## Reducing and breaking up long-running JS is still critical

When a page exhibits substantial scroll jank, it's always an indication of an underlying peformance issue somewhere.  Passive event listeners do nothing to address these underlying issues, so we still strongly encourage developers to ensure that their application meets the [RAIL guidelines](https://developers.google.com/web/tools/chrome-devtools/profile/evaluate-performance/rail?hl=en) even on low-end devices.  If your site has logic that runs for >100ms at a time, it will still feel sluggish in response to taps / clicks.  Passive event listeners just allow developers to decouple the issue of having JS responsiveness reflected in scroll performance from the desire to monitor input events.  In particular, developers of third-party analytics libraries can now have some confidence that their use of light-weight event listeners will not fundamentally change the observed performance characteristics of any page using their code.

## Further reading and discussion

See the links [here](https://github.com/WICG/EventListenerOptions) for more details.  For questions or concerns, feel free to [file issues on this repo](https://github.com/WICG/EventListenerOptions/issues), or reach out to [@RickByers](https://twitter.com/RickByers/).
