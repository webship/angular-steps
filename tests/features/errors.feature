@errors
Feature: Error pages
  Angular has no error page of its own: the demo shows a view with the code in its first heading and the message
  under it, for a post that does not exist and for an address it does not know. Loaded, the page answers with the
  status; reached inside the app, there is no status, and the view says the code.

  # The browser logs a 404 answer (the page's, or the request of the view's resolver) as a console error: these
  # scenarios expect one, so they keep webship-js's error mode at warn.
  @critical @js-warn
  Scenario: A post that does not exist
    Given I am on "/posts/9"
    Then the app should show its 404 page saying "Post not found"

  @js-warn
  Scenario: An address the app does not know
    Given I am on "/no-such-page"
    Then the app should show its 404 page saying "Page not found"
    And the response status code should be 404

  @needs-javascript @js-warn
  Scenario: A post that does not exist, reached inside the app
    Given I am on "/posts"
    When I navigate with the "A post that was taken down" link
    Then the router should have changed the view
    And the app should show its 404 page saying "Post not found"
