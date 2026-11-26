import { Component, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

// The form posts to the server without JavaScript (the server sends the browser back here with the answer in the
// address), and is sent in place with it (the answer of the request is shown on the page).
@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule],
  template: `
    <section>
      <h1>Contact</h1>
      <form method="post" action="/api/contact" [formGroup]="form" (ngSubmit)="send()">
        <p><label for="name">Your name</label> <input id="name" name="name" formControlName="name" /></p>
        <p><label for="message">Your message</label> <textarea id="message" name="message" formControlName="message"></textarea></p>
        <p><button type="submit">Send</button></p>
      </form>
      @if (sent()) {
        <p role="status">Thanks, {{ sent() }}: your message was sent.</p>
      }
      @if (error()) {
        <p role="alert">{{ error() }}</p>
      }
    </section>
  `,
})
export class Contact {
  private readonly http = inject(HttpClient);
  private readonly query = inject(ActivatedRoute).snapshot.queryParamMap;

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true }),
    message: new FormControl('', { nonNullable: true }),
  });
  readonly sent = signal(this.query.get('sent') ?? '');
  readonly error = signal(this.query.get('error') ?? '');

  send() {
    this.sent.set('');
    this.error.set('');
    this.http.post<{ ok: boolean; name: string }>('/api/contact', this.form.getRawValue()).subscribe({
      next: (answer) => this.sent.set(answer.name),
      error: (e: HttpErrorResponse) => this.error.set(e.error?.error ?? 'The message could not be sent.'),
    });
  }
}
