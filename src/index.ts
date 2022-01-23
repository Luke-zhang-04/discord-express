/**
 * Discord Express
 *
 * @license BSD-3-Clause
 * @author Luke Zhang luke-zhang-04.github.io
 * @copyright 2022 Luke Zhang
 */

import * as discord from "discord.js"

export interface ClientOptions extends discord.ClientOptions {
    authToken?: string
}

export class Client<Ready extends boolean = boolean> extends discord.Client<Ready> {
    public constructor({authToken, ...options}: ClientOptions) {
        super(options)

        if (authToken) {
            this.login(authToken)
        }
    }
}
