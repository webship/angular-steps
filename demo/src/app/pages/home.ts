import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-home',
  template: `
    <section>
      <h1>Welcome to the demo</h1>
      <p>A count that changes in place: <span id="count">{{ count() }}</span></p>
      <button type="button" aria-label="Add one to the count" (click)="add()">+</button>
    </section>
  `,
})
export class Home {
  readonly count = signal(0);

  add() {
    this.count.update((n) => n + 1);
  }
}
