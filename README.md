# Passive Event Listeners (EventListenerOptions)
An [extention](https://dom.spec.whatwg.org/#dictdef-eventlisteneroptions) to the DOM event pattern to allow listeners to disable support for `preventDefault`, primarily to enable scroll performance optimizations.  See the [**explainer document**](https://github.com/RByers/EventListenerOptions/blob/gh-pages/explainer.md) for an overview.

#### Additional background on the problem:
 * [Ilya Grigorik's talk at Chrome Dev Summit](https://www.youtube.com/watch?v=NrEjkflqPxQ&feature=youtu.be&t=557) [[slides](https://docs.google.com/presentation/d/1WdMyLpuI93TR_w0fvKqFlUGPcLk3A4UJ2sBuUkeFcwU/present?slide=id.g7299ef155_0_7)]
 * Older [G+ post by Rick Byers](https://plus.google.com/+RickByers/posts/cmzrtyBYPQc)
 * [Demo page](http://rbyers.github.io/janky-touch-scroll.html)

#### Status of implementations:
 * [Polyfill](https://rbyers.github.com/EventListenerOptions/EventListenerOptions.polyfill.js)
 * [Chromium feature status](https://www.chromestatus.com/features/5718574840676352) and [launch bug](https://code.google.com/p/chromium/issues/detail?id=489802)
 * [WebKit bug](https://bugs.webkit.org/show_bug.cgi?id=149466)

#### Issues with and adoption by key libraries:
  * [Parse.ly](https://github.com/Parsely/time-engaged/issues/3)
  * [jQuery](https://github.com/jquery/jquery/issues/2871)
  * [Ember.js](https://github.com/emberjs/ember.js/issues/12783)

#### History:
 * [Commit in the DOM specification](https://github.com/whatwg/dom/commit/253a21b8e78e37447c47983916a7cf39c4f6a3c5) and [pull request](https://github.com/whatwg/dom/pull/82)
 * [Outstanding issues](https://github.com/RByers/EventListenerOptions/issues?q=is%3Aissue)
 * [Discussion on WhatWG](https://lists.w3.org/Archives/Public/public-whatwg-archive/2015Jul/0018.html)
 * One [discussion on public-pointer-events](https://lists.w3.org/Archives/Public/public-pointer-events/2015AprJun/0042.html)
 * Earlier [scroll-blocks-on proposal](https://docs.google.com/document/d/1aOQRw76C0enLBd0mCG_-IM6bso7DxXwvqTiRWgNdTn8/edit#heading=h.wi06xpj70hhd) and discussion
