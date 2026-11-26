# angular-steps

Cucumber step definitions for Angular apps, for [webship-js](https://webship.co/docs/webship-js/2.0.x), a BDD browser
automation harness built on Playwright and Cucumber-js.

An Angular page rendered on the server arrives as HTML, then the app takes it over in the browser (hydration): until
then its links load whole pages and its buttons do nothing. The steps wait for that moment, follow the app's own
navigation between views, and wait on its data, its forms and its error pages, never for a fixed time. No step phrase
names the framework.

The steps, their features, the sample app and CI come with the first release, `2.0.0`.

## License

MIT (see `LICENSE`).

## Logo

The logo of this pack is pending the owner's decision: it comes before the first release.
