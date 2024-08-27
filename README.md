![Banner Light](./.assets/banner-auth0-block-idp-signup-light.png#gh-light-mode-only)
![banner Dark](./.assets/banner-auth0-block-idp-signup-dark.png#gh-dark-mode-only)

# Auth0-Block-IdP-Signup

## Overview

This question has popped up a few times on the Auth0 community forum and other places:
When linking a partner IdP as an *enterprise* connection, why are there no options for
denying specific users access and preventing accounts from being created?
Well, ignoring the fact that the partner usually controls who can connect as their
representative for B2B partnerships (people are on-boarded, off-boarded, etc.)...
And why just enterprise connections?
Is not this problem with social media connections too?

I would say that the complaints about this feature are unwarranted.
The Auth0 approach has always been to favor programatic solutions over the control panel, which makes Auth0
extremely extensible.
Probably the most extensible identity as a service you can get!
It is very simple to implement this in an action script and link it to the post-login action, and while the account
does get created momentarily the script can simply delete it in a matter of milliseconds and deny access.

An initial requirement I saw was to build a deny-list of usernames/email or email domain names, and this
example answers that request.
It would be just as simple and possibly more appropriate task to reverse that logic and provide an allow-list of usernames/email
that may be processed through.
That should just be a reverse of the conditional logic.
It may also be completly appropriate to put the user information in an external database and query that,
since it may be easier for administrator to update.

This approach is also perfectly useful when inspecting at signups fromn *social* connections and block them as desired.
Perhaps  sign-on with lightly concealed profanity in the name or something similar is clearly an abuse of the system.

Additionally, if you delete the account and deny access in the action script it will not count toward the monthly active users.
The user is not considered authenticated until after the event is complete, as explained in this forum post
[How to deal with unverified users](https://community.auth0.com/t/how-to-deal-with-unverified-users/91808/3).

This is one of a series of action script and configuration examples that may be used as a foundation for building
systems that you need.
Search GitHub for *jmussman/auth0* to find other examples in the series.

## Implementation

The implementation prioritizes the event.user.username attribute over the event.user.email attribute.
Once the name is found, it is checked against a deny value.
The example only uses a single username/email value, the starter code may be easily extended
to use an allow or deny list of username/email or email domain names.

If the authenticated username matches the deny value, the even.user.user_id is used to make a Management API
call and remove the profile, and then api.access.deny is called to reject tha login.

## Configuration

This assumes basic knowledge of working with actions and adding actions to flows in Auth0.
This is an overview of the configuration that must be established.

### Steps

1. Create or use an existing M2M application configuration that has delete:users permission in the Management API.
2. Create a new post-login action using the code in the *auth0-block-idp-signup.js* file.
3. Add the *auth0* Node.js package as a dependency for the action.
4. Add secrets for *domain*, *clientId*, and *clientSecret* using the values from the application in step 1.
5. Add a secret *block* with an email address to block for testing.
6. Add a secret *debug* with a value of true for console messages during testing, clear it for production. A re-deployment is neccessary after changing a secret.
7. Save and deploy the action in the post-login flow.

## Unit Tests

Auth0 flow actions provide a rduimentary mechanism for testing.
The custom database actions do not provide a testing feature.
All actions can be monitored for console output using the *Realtime WebTask Logs Extension* in the Auth0 tenant.
When launched by clicking the extension, consent must be provided for it to access the console.
All messages written to console.log will be visible here; a strong recommendation is to only use this in the development sandbox or there will be too many
messages to wade through.

The flow actions testing mechanism allows a mock event to be edited and then the action tested.
Unfortunately, the only way to managem multiple tests with any success is to manage different event configurations outside of the console,
and then paste them in turn to perform tests.

Any significant action must have all possible paths of execution checked, with both positive and negative configurations.
There is no reason that the event and api objects cannot be mocked, and actions tested, outside of Auth0.
As an example of how to do with for a action this project has a full suite of unit tests, written in *Vitest*, with a high percentage of code-coverage.
Vitest performs much better than Jest at asynchromous testing, which is often the case with an action.

At the command line in the project folder:

* Execute *npm install* to add the Vitest packages.
* Run *npm test* to run all the unit tests
* Run *npm run test-coverage* to run the test suite with code-coverage (currently at 100%).

## License

The code is licensed under the MIT license. You may use and modify all or part of it as you choose, as long as attribution to the source is provided per the license. See the details in the [license file](./LICENSE.md) or at the [Open Source Initiative](https://opensource.org/licenses/MIT).


<hr>
Copyright © 2024 Joel A Mussman. All rights reserved.