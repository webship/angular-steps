# Each scenario fails at its last step by design; the refusals among them get a 422, which the browser logs as a
# console error: the feature keeps webship-js's error mode at warn so that only the assertion under test fails.
@must-fail @js-warn
Feature: Assertions on a form that must fail
  Each scenario asserts something that is not true of the demo's contact form, at its last step.

  Scenario: A message that was accepted
    Fails with: Expected the form to have been refused with "Your name is required.", but it was accepted
    Given I am on "/contact"
    And the page is hydrated
    When I fill in "Your name" with "Ada"
    And I fill in "Your message" with "Hello from the scenarios of the pack."
    And I send the form by its "Send" button
    Then the form should have been refused with "Your name is required."

  Scenario: A message that was refused
    Fails with: Expected the form to have been accepted, but the page says "Your message needs at least 10 characters."
    Given I am on "/contact"
    And the page is hydrated
    When I fill in "Your name" with "Ada"
    And I fill in "Your message" with "Too short"
    And I send the form by its "Send" button
    Then the form should have been accepted

  Scenario: Refused for another reason
    Fails with: Expected the form to have been refused with "Your name is required.", but it says "Your message needs at least 10 characters."
    Given I am on "/contact"
    And the page is hydrated
    When I fill in "Your name" with "Ada"
    And I fill in "Your message" with "Too short"
    And I send the form by its "Send" button
    Then the form should have been refused with "Your name is required."

  @needs-javascript
  Scenario: A form answered in place
    Fails with: Expected the form to have been answered with a whole page, but it was answered in place.
    Given I am on "/contact"
    And the page is hydrated
    When I fill in "Your name" with "Ada"
    And I fill in "Your message" with "Hello from the scenarios of the pack."
    And I send the form by its "Send" button
    Then the form should have been answered with a whole page

  @no-javascript
  Scenario: A form answered with a whole page
    Fails with: Expected the form to have been answered in place, but it was answered with a whole page.
    Given I am on "/contact"
    When I fill in "Your name" with "Ada"
    And I fill in "Your message" with "Hello from the scenarios of the pack."
    And I send the form by its "Send" button
    Then the form should have been answered in place

  Scenario: A button the form does not have
    Fails with: Expected a button named "Subscribe" in a form of the page, but there is none.
    Given I am on "/contact"
    When I send the form by its "Subscribe" button

  Scenario: No form sent yet
    Fails with: Expected a form the scenario sent, but none of its steps sent one.
    Given I am on "/contact"
    Then the form should have been accepted
