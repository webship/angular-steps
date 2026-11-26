'use strict';

// The page side of the pack: put into every page before the page's own scripts (angular-helpers.js does it), it
// installs `window.__webshipAngular`.
//
// It keeps to what a production page shows, since Angular's debugging globals (`ng`, testability) are not there in a
// production build and a new app has no Zone to ask: an id for each document (so a step tells a navigation of the
// router from a whole page load without counting on requests), the frames the page asks for, the requests it has in
// flight (fetch and XMLHttpRequest: the data of a view, a resolver's, a form sent in place), the input events, the
// changes of the DOM, whether the server's HTML held the page or only the app's empty element, and the router's
// navigations as they commit the address: Angular's router writes `navigationId` into the history state each time,
// with pushState, or with replaceState after the browser's back.
//
// Not a step file: it registers no step definitions. `appProbe` is a plain function, serialised into the page.

function appProbe() {
  if (window.__webshipAngular) return;
  const now = () => performance.now();
  const nativeRaf = window.requestAnimationFrame.bind(window);
  const nativeCancel = window.cancelAnimationFrame.bind(window);
  const nativeFetch = window.fetch ? window.fetch.bind(window) : null;
  const state = {
    doc: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
    frames: 0,
    pending: new Set(),
    lastFrame: 0,
    lastInput: 0,
    lastMutation: 0,
    inFlight: 0,
    seq: 0,
    requests: [],
    commits: 0,
    lastCommit: 0,
    shellOnly: null,
  };

  // Frames: every callback the page asks for, until it runs or is cancelled. The probe's own waits use the original
  // function, so they are not counted.
  window.requestAnimationFrame = function requestAnimationFrame(callback) {
    let id = 0;
    id = nativeRaf((time) => {
      state.pending.delete(id);
      state.frames += 1;
      state.lastFrame = now();
      return callback(time);
    });
    state.pending.add(id);
    return id;
  };
  window.cancelAnimationFrame = function cancelAnimationFrame(id) {
    state.pending.delete(id);
    return nativeCancel(id);
  };

  // Requests the page starts, by fetch (Angular's HttpClient with withFetch, the default of a new app) or
  // XMLHttpRequest (HttpClient without it, or a library of the app).
  const track = (url, method) => {
    const entry = { seq: (state.seq += 1), url, method, status: 0, start: now(), end: 0, body: '' };
    state.requests.push(entry);
    if (state.requests.length > 200) state.requests.shift();
    state.inFlight += 1;
    return (status, body) => {
      if (entry.end) return;
      entry.status = status;
      entry.end = now();
      if (typeof body === 'string') entry.body = body.slice(0, 2000);
      state.inFlight -= 1;
    };
  };
  if (nativeFetch) {
    window.fetch = function fetch(input, init) {
      let url = '';
      let method = 'GET';
      try {
        url = new URL(typeof input === 'string' || input instanceof URL ? String(input) : input.url, location.href).href;
        method = String((init && init.method) || (input && input.method) || 'GET').toUpperCase();
      } catch (e) { /* an address the page itself will refuse */ }
      const done = track(url, method);
      return nativeFetch(input, init).then((response) => {
        // The answer's text for the form steps, read from a copy, never from the page's own body.
        if (method !== 'GET') response.clone().text().then((text) => done(response.status, text), () => done(response.status));
        else done(response.status);
        return response;
      }, (error) => { done(-1); throw error; });
    };
  }
  if (window.XMLHttpRequest) {
    const open = XMLHttpRequest.prototype.open;
    const send = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (method, url) {
      this.__webshipAngular = { method: String(method || 'GET').toUpperCase(), url: String(url) };
      return open.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function () {
      const meta = this.__webshipAngular || { method: 'GET', url: '' };
      let url = meta.url;
      try { url = new URL(meta.url, location.href).href; } catch (e) { /* kept as given */ }
      const done = track(url, meta.method);
      this.addEventListener('loadend', () => done(this.status, typeof this.responseText === 'string' ? this.responseText : ''));
      return send.apply(this, arguments);
    };
  }

  // The router's commits of the address: each navigation of Angular's router writes its navigationId into the
  // history state (pushState; replaceState after the browser's back, or for replaceUrl). A guard's redirect skips a
  // number: the cancelled navigation commits nothing.
  const navId = () => {
    try { return history.state && typeof history.state.navigationId === 'number' ? history.state.navigationId : null; } catch (e) { return null; }
  };
  for (const name of ['pushState', 'replaceState']) {
    const original = history[name];
    history[name] = function (data) {
      const result = original.apply(this, arguments);
      if (data && typeof data.navigationId === 'number') { state.commits += 1; state.lastCommit = now(); }
      return result;
    };
  }

  const markInput = () => { state.lastInput = now(); };
  for (const type of ['pointerdown', 'mousedown', 'keydown', 'click', 'submit', 'input']) {
    window.addEventListener(type, markInput, true);
  }

  new MutationObserver(() => { state.lastMutation = now(); })
    .observe(document, { childList: true, subtree: true, attributes: true, characterData: true });

  // The server's HTML, before the app's scripts run: did it hold the page, or only the app's empty element (a route
  // drawn in the browser only marks the body `ngcm`)?
  document.addEventListener('readystatechange', () => {
    if (document.readyState !== 'interactive' || state.shellOnly !== null) return;
    if (document.body && document.body.hasAttribute('ngcm')) { state.shellOnly = true; return; }
    const root = rootElement();
    state.shellOnly = root ? root.children.length === 0 : null;
  });

  // Angular on the page: the root element it bootstrapped or rendered on the server (ng-version), the data of
  // hydration (ngh, the ng-state script), the early event contract (_ejsas), the client-mode flag (ngcm).
  const rootElement = () => document.querySelector('[ng-version]') || document.querySelector('[ng-server-context]');
  const angularMarked = () => !!(rootElement() || window._ejsas || document.getElementById('ng-state') ||
    document.querySelector('[ngh]') || (document.body && document.body.hasAttribute('ngcm')));
  const serverDrawn = () => !!(document.querySelector('[ng-server-context]') || document.getElementById('ng-state'));

  // Hydrated (taken over by the app): for a page drawn on the server, the early event contract cleared (event replay
  // does it once the app is stable) or, in an app without event replay, no hydration data left on the page and the
  // server's styles taken over; for a page drawn in the browser, the root bootstrapped (it gets ng-version).
  function hydration() {
    const ejs = window._ejsas;
    if (ejs && typeof ejs === 'object' && Object.keys(ejs).length) {
      const left = Object.keys(ejs).filter((k) => ejs[k] !== undefined);
      return left.length ? { done: false, why: 'the app has not taken the page over yet (its early event contract is still in place)' } : { done: true, by: 'event replay' };
    }
    if (serverDrawn() && !(document.body && document.body.hasAttribute('ngcm'))) {
      if (document.querySelector('[ngh]')) return { done: false, why: 'the app has not taken the page over yet (hydration data left on the page)' };
      if (document.querySelector('style[ng-app-id],link[ng-app-id]')) return { done: false, why: "the app has not taken the server's styles over yet" };
      return { done: document.readyState === 'complete', by: 'hydration data gone', why: 'the document is still loading' };
    }
    const root = document.querySelector('[ng-version]');
    return root ? { done: true, by: 'the root bootstrapped' } : { done: false, why: 'the app has not started yet' };
  }

  // Does this page run its own scripts? A browser without JavaScript (a lane of the suite) never lets the app take
  // the page over, and the steps do not wait for it there. Asked once per document.
  let scriptsRun = null;
  function jsOn() {
    if (scriptsRun !== null) return scriptsRun;
    try {
      const s = document.createElement('script');
      s.textContent = 'window.__webshipAngularScripts = 1;';
      (document.head || document.documentElement).appendChild(s);
      s.remove();
      scriptsRun = window.__webshipAngularScripts === 1;
    } catch (e) {
      scriptsRun = false;
    }
    return scriptsRun;
  }

  function runningAnimations() {
    if (!document.getAnimations) return [];
    return document.getAnimations().filter((a) => {
      if (a.playState !== 'running') return false;
      try {
        const end = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming().endTime : 0;
        return Number.isFinite(end);
      } catch (e) {
        return false;
      }
    }).map((a) => a.animationName || a.transitionProperty || 'an animation');
  }

  const clean = (text) => String(text || '').replace(/\s+/g, ' ').trim();

  const lib = {
    doc: () => state.doc,
    jsOn,
    seq: () => state.seq,
    navId,
    commits: () => state.commits,
    requestsSince: (seq) => state.requests.filter((r) => r.seq > seq).map((r) => ({ ...r })),
    route: () => `${location.pathname}${location.search}${location.hash}`,
    shellOnly: () => state.shellOnly,
    // The page's state for a wait. Idle: the document loaded, the page taken over when it can be, no request in
    // flight, no frame asked for, no finite animation or transition running, and 40 ms of quiet (no frame, no change
    // of the DOM), with a frame after the last input or 100 ms of nothing.
    state() {
      const t = now();
      const js = jsOn();
      const app = js && angularMarked();
      const h = app ? hydration() : { done: false };
      const animations = runningAnimations();
      const sinceFrame = state.lastFrame ? t - state.lastFrame : t;
      const sinceMutation = state.lastMutation ? t - state.lastMutation : t;
      const sinceInput = state.lastInput ? t - state.lastInput : t;
      const frameAfterInput = state.lastFrame > state.lastInput;
      const busy = [];
      if (document.readyState !== 'complete') busy.push(`the document is ${document.readyState}`);
      if (app && !h.done) busy.push(h.why || 'the app has not taken the page over yet');
      if (state.inFlight) busy.push(`${state.inFlight} request${state.inFlight > 1 ? 's' : ''} in flight`);
      if (state.pending.size) busy.push(`${state.pending.size} frame${state.pending.size > 1 ? 's' : ''} asked for`);
      if (animations.length) busy.push(`running: ${animations.slice(0, 3).join(', ')}`);
      if (sinceMutation < 40) busy.push('the page changed in the last 40 ms');
      if (sinceFrame < 40) busy.push('a frame ran in the last 40 ms');
      if (!frameAfterInput && sinceInput < 100) busy.push('no frame since the last input');
      return {
        now: t,
        doc: state.doc,
        url: location.href,
        route: lib.route(),
        title: document.title,
        readyState: document.readyState,
        js,
        app,
        hydrated: !!h.done,
        hydratedBy: h.by || null,
        navId: navId(),
        commits: state.commits,
        lastCommit: state.lastCommit,
        inFlight: state.inFlight,
        frames: state.frames,
        animations,
        busy,
        idle: busy.length === 0,
      };
    },
    firstHeading() {
      const h = document.querySelector('h1');
      return h ? clean(h.textContent) : null;
    },
    alerts() {
      return [...document.querySelectorAll('[role="alert"]')].map((e) => clean(e.textContent)).filter(Boolean);
    },
    pageText() {
      return clean(document.body && document.body.innerText);
    },
  };

  window.__webshipAngular = { lib };
}

module.exports = { appProbe };
