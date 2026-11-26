import { Component, afterNextRender, signal } from '@angular/core';

// Drawn in the browser only: its server route renders nothing of it (RenderMode.Client).
@Component({
  selector: 'app-client-only',
  template: `
    <section>
      <h1>Client only</h1>
      <p>This page is <span id="where">{{ where() }}</span>.</p>
    </section>
  `,
})
export class ClientOnly {
  readonly where = signal('');

  constructor() {
    afterNextRender(() => this.where.set('rendered in the browser'));
  }
}
