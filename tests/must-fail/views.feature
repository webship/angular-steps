# Each scenario fails at its last step by design; some of them reach a 4xx answer on the way (a missing post, an
# unknown address), which the browser logs as a console error: the feature keeps webship-js's error mode at warn so
# that only the assertion under test fails.
@must-fail @js-warn
Feature: Assertions on the page, its views and its errors that must fail
  Each scenario asserts something that is not true of the demo, at its last step.

  @no-javascript
  Scenario: Without JavaScript nothing takes the page over
    Fails with: Expected the page to be hydrated, but the browser has JavaScript off.
    Given I am on "/"
    Then the page should be hydrated

  @needs-javascript
  Scenario: A page the server drew
    Fails with: Expected the page to have been rendered in the browser alone, but the server's HTML held it.
    Given I am on "/about"
    Then the page should have been rendered in the browser alone

  @needs-javascript
  Scenario: A change of view by the router
    Fails with: Expected the last navigation to have loaded a whole page, but it changed the view by the router.
    Given I am on "/"
    When I navigate with the "About" link
    Then a whole page should have loaded

  @no-javascript
  Scenario: A whole page loaded
    Fails with: Expected the last navigation to have changed the view by the router, but it loaded a whole page.
    Given I am on "/"
    When I navigate with the "About" link
    Then the router should have changed the view

  @needs-javascript
  Scenario: Another title
    Fails with: Expected the view's title to be "About", but it is "Posts".
    Given I am on "/"
    When I navigate with the "Posts" link
    Then the view's title should be "About"

  Scenario: Another link marked current
    Fails with: Expected the link "Contact" to be the active one, but it is not.
    Given I am on "/about"
    Then the "Contact" link should be the active one

  Scenario: Another address
    Fails with: Expected the app's address to be "/contact", but it is "/about".
    Given I am on "/about"
    Then the app's address should be "/contact"

  Scenario: The address a link goes to, not the one it was sent to
    Fails with: Expected the app's address to be "/posts/latest", but it is "/posts/3".
    Given I am on "/posts"
    When I navigate with the "The latest post" link
    Then the app's address should be "/posts/latest"

  Scenario: A link the page does not have
    Fails with: Expected a link named "Pricing" on the page, but there is none.
    Given I am on "/"
    When I navigate with the "Pricing" link

  Scenario: A page that is not an error page
    Fails with: Expected the app to show its 404 page, but the page loaded with the status 200.
    Given I am on "/about"
    Then the app should show its 404 page

  Scenario: Another message of the error page
    Fails with: Expected the app to show its 404 page saying "Server on fire", but it does not say "Server on fire".
    Given I am on "/posts/9"
    Then the app should show its 404 page saying "Server on fire"

  @needs-javascript
  Scenario: A view reached inside the app that is not an error page
    Fails with: Expected the app to show its 404 page, but its first heading says "Forms"
    Given I am on "/posts"
    When I navigate with the "Forms" link
    Then the app should show its 404 page
