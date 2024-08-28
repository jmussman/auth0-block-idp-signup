// auth0-opt-in-mfa.test.js
// Copyright © 2024 Joel A Mussman. All rights reserved.
//
// This Action code is released under the MIT license and is free to copy and modify as
// long as the source is attributed.
//
// Note: EVERY test is limited to 20000ms (see the config), because Auth0 constrains actions to 20 seconds.
//

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import 'vitest-mock-commonjs'

import { onExecutePostLogin } from '../src/auth0-block-idp-signup'

const mocks = vi.hoisted(() => {

    const managementClient = {

        users: {

            delete: vi.fn(async (requestParameters) => new Promise((resolve) => resolve()))
        }
    }

    class ManagementClient {

        constructor(options) {

            this.users = managementClient.users
        }
    }

    const mocks = {

        apiMock: {

            access: {

                deny: vi.fn(() => {})
            }
        },

        auth0Mock: {
            
            ManagementClient: ManagementClient,
            managementClient: managementClient
        },

        eventMock: {

            secrets: {

                clientId: 'abc',
                clientSecret: 'xyz',
                debug: true,
                deny: 'calicojack@pyrates.live, blackbeard@pyrates.live',
                domain: 'pid.pyrates.live'
            },

            user: {

                email: 'calicojack@pyrates.live',
                user_id: 'auth0|5f7c8ec7c33c6c004bbafe82',
                username: null
            }
        },
    }

    return mocks;
})

