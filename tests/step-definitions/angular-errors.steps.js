'use strict';

// Error pages. Angular has no error page of its own: an address the app does not know, or a view whose data is
// missing, shows a view of the app's own (a `**` route, a view for a resource that does not exist). Loaded, the
// page answers with its status (`RESPONSE_INIT`, or the server route's `status`); reached inside the app, there is no
// status, and the view says the code itself. The step reads both, the way a person and a crawler do.

const { Then } = require('@cucumber/cucumber');
const h = require('./angular-helpers');

const withoutHash = (url) => String(url || '').split('#')[0];

/**
 * The app shows its page for a status: the page loaded with that status when it came by a page load; reached
 * inside the app (no status), the view's first heading or the page's title says the code; and the page says the
 * message, when one is given. The step waits for it.
 *
 * Example #1: Then the app should show its 404 page
 * Example #2: Then the app should show its 404 page saying "Post not found"
 * Example #3: And the app should show its 500 page saying "Something went wrong"
 * Example #4: Then the app should show its 403 page
 * Example #5: Then the app should show its 404 page saying "Page not found"
 */
Then(/^the app should show its (\d{3}) page(?: saying "([^"]*)")?$/, async function (code, message) {
  const result = await h.poll(this, async (s) => {
    if (!s || s.readyState === 'loading' || !s.idle) return { done: false };
    const heading = await h.call(this, 'firstHeading');
    const text = message ? await h.call(this, 'pageText') : '';
    const doc = this.ngDocument;
    const nav = this.ngNavigation;
    // The status of the page load is known when the page on the screen is the one it brought.
    const known = !!doc && withoutHash(doc.url) === withoutHash(s.url) && !(nav && nav.kind === 'app' && nav.at > doc.at);
    const statusOk = known ? String(doc.status) === code : ((!!heading && heading.includes(code)) || String(s.title || '').includes(code));
    const messageOk = !message || h.norm(text).toLowerCase().includes(h.norm(message).toLowerCase());
    return { done: statusOk && messageOk, heading, known, status: known ? doc.status : null, messageOk, state: s };
  }, h.budget(this));
  if (result.done) return;
  const s = result.state || {};
  const what = [];
  if (result.known && String(result.status) !== code) what.push(`the page loaded with the status ${result.status}`);
  if (!result.known) what.push(result.heading ? `its first heading says "${h.excerpt(result.heading, 60)}" and its title "${h.excerpt(s.title, 60)}"` : `it has no first heading, and its title says "${h.excerpt(s.title, 60)}"`);
  if (message && !result.messageOk) what.push(`it does not say "${message}"`);
  throw await h.laneFailure(this, `Expected the app to show its ${code} page${message ? ` saying "${message}"` : ''}, but ${what.join(', and ') || 'it does not'}.`, {
    found: `${s.url || 'the page'}${result.known ? '' : ' (reached inside the app: the status of no page load says it)'}`,
    hint: 'loaded, the page answers with its status (RESPONSE_INIT, or the server route\'s status); inside the app, the view says the code in its first heading or its title.',
  });
});
