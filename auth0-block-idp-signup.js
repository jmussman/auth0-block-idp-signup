/**
 * auth0-block-idp-signup
 * Copyright © 2024 Joel A Mussman. All rights reserved.
 * 
 * This code is released under the MIT license and is free to copy and modify as
 * long as the source is attributed.
 * 
 * This action is a starter framework to block social and enterprise IdP user registration by
 * deleting the newly created profile and rejecting the login.
 * 
 * There are multiple possibilities for the source of what to block:
 * 
 *  - A list of email addresses or domain names stored in a secret (used here)
 *  - A list of adresses or domain names read from an external source (should be cached for speed)
 *  - A list of addresses or domain names stored in application metadata (works only for the target app)
 * 
 * This example uses a secret in the action, 'block', with the value of a single email to block.
 * 
 * Add the 'auth0' Node.js dependency at the latest version. Add the credentials for an M2M
 * application with delete:users permission in the management API as the domain, clientId,
 * and clientSecret) secrets. Prime the 'block' secret with an email address to test with.
 */

exports.onExecutePostLogin = async (event, api) => {

    // Set up the connection to the management API (act as the management API client).

    const ManagementClient = require('auth0').ManagementClient;

    const managementClient = new ManagementClient({

        domain: event.secrets.domain,
        clientId: event.secrets.clientId,
        clientSecret: event.secrets.clientSecret,
    });

    try {

        // Prioritize the username over the email as the login name to check against.
        
        const username = event.user.username ?? event.user.email;

        // This is a simple example that checks a single email/username. It may become complicated
        // depending on requirements: a list of values, list elements are individual addresses or
        // domain names that must be checked; reading a list from an external source (API), etc.

        // It would be very simple to reverse this logic and create an allow-list of users that
        // may signup from the IdP.
        
        if (username === event.secrets.block) {

            const result = await managementClient.users.delete({ id: event.user.user_id });

            api.access.deny('Because I said so!');
        }
    }

    catch (e) {

        // Either the credentials are wrong or the profile doesn't exist. Not much to do. 
    }
}