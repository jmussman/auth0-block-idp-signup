![Banner Light](./.assets/banner-auth0-block-idp-signup-light.png#gh-light-mode-only)
![banner Dark](./.assets/banner-auth0-block-idp-signup-dark.png#gh-dark-mode-only)

# Auth0-Block-IdP-Signup

## Overview

When linking a partner IdP as an *enterprise* connection limiting the users from that IdP that may be processed through a signup
and have a profile may be a requirement.

The initial requirement was to build a deny-list of usernames/email or email domain names, but it would be a simple
task to reverse that logic and provide an allow-list of usernames/email that may be processed through.

This is also perfectly useful to look at social-media signups fromn *social* connections and block them as desired.

## Implementation

The implementation prioritizes the event.user.username attribute over the event.user.email attribute.
Once the name is found, it is checked against a deny value.
The example only uses a single username/email value, the starter code may be easily extended
to use an allow or deny list of username/email or email domain names.

If the authenticated username matches the deny value, the even.user.user_id is used to make a Management API
call and remove the profile.
Then, api.access.deny is called to reject tha login.


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

## License

The code is licensed under the MIT license. You may use and modify all or part of it as you choose, as long as attribution to the source is provided per the license. See the details in the [license file](./LICENSE.md) or at the [Open Source Initiative](https://opensource.org/licenses/MIT).


<hr>
Copyright © 2024 Joel A Mussman. All rights reserved.