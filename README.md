# Passive Event Listeners (EventListenerOptions)

This work is now part of the [official WHATWG DOM spec](https://github.com/whatwg/dom). Please file any issues/pull requests there. This repository (and its resources / discussions) are only preserved here as an archive.

---

An [extension](https://dom.spec.whatwg.org/#dictdef-eventlisteneroptions) to the DOM event pattern to allow listeners to disable support for `preventDefault`, primarily to enable scroll performance optimizations.  See the [**explainer document**](https://github.com/WICG/EventListenerOptions/blob/gh-pages/explainer.md) for an overview.

#### Spec changes
 * See the main [commit in the DOM specification](https://github.com/whatwg/dom/commit/253a21b8e78e37447c47983916a7cf39c4f6a3c5) or [pull request](https://github.com/whatwg/dom/pull/82) for full details.
 * The key parts of the spec affected by this are [EventTarget](https://dom.spec.whatwg.org/#eventtarget), [Observing event listeners](https://dom.spec.whatwg.org/#observing-event-listeners), and [preventDefault](https://dom.spec.whatwg.org/#dom-event-preventdefault)
 * Touch Events has [been updated](http://w3c.github.io/touch-events/#cancelability) to describe the performance optimization.
 * [Interventions issue 18](https://github.com/WICG/interventions/issues/18) tracks the plan to "[intervene](bit.ly/user-agent-intervention)" and force touch listeners to be passive in scenarios where the compat risk is low but the perf benefit large.
 
#### Status of implementations:
 * See [CanIUse entry for passive event listeners](http://caniuse.com/#feat=passive-event-listener)
 * Chromium: [shipping](https://www.chromestatus.com/features/5745543795965952) in Chrome 51 ([launch bug](https://bugs.chromium.org/p/chromium/issues/detail?id=489802))
   * [Chromium bug](https://bugs.chromium.org/p/chromium/issues/detail?id=599609) tracking the [next step](https://github.com/WICG/interventions/issues/18) of automatically opting some listeners into passive behavior.
 * WebKit: [EventListenerOptions support](https://bugs.webkit.org/show_bug.cgi?id=149466) and [performance optimization for touch listeners](https://bugs.webkit.org/show_bug.cgi?id=158601) landed.
   * [Performance optimization of wheel listeners](https://bugs.webkit.org/show_bug.cgi?id=158439) not yet implemented. 
 * Firefox: [Landed](https://bugzilla.mozilla.org/show_bug.cgi?id=1266066) - planned to [ship in Firefox 49](https://platform-status.mozilla.org/#passive-event-listeners)
 * [DOM4 Polyfill](https://github.com/WebReflection/dom4), or sample [polyfill here](EventListenerOptions.polyfill.js)

#### Additional background on the problem:
 * [Summary from Google I/O 2016 Mobile Web talk](https://youtu.be/0SSI8liELJU?t=6m20s)
 * [Ilya Grigorik's talk at Chrome Dev Summit](https://www.youtube.com/watch?v=NrEjkflqPxQ&feature=youtu.be&t=557) [[slides](https://docs.google.com/presentation/d/1WdMyLpuI93TR_w0fvKqFlUGPcLk3A4UJ2sBuUkeFcwU/present?slide=id.g7299ef155_0_7)]
 * [Discussion on twitter](https://twitter.com/RickByers/status/719736672523407360) with [demo video](https://www.youtube.com/watch?v=NPM6172J22g)
 * [Demo page with latency measurement](https://rbyers.github.io/scroll-latency.html)
 * Older [G+ post by Rick Byers](https://plus.google.com/+RickByers/posts/cmzrtyBYPQc)

#### Additional resources for understaning and using passive listeners
  * [Tips for debugging scroll jank screencast](https://www.youtube.com/watch?v=6-D_3yx_KVI)

#### Issues with and adoption by key libraries:
  * [Feature detect in Modernizr](https://github.com/Modernizr/Modernizr/blob/master/feature-detects/dom/passiveeventlisteners.js) ([issue](https://github.com/Modernizr/Modernizr/issues/1894)) 
  * [Parse.ly](https://github.com/Parsely/time-engaged/issues/3)
  * [jQuery](https://github.com/jquery/jquery/issues/2871)
  * [Ember.js](https://github.com/emberjs/ember.js/issues/12783)

#### History:
 * [Outstanding issues](https://github.com/WICG/EventListenerOptions/issues?q=is%3Aissue)
 * [WICG discussion](https://discourse.wicg.io/t/eventlisteneroptions-and-passive-event-listeners-move-to-wicg/1386/13)
 * [Discussion on WhatWG](https://lists.w3.org/Archives/Public/public-whatwg-archive/2015Jul/0018.html)
 * One [discussion on public-pointer-events](https://lists.w3.org/Archives/Public/public-pointer-events/2015AprJun/0042.html)
 * Earlier [scroll-blocks-on proposal](https://docs.google.com/document/d/1aOQRw76C0enLBd0mCG_-IM6bso7DxXwvqTiRWgNdTn8/edit#heading=h.wi06xpj70hhd) and discussion
