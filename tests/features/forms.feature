@forms
Feature: A form, with JavaScript and without
  The demo's contact form posts to the server without JavaScript, and the server sends the browser back to the form
  with the answer in its address; with JavaScript the app sends it in place and shows the answer. The same steps run
  in both: each waits for what its mode brings. The fields are filled once the page is hydrated: when the app takes
  the page over, its form writes its own values into its fields, and what was typed before is lost.

  @critical
  Scenario: A message is accepted
    Given I am on "/contact"
    And the page is hydrated
    When I fill in "Your name" with "Ada"
    And I fill in "Your message" with "Hello from the scenarios of the pack."
    And I send the form by its "Send" button
    Then the form should have been accepted
    And I should see "Thanks, Ada: your message was sent."

  # The browser logs the refusal's answer (422) as a console error ("Failed to load resource"): this scenario expects
  # one, so it keeps webship-js's error mode at warn; every other scenario of the suite fails on a browser error.
  @js-warn
  Scenario: A message too short is refused, and says why
    Given I am on "/contact"
    And the page is hydrated
    When I fill in "Your name" with "Ada"
    And I fill in "Your message" with "Too short"
    And I send the form by its "Send" button
    Then the form should have been refused with "Your message needs at least 10 characters."

  @needs-javascript
  Scenario: With JavaScript, the form is answered in place
    Given I am on "/contact"
    And the page is hydrated
    When I fill in "Your name" with "Ada"
    And I fill in "Your message" with "Hello from the scenarios of the pack."
    And I send the form by its "Send" button
    Then the form should have been answered in place

  @no-javascript
  Scenario: Without JavaScript, the form is answered with a whole page
    Given I am on "/contact"
    When I fill in "Your name" with "Ada"
    And I fill in "Your message" with "Hello from the scenarios of the pack."
    And I send the form by its "Send" button
    Then the form should have been answered with a whole page
    And the app's address should be "/contact?sent=Ada"
