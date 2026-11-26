import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { About } from './pages/about';
import { ClientOnly } from './pages/client-only';
import { Contact } from './pages/contact';
import { Home } from './pages/home';
import { NotFound } from './pages/not-found';
import { PostPage, postResolver } from './pages/post';
import { Posts } from './pages/posts';

export const routes: Routes = [
  { path: '', component: Home, title: 'Home' },
  { path: 'about', component: About, title: 'About' },
  { path: 'posts', component: Posts, title: 'Posts' },
  // The latest post has no address of its own: a guard sends /posts/latest on to it (a redirect inside the app, and
  // a redirect of the server without JavaScript).
  { path: 'posts/latest', component: PostPage, canActivate: [() => inject(Router).parseUrl('/posts/3')] },
  { path: 'posts/:id', component: PostPage, resolve: { post: postResolver } },
  { path: 'contact', component: Contact, title: 'Contact' },
  { path: 'client-only', component: ClientOnly, title: 'Client only' },
  { path: '**', component: NotFound, title: 'Page not found' },
];