describe('Action tests', async () => {

    let consoleLogMock
    let ctor

    beforeAll(async () => {

        consoleLogMock = vi.spyOn(console, 'log').mockImplementation(() => {})
        vi.mockForNodeRequire('auth0', mocks.auth0Mock)
    })

    beforeEach(() => {

        consoleLogMock.mockClear()
        ctor = vi.spyOn(mocks.auth0Mock, 'ManagementClient').mockImplementation(() => { return { users: mocks.auth0Mock.managementClient.users }})
        mocks.apiMock.access.deny.mockClear()
        mocks.auth0Mock.managementClient.users.delete.mockClear()
        mocks.eventMock.secrets.debug = true   
        mocks.eventMock.secrets.deny = 'calicojack@pyrates.live, blackbeard@pyrates.live'
    })

    it('Ignores everything if event.secrets.deny is undefined', async () => {

        delete mocks.eventMock.secrets.deny

        await onExecutePostLogin(mocks.eventMock, mocks.apiMock)

        expect(ctor).not.toHaveBeenCalled()
    })

    it('Ignores everything if event.secrets.deny is null', async () => {

        mocks.eventMock.secrets.deny = null

        await onExecutePostLogin(mocks.eventMock, mocks.apiMock)

        expect(ctor).not.toHaveBeenCalled()
    })

    it('Ignores everything if the denyList evaluates to empty', async () => {

        mocks.eventMock.secrets.deny = ''

        await onExecutePostLogin(mocks.eventMock, mocks.apiMock)

        expect(ctor).not.toHaveBeenCalled()
    })

    it('Ignores everything if all the denyList entries evaluate to empty', async () => {

        mocks.eventMock.secrets.deny = ' , '

        await onExecutePostLogin(mocks.eventMock, mocks.apiMock)

        expect(ctor).not.toHaveBeenCalled()
    })

    it('Passes domain, clientID, and clientSecret to initialize managementClient', async () => {

        const expectedOptions = {

            clientId: mocks.eventMock.secrets.clientId,
            clientSecret: mocks.eventMock.secrets.clientSecret,
            domain: mocks.eventMock.secrets.domain
        }

        await onExecutePostLogin(mocks.eventMock, mocks.apiMock)

        expect(ctor).toHaveBeenCalledWith(expectedOptions)
    })

    it('Allows authentication if the user is not the single deny list entry', async () => {

        mocks.eventMock.secrets.deny = 'blackbeard@pyrates.live'

        await onExecutePostLogin(mocks.eventMock, mocks.apiMock)

        expect(mocks.auth0Mock.managementClient.users.delete).not.toHaveBeenCalled()
        expect(mocks.apiMock.access.deny).not.toHaveBeenCalled()
    })

    it('Allows authentication if the user is not in the deny list with multiple entries', async () => {

        mocks.eventMock.secrets.deny = 'blackbeard@pyrates.live, mary.read@pyrates.live'

        await onExecutePostLogin(mocks.eventMock, mocks.apiMock)

        expect(mocks.auth0Mock.managementClient.users.delete).not.toHaveBeenCalled()
        expect(mocks.apiMock.access.deny).not.toHaveBeenCalled()
    })

    it('Rejects authentication when the only deny entry is the denied user', async () => {

        mocks.eventMock.secrets.deny = 'calicojack@pyrates.live'

        await onExecutePostLogin(mocks.eventMock, mocks.apiMock)

        expect(mocks.auth0Mock.managementClient.users.delete).toHaveBeenCalled()
        expect(mocks.apiMock.access.deny).toHaveBeenCalled()
    })

    it('Ignores leading space in deny entry and rejects authentication', async () => {

        mocks.eventMock.secrets.deny = ' calicojack@pyrates.live'

        await onExecutePostLogin(mocks.eventMock, mocks.apiMock)

        expect(mocks.auth0Mock.managementClient.users.delete).toHaveBeenCalled()
        expect(mocks.apiMock.access.deny).toHaveBeenCalled()
    })

    it('Ignores trailing space in deny entry and rejects authentication', async () => {

        mocks.eventMock.secrets.deny = 'calicojack@pyrates.live '

        await onExecutePostLogin(mocks.eventMock, mocks.apiMock)

        expect(mocks.auth0Mock.managementClient.users.delete).toHaveBeenCalled()
        expect(mocks.apiMock.access.deny).toHaveBeenCalled()
    })

    it('Rejects authentication when the first deny entry is the user', async () => {

        mocks.eventMock.secrets.deny = 'calicojack@pyrates.live, blackbeard@pyrates.live'

        await onExecutePostLogin(mocks.eventMock, mocks.apiMock)

        expect(mocks.auth0Mock.managementClient.users.delete).toHaveBeenCalled()
        expect(mocks.apiMock.access.deny).toHaveBeenCalled()
    })

    it('Rejects authentication when the last deny entry is the user', async () => {

        mocks.eventMock.secrets.deny = 'blackbeard@pyrates.live, calicojack@pyrates.live'

        await onExecutePostLogin(mocks.eventMock, mocks.apiMock)

        expect(mocks.auth0Mock.managementClient.users.delete).toHaveBeenCalled()
        expect(mocks.apiMock.access.deny).toHaveBeenCalled()
    })

    it('Selects email when username is undefined', async () => {

        delete mocks.eventMock.user.username

        await onExecutePostLogin(mocks.eventMock, mocks.apiMock)

        // Check the console log that we showed the correct value.

        expect(consoleLogMock).toHaveBeenCalledWith(expect.stringContaining(mocks.eventMock.user.email))
    })

    it('Selects email when username is empty', async () => {

        mocks.eventMock.user.username = ''

        await onExecutePostLogin(mocks.eventMock, mocks.apiMock)

        // Check the console log that we showed the correct value.

        expect(consoleLogMock).toHaveBeenCalledWith(expect.stringContaining(mocks.eventMock.user.email))
    })

    it('Selects email when username is blank', async () => {

        mocks.eventMock.user.username = '     '

        await onExecutePostLogin(mocks.eventMock, mocks.apiMock)

        // Check the console log that we showed the correct value.

        expect(consoleLogMock).toHaveBeenCalledWith(expect.stringContaining(mocks.eventMock.user.email))
    })

    it('Selects username over email', async () => {

        mocks.eventMock.user.username = 'blackbeard@pyrates.live'

        await onExecutePostLogin(mocks.eventMock, mocks.apiMock)

        // Check the console log that we showed the correct value.

        expect(consoleLogMock).toHaveBeenCalledWith(expect.stringContaining('blackbeard@pyrates.live'))
    })

    it('Enroll emits debugging messages to the console if event.secrets.debug is true', async () => {

        await onExecutePostLogin(mocks.eventMock, mocks.apiMock)

        expect(consoleLogMock).toHaveBeenCalled()
    })

    it('Does not emit debugging messages to the console if event.secrets.debug is undefined', async () => {
        
        delete mocks.eventMock.secrets.debug

        await onExecutePostLogin(mocks.eventMock, mocks.apiMock)

        expect(consoleLogMock).not.toHaveBeenCalled()
    })

    it('Does not emit debugging messages to the console if event.secrets.debug is null', async () => {
        
        mocks.eventMock.secrets.debug = null

        await onExecutePostLogin(mocks.eventMock, mocks.apiMock)

        expect(consoleLogMock).not.toHaveBeenCalled()
    })

    it('Does not emit debugging messages to the console if event.secrets.debug is false', async () => {

        mocks.eventMock.secrets.debug = false

        await onExecutePostLogin(mocks.eventMock, mocks.apiMock)

        expect(consoleLogMock).not.toHaveBeenCalled()
    })

    it('Does not emit debugging messages to the console if event.secrets.debug is 0', async () => {
        
        mocks.eventMock.secrets.debug = 0

        await onExecutePostLogin(mocks.eventMock, mocks.apiMock)

        expect(consoleLogMock).not.toHaveBeenCalled()
    })

    it('Catches exception thrown during API calls', async () => {

        // Redefine the API deny call to throw an exception.

        const message = 'This message should be logged'

        mocks.apiMock.access.deny = vi.fn(() => { throw message })
 
        expect(async () => await onExecutePostLogin(mocks.eventMock, mocks.apiMock)).rejects.toThrow(expect.stringContaining(message))
    })

    it('Catches exception thrown during ManagementClient instantiation', async () => {
        
        // Redefine the ManagementClient constructor to throw an exception.

        const message = 'This message should be logged'
        ctor = vi.spyOn(mocks.auth0Mock, 'ManagementClient').mockImplementation(() => { throw message })

        expect(async () => await onExecutePostLogin(mocks.eventMock, mocks.apiMock)).rejects.toThrow(expect.stringContaining(message))
        expect(consoleLogMock).toHaveBeenCalledWith(expect.stringContaining(message))
    })

    it('Does not log exception thrown for ManagementClient instantiation when DEBUG is false', async () => {

        const message = 'This message should be logged'

        // Disable logging and redefine the API deny call to throw an exception.

        mocks.eventMock.secrets.debug = false
        mocks.apiMock.access.deny = vi.fn(() => { throw message})
 
        expect(async () => await onExecutePostLogin(mocks.eventMock, mocks.apiMock)).rejects.toThrow(expect.stringContaining(message))
        expect(consoleLogMock).not.toHaveBeenCalled()
    })
})