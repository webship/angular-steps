import { Component, RESPONSE_INIT, inject } from '@angular/core';

@Component({
  selector: 'app-not-found',
  template: `
    <section>
      <h1>404</h1>
      <p>Page not found</p>
    </section>
  `,
})
export class NotFound {
  constructor() {
    const response = inject(RESPONSE_INIT, { optional: true });
    if (response) response.status = 404;
  }
}
