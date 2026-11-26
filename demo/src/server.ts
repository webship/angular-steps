// The demo's server: Angular's own server rendering (@angular/ssr, as the official starter sets it up), and three
// routes of the demo's API in front of it, which the pages read and the contact form posts to. This pack's own code
// (MIT), over the starter's.
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

const POSTS = [
  { id: 1, title: 'First steps', body: 'A page drawn on the server, then taken over in the browser.' },
  { id: 2, title: 'Moving between pages', body: 'A link inside the app changes the view without a whole page load.' },
  { id: 3, title: 'Forms', body: 'A form sent inside the page with JavaScript, and posted without it.' },
];

app.get('/api/posts', (req, res) => {
  res.json(POSTS.map(({ id, title }) => ({ id, title })));
});

app.get('/api/posts/:id', (req, res) => {
  const post = POSTS.find((p) => String(p.id) === req.params.id);
  if (post) res.json(post);
  else res.status(404).json({ error: 'Post not found' });
});

// The contact form: JSON from the app (an answer the page shows in place), or a posted form without JavaScript (a
// redirect back to the form, with the answer in the address).
app.post('/api/contact', express.urlencoded({ extended: false }), express.json(), (req, res) => {
  const name = String(req.body?.name ?? '').trim();
  const message = String(req.body?.message ?? '').trim();
  const error = !name ? 'Your name is required.' : message.length < 10 ? 'Your message needs at least 10 characters.' : '';
  if (req.is('application/json')) {
    if (error) res.status(422).json({ error });
    else res.json({ ok: true, name });
    return;
  }
  const query = error ? `error=${encodeURIComponent(error)}` : `sent=${encodeURIComponent(name)}`;
  res.redirect(303, `/contact?${query}`);
});

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
