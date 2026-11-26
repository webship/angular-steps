'use strict';

// The page and its waits: the app taking the server's page over (hydration), a page drawn in the browser alone, the
// page being idle. The waits of every other step of the pack build on these.

const { Given, When, Then, AfterStep } = require('@cucumber/cucumber');
const h = require('./angular-helpers');

/**
 * Wait for the app to take the page over (hydration). An Angular page drawn on the server arrives as HTML, and the
 * app's scripts then make it the app's in the browser: until then a link loads a whole page and a form posts to the
 * server. The signs are the ones a production page shows: the early event contract cleared (Angular does it once
 * the app is stable), or no hydration data left on the page; for a page drawn in the browser, the root
 * bootstrapped. A page without Angular, or a browser without JavaScript, has nothing to wait for: the step goes on,
 * and the run's log says so.
 *
 * Example #1: Given the page is hydrated
 * Example #2: When the page is hydrated
 * Example #3: And the page is hydrated
 * Example #4: Then the page is hydrated
 * Example #5: But the page is hydrated
 */
Given(/^the page is hydrated$/, async function () {
  const w = await h.beforeActing(this);
  if (w.app && w.js && !w.hydrated) {
    const s = w.state || {};
    throw await h.laneFailure(this, 'Expected the app to take the page over, but it did not.', {
      found: `${(s.busy || []).join('; ') || 'the app did not start'}, after ${Math.round(h.budget(this) / 1000)} s`,
      hint: 'the app may have failed to start: look at the browser errors of the run (a script that did not load, an error while the app bootstraps).',
    });
  }
  await h.idle(this);
});

/**
 * The app has taken the page over: the page has Angular, and the app has hydrated it (or bootstrapped it, for a page
 * drawn in the browser). Unlike "the page is hydrated", it fails on a page without Angular and in a browser without
 * JavaScript.
 *
 * Example #1: Then the page should be hydrated
 * Example #2: And the page should be hydrated
 * Example #3: Then the page should be hydrated
 * Example #4: But the page should be hydrated
 * Example #5: Then the page should be hydrated
 */
Then(/^the page should be hydrated$/, async function () {
  const w = await h.hydrated(this);
  if (w.hydrated) return;
  const s = w.state || {};
  throw await h.laneFailure(this, !w.js
    ? 'Expected the page to be hydrated, but the browser has JavaScript off.'
    : (!w.app ? 'Expected the page to be hydrated, but the page has no Angular app.' : 'Expected the page to be hydrated, but the app has not taken it over.'), {
    found: `${s.url || 'the page'}: ${s.app ? (s.busy || []).join('; ') || 'not taken over' : 'none of the markers of an Angular app'}`,
    hint: w.app ? 'look at the browser errors of the run: a script that did not load, or an error while the app bootstraps.' : 'the page has none of the markers of an Angular app (an element with ng-version, the ng-state script, hydration data, the early event contract).',
  });
});

/**
 * The page was rendered in the browser alone: the server's HTML held only the app's empty element (a route of
 * `RenderMode.Client`, which marks the body `ngcm`, or an app without server rendering), and the app drew the page
 * in it. Without JavaScript such a page stays empty.
 *
 * Example #1: Then the page should have been rendered in the browser alone
 * Example #2: And the page should have been rendered in the browser alone
 * Example #3: Then the page should have been rendered in the browser alone
 * Example #4: But the page should have been rendered in the browser alone
 * Example #5: Then the page should have been rendered in the browser alone
 */
Then(/^the page should have been rendered in the browser alone$/, async function () {
  const result = await h.poll(this, async (s) => {
    if (!s || s.readyState === 'loading') return { done: false };
    const shell = await h.call(this, 'shellOnly');
    return { done: shell === true, shell, state: s };
  }, h.budget(this));
  if (result.done) return;
  const s = result.state || {};
  throw await h.laneFailure(this, 'Expected the page to have been rendered in the browser alone, but the server\'s HTML held it.', {
    found: `${s.url || 'the page'}: ${result.shell === false ? 'the server sent the page rendered' : 'no element for the app was found'}`,
    hint: 'a route is rendered in the browser alone when its server route says so (renderMode: RenderMode.Client), or when the app has no server rendering.',
  });
});

/**
 * Wait for the app to be idle: no page load in progress, the page taken over when it can be, no request in flight,
 * no frame asked for, no animation running, and nothing changed for a moment.
 *
 * Example #1: When I wait for the app to be idle
 * Example #2: And I wait for the app to be idle
 * Example #3: When we wait for the app to be idle
 * Example #4: Then I wait for the app to be idle
 * Example #5: Given I wait for the app to be idle
 */
When(/^(?:I |we )?wait for the app to be idle$/, async function () {
  const result = await h.idle(this, h.budget(this));
  if (result.done) return;
  const s = result.state || {};
  throw await h.laneFailure(this, `Expected the app to be idle, but it was still busy after ${Math.round(h.budget(this) / 1000)} s.`, {
    found: (s.busy || []).join('; ') || 'the page was between two documents',
    hint: 'an animation without an end, or a request that never answers, keeps a page busy: wait for what a person waits for instead (a text, a field).',
  });
});

// Opt in with the tag @idle-after-steps: after every step of the scenario (webship-js's own `I press "…"`,
// `I click "…"` too), wait for the app to be idle, on a page with Angular. It never fails a step: what comes next
// waits for what it expects anyway.
AfterStep({ tags: '@idle-after-steps' }, async function () {
  if (!this.page) return;
  const s = await h.pageState(this);
  if (s && s.app) await h.idle(this);
});
