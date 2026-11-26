@page
Feature: The app takes the server's page over
  The demo: Angular's official starter with server rendering, and pages of its own. A page arrives as the server's
  HTML; the app's scripts then take it over in the browser (hydration). One page is rendered in the browser alone:
  the server sends only the app's empty element for it.

  @critical @needs-javascript
  Scenario: A page drawn on the server is hydrated by the app
    Given I am on "/"
    And the page is hydrated
    Then the page should be hydrated
    And I should see "Welcome to the demo"

  @needs-javascript
  Scenario: A page rendered in the browser alone
    Given I am on "/client-only"
    And the page is hydrated
    Then the page should have been rendered in the browser alone
    And I should see "rendered in the browser"

  @no-javascript
  Scenario: Without JavaScript the server's page is all there is
    Given I am on "/posts"
    And the page is hydrated
    Then I should see "Moving between pages"

  @needs-javascript @idle-after-steps
  Scenario: A count that changes in place
    Given I am on "/"
    When I press "Add one to the count" by attr
    And I wait for the app to be idle
    Then I should see "1" in the "#count" element
