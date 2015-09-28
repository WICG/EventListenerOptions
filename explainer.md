# Passive event listeners


## The problem

Smooth scrolling performance is essential to a good experience on the web, especially on touch-based devices.
Yet a substantial fraction of touch scrolls take longer than 100ms to begin on many websites on mobile browsers
(and a catastrophic 500ms delay is not unusual during page load).

Modern browsers all have a threaded scrolling feature to permit scrolling to run smoothly even when expensive
JavaScript is running, but this optimization can is partially defeated by the need to wait for the results of
any `touchstart` and `touchmove` handlers, which may prevent the scroll entirely by calling `[preventDefault](http://www.w3.org/TR/touch-events/#the-touchstart-event)`
on the event. However, analysis indicates that the majority of touch event handlers on the web will never actually
call preventDefault

Many developers are surprised to learn that simply adding an empty touch handler to their document can have a
significant negative impact on scroll performance.  Developers reasonably expect that the act of observing an event
should not have any side-effects.

The fundamental problem here is not limited to touch events. [`wheel` events](https://w3c.github.io/uievents/#events-wheelevents)
suffer from an identical issue. However pointer event handlers ([PointerEvents]) never block scrolling, so this mechanism brings the performance properties of pointer events to touch and wheel events.
This proposal provides a way for authors to indicate at handler registration time whether the handler may call preventDefault on the event (i.e. whether it needs an event that is cancelable). When no touch handlers at a particular point require a cancelable event, a user agent is free to start scrolling immediately without waiting for JavaScript.



