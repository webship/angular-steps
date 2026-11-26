'use strict';

// The app's views: a link of the router used and the browser's back, each to its end (a change of view by the router,
// or a whole page load, told apart by the document, never by a request: a view's data may be fetched by a resolver
// before the address changes, or by the view after it), the view's title, the link of the current view, the address,
// and the app's requests.

const { When, Then } = require('@cucumber/cucumber');
const h = require('./angular-helpers');

const withoutHash = (url) => String(url || '').split('#')[0];

async function linkByName(world, name) {
  const found = await h.byRoleAndName(world, 'link', name);
  if (!found.locator) {
    throw await h.laneFailure(world, `Expected a link named "${name}" on the page, but there is none.`, {
      found: `the links here: ${h.listed(found.names, 20)}`,
      hint: 'a link is named by its text, or its label; the name is matched from its start.',
    });
  }
  return found.locator;
}

/** Where a step's navigation stopped, for a failure message. */
function busyAt(s) {
  return `the address is ${s.url || '(unknown)'}; the router's navigationId is ${s.navId === null || s.navId === undefined ? 'none' : s.navId}; still busy: ${(s.busy || []).join('; ') || 'nothing'}`;
}

/**
 * Navigate with a link of the app, by its name, and wait for the navigation to end: a change of view by the router
 * (it commits the new address, and the page is idle), or a whole page load (the new page loaded, and taken over when
 * it can be). The step first waits for the app to take the page over, as a click before then loads a whole page. A
 * navigation the router commits nothing for (a guard said no) ends with the page idle at its address; the next Then
 * step says so.
 *
 * Example #1: When I navigate with the "Posts" link
 * Example #2: When I navigate with the "About" link
 * Example #3: And I navigate with the "Contact" link
 * Example #4: When we navigate with the "Home" link
 * Example #5: When I navigate with the "Invoices" link
 */
When(/^(?:I |we )?navigate with the "([^"]*)" link$/, async function (name) {
  await h.beforeActing(this);
  const link = await linkByName(this, name);
  const before = await h.pageState(this);
  const href = await link.evaluate((a) => a.href || '').catch(() => '');
  const sameAddress = !!href && withoutHash(href) === withoutHash(before && before.url);
  try {
    await link.click({ timeout: h.budget(this) });
  } catch (e) {
    throw h.friendly({ action: 'click', target: `the link "${name}"`, cause: e, hint: 'it may be covered by another part of the page, or not on the screen.' });
  }
  const nav = await h.followNavigation(this, before, sameAddress);
  if (!nav.done) {
    throw await h.laneFailure(this, `Navigating with the link "${name}" did not end in ${Math.round(h.budget(this) / 1000)} s.`, {
      found: `${busyAt(nav.state || {})}${href ? ` (the link goes to ${href})` : ''}`,
      hint: 'a request that never answers (a resolver\'s), or a view that failed to load, keeps a navigation from ending: look at the network and the browser errors of the run.',
    });
  }
});

/**
 * Go back one view with the browser, and wait for the navigation to end, a change of view by the router or a whole
 * page load, as navigating with a link does.
 *
 * Example #1: When I go back one view
 * Example #2: And I go back one view
 * Example #3: When we go back one view
 * Example #4: Then I go back one view
 * Example #5: Given I go back one view
 */
When(/^(?:I |we )?go back one view$/, async function () {
  await h.beforeActing(this);
  const before = await h.pageState(this);
  try {
    await this.page.goBack({ waitUntil: 'commit', timeout: h.budget(this) });
  } catch (e) {
    throw h.friendly({ action: 'go back', target: 'the previous view', cause: e, hint: 'the browser may have no page before this one in the scenario.' });
  }
  const nav = await h.followNavigation(this, before, false);
  if (!nav.done || nav.kind === 'none') {
    throw await h.laneFailure(this, 'Going back one view did not end a navigation.', {
      found: busyAt(nav.state || {}),
      hint: 'this may be the first page the scenario opened: there is no page before it.',
    });
  }
});

/**
 * How the last navigation of the pack's steps ended: the router changed the view (the same document: the page did
 * not load again, and what it held in the browser stays), or a whole page loaded.
 *
 * Example #1: Then the router should have changed the view
 * Example #2: Then a whole page should have loaded
 * Example #3: And the router should have changed the view
 * Example #4: But a whole page should have loaded
 * Example #5: Then the router should have changed the view
 */
Then(/^(the router should have changed the view|a whole page should have loaded)$/, async function (how) {
  const nav = this.ngNavigation;
  const wanted = how === 'the router should have changed the view' ? 'app' : 'whole';
  if (!nav) {
    throw await h.laneFailure(this, 'Expected a navigation of the scenario, but none of its steps made one.', {
      hint: 'navigate with "I navigate with the "..." link" or "I go back one view" first.',
    });
  }
  if (nav.kind === wanted) return;
  const said = { app: 'changed the view by the router', whole: 'loaded a whole page', none: 'went nowhere: the router committed no address' };
  throw await h.laneFailure(this, `Expected the last navigation to have ${wanted === 'app' ? 'changed the view by the router' : 'loaded a whole page'}, but it ${said[nav.kind] || nav.kind}.`, {
    found: `from ${nav.from} to ${nav.to}`,
    hint: wanted === 'app'
      ? (nav.kind === 'none' ? 'a guard of the route may have said no, or the link goes to a route the app does not have.' : 'a link to another site, a page the app has not taken over, or a browser without JavaScript loads a whole page.')
      : 'a page the app has taken over changes its view by the router.',
  });
});

