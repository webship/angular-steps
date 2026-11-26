import { Component } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { RouterLink } from '@angular/router';

interface PostSummary {
  id: number;
  title: string;
}

@Component({
  selector: 'app-posts',
  imports: [RouterLink],
  template: `
    <section>
      <h1>Posts</h1>
      <ul>
        @for (post of posts.value() ?? []; track post.id) {
          <li><a [routerLink]="['/posts', post.id]">{{ post.title }}</a></li>
        }
      </ul>
      <p><a routerLink="/posts/latest">The latest post</a></p>
      <button type="button" (click)="posts.reload()">Load the posts again</button>
      <p>Status: <span id="status">{{ posts.status() }}</span></p>
    </section>
  `,
})
export class Posts {
  readonly posts = httpResource<PostSummary[]>(() => '/api/posts');
}
