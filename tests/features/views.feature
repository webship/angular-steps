@views
Feature: The app's views
  A link of a page the app has taken over changes the view by the router: the router commits the new address, the
  view's title changes, and the link of the current view is marked. A view's data comes from its resolver before
  the address changes, or from the view after it. Without JavaScript every link loads a whole page.

  @critical @needs-javascript
  Scenario: A link changes the view by the router, with its title and its active link
    Given I am on "/"
    When I navigate with the "Posts" link
    Then the router should have changed the view
    And the view's title should be "Posts"
    And the "Posts" link should be the active one
    And the app's address should be "/posts"
    And I should see "Moving between pages"

  @needs-javascript
  Scenario: A view whose data a resolver fetches, and the browser's back
    Given I am on "/posts"
    When I navigate with the "Moving between pages" link
    Then the router should have changed the view
    And the view's title should be "Moving between pages"
    And the app's address should be "/posts/2"
    When I go back one view
    Then the router should have changed the view
    And the app's address should be "/posts"

  @needs-javascript
  Scenario: Data loaded again in the view
    Given I am on "/posts"
    When I press "Load the posts again"
    And I wait for the app's requests to finish
    Then I should see "resolved" in the "#status" element

  # A guard sends /posts/latest on to the latest post: the router cancels the first navigation and commits the second,
  # and the steps follow it to the address it ends at.
  @needs-javascript
  Scenario: A link whose view a guard redirects ends where it was sent
    Given I am on "/posts"
    When I navigate with the "The latest post" link
    Then the router should have changed the view
    And the app's address should be "/posts/3"
    And the view's title should be "Forms"

  @no-javascript
  Scenario: Without JavaScript a redirected link loads the page it was sent to
    Given I am on "/posts"
    When I navigate with the "The latest post" link
    Then a whole page should have loaded
    And the app's address should be "/posts/3"

  @no-javascript
  Scenario: Without JavaScript every link loads a whole page
    Given I am on "/"
    When I navigate with the "About" link
    Then a whole page should have loaded
    And the "About" link should be the active one