/**
 * The title of the view the app shows (the page's title, which the router's title strategy sets at the end of a
 * navigation), matched exactly, then without regard to case, then from its start. Angular has no route announcer: a
 * screen reader hears of a new view only when the app says so, and the title is what the steps can check. The step
 * waits for it.
 *
 * Example #1: Then the view's title should be "Posts"
 * Example #2: Then the view's title should be "About"
 * Example #3: And the view's title should be "Moving between pages"
 * Example #4: Then the view's title should be "Home"
 * Example #5: Then the view's title should be "Invoices"
 */
Then(/^the view's title should be "([^"]*)"$/, async function (title) {
  const want = h.norm(title).toLowerCase();
  const result = await h.poll(this, (s) => {
    if (!s) return { done: false, state: s };
    const said = h.norm(s.title).toLowerCase();
    return { done: said === want || (want.length >= 3 && said.startsWith(want)), state: s };
  }, h.budget(this));
  if (result.done) return;
  const s = result.state || {};
  throw await h.laneFailure(this, `Expected the view's title to be "${title}", but it is "${h.excerpt(s.title, 80)}".`, {
    found: `the address is ${s.url || '(unknown)'}`,
    hint: 'the router sets the title of a view from its route (title: "…", or a title resolver); a view without one keeps the title it found.',
  });
});

/**
 * A link marks the view a person is on (`aria-current="page"`, on the link or on the list item that holds it): the
 * link of the current view in a navigation. Angular's `routerLinkActive` sets it with `ariaCurrentWhenActive="page"`.
 * The step waits for it.
 *
 * Example #1: Then the "Posts" link should be the active one
 * Example #2: Then the "Home" link should be the active one
 * Example #3: And the "About" link should be the active one
 * Example #4: Then the "Invoices" link should be the active one
 * Example #5: Then the "Settings" link should be the active one
 */
Then(/^the "([^"]*)" link should be the active one$/, async function (name) {
  const deadline = Date.now() + h.budget(this);
  for (;;) {
    const link = (await h.byRoleAndName(this, 'link', name)).locator;
    const marked = link && await link.evaluate((a) => {
      const holder = a.closest('[aria-current]');
      return !!holder && holder.getAttribute('aria-current') === 'page' && (holder === a || (holder.tagName === 'LI' && holder.contains(a)));
    }).catch(() => false);
    if (marked) return;
    if (Date.now() + 50 >= deadline) break;
    await h.sleep(50);
  }
  const current = await this.page.locator('[aria-current]').evaluateAll((els) => els.map((e) => `${(e.textContent || e.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim()} (${e.getAttribute('aria-current')})`)).catch(() => []);
  throw await h.laneFailure(this, `Expected the link "${name}" to be the active one, but it is not.`, {
    found: `the links marked current: ${h.listed(current)}`,
    hint: 'the link of the current view carries aria-current="page": give its routerLinkActive ariaCurrentWhenActive="page" (a class alone tells no one).',
  });
});

/**
 * The address of the view the app shows (the path and query), once the app is idle: "/posts", "/posts/2",
 * "/contact?sent=Ada". The step waits for it.
 *
 * Example #1: Then the app's address should be "/posts"
 * Example #2: Then the app's address should be "/posts/2"
 * Example #3: And the app's address should be "/"
 * Example #4: Then the app's address should be "/contact?sent=Ada"
 * Example #5: Then the app's address should be "/invoices"
 */
Then(/^the app's address should be "([^"]*)"$/, async function (address) {
  const want = String(address).trim();
  const result = await h.poll(this, (s) => ({ done: !!s && s.idle && decodeURIComponent(s.route) === decodeURIComponent(want), state: s }), h.budget(this));
  if (result.done) return;
  const s = result.state || {};
  throw await h.laneFailure(this, `Expected the app's address to be "${want}", but it is "${s.route || '(unknown)'}".`, {
    found: `the page's address is ${s.url || '(unknown)'}`,
    hint: 'the address is the path and query the app shows, without the site\'s own address; a guard that redirects ends at the address it sent the app to.',
  });
});

/**
 * Wait for the app's requests to finish: every request the page started answered (the data a view fetches, or loads
 * again), and the app idle. Nothing about a fixed time.
 *
 * Example #1: When I wait for the app's requests to finish
 * Example #2: And I wait for the app's requests to finish
 * Example #3: When we wait for the app's requests to finish
 * Example #4: Then I wait for the app's requests to finish
 * Example #5: Given I wait for the app's requests to finish
 */
When(/^(?:I |we )?wait for the app's requests to finish$/, async function () {
  const result = await h.poll(this, (s) => ({ done: !!s && !s.inFlight && s.idle, state: s }), h.budget(this));
  if (result.done) return;
  const s = result.state || {};
  throw await h.laneFailure(this, `Expected the app's requests to finish, but the page was still waiting after ${Math.round(h.budget(this) / 1000)} s.`, {
    found: (s.busy || []).join('; ') || 'the page was between two documents',
    hint: 'a request that never answers keeps the app waiting: look at the network of the run, or the server\'s log.',
  });
});
