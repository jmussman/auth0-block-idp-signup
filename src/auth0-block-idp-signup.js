/**
 * auth0-block-idp-signup.js
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
 * This example uses a secret in the action with a comma separated list of email addresses to block.
 * Spaces are allowed.
 * 
 * THe action secret 'debug' with a value of true can be added to generate console log statements.
 * If 'debug' is set or removed, a re-deployment of the application is necessary for it to take effect.
 * 
 * Add the 'auth0' Node.js dependency at the latest version. Add the credentials for an M2M
 * application with delete:users permission in the management API as the domain, clientId,https://cdn.auth0.com/manhattan/versions/1.5266.0/assets/actions/handler.svg
 * and clientSecret) secrets. Prime the 'block' secret with an email address to test with.
 */

exports.onExecutePostLogin = async (event, api) => {

    const DEBUG = event.secrets.debug;

    // Build a list of the deny users, separating the entries and stripping whitespace.

    let denyList = [];
    const deny = event.secrets.deny;

    if (deny) {

        denyList = deny.split(',');

        for (let i = 0; i < denyList.length; i++) {

            denyList[i] = denyList[i].trim();
            
            if (!denyList[i]) {
            
                // It is safe to delete entries in a for loop since the array length reduces.

                denyList.splice(i, 1);
            }
        }
    }

    if (denyList.length) {

        try {

            // Set up the connection to the management API (act as the management API client).

            const ManagementClient = require('auth0').ManagementClient;

            const managementClient = new ManagementClient({

                domain: event.secrets.domain,
                clientId: event.secrets.clientId,
                clientSecret: event.secrets.clientSecret,
            });

            DEBUG ? console.log('Starting block action') : null;

            // Prioritize the username over the email as the login name to check against. Many enterprise
            // and all social IdP connections will not set username. We cannot use ?? here because '' is
            // not null or undefined.
            
            const username = event.user.username?.trim() ? event.user.username.trim() : event.user.email;

            // Spin through the list and deny entry if there is a match. It would be very simple to reverse this
            // logic and create an allow-list.

            for (let deny of denyList) {
            
                if (username === deny) {

                    DEBUG ? console.log(`Blocking and deleting user registration for ${event.user.user_id} (${username})`) : null;

                    await managementClient.users.delete({ id: event.user.user_id });
                    api.access.deny('Because I said so!');
                    
                    break;
                }
            }
        }

        catch (e) {

            DEBUG ? console.log(e) : null;

            // Rethrow the exception so Auth0 handles it and the error shows up at that level.

            throw e
        }
    }
}