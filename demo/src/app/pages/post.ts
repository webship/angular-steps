import { Component, RESPONSE_INIT, effect, inject, input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { ResolveFn, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';

export interface Post {
  id: number;
  title: string;
  body: string;
}

// The post of the address, or null for a post that does not exist: on the server its page then answers 404.
export const postResolver: ResolveFn<Post | null> = (route) => {
  const response = inject(RESPONSE_INIT, { optional: true });
  return inject(HttpClient)
    .get<Post>(`/api/posts/${route.paramMap.get('id')}`)
    .pipe(
      catchError(() => {
        if (response) response.status = 404;
        return of(null);
      }),
    );
};

@Component({
  selector: 'app-post',
  imports: [RouterLink],
  template: `
    @if (post(); as p) {
      <article>
        <h1>{{ p.title }}</h1>
        <p>{{ p.body }}</p>
        <p><a routerLink="/posts">All posts</a></p>
      </article>
    } @else {
      <section>
        <h1>404</h1>
        <p>Post not found</p>
      </section>
    }
  `,
})
export class PostPage {
  readonly post = input<Post | null>(null);

  constructor() {
    const title = inject(Title);
    effect(() => title.setTitle(this.post()?.title ?? 'Post not found'));
  }
}
