import * as discord from "discord.js"
import {REST} from "@discordjs/rest"
import {type RESTPostAPIApplicationCommandsJSONBody, Routes} from "discord-api-types/v9"

export interface ClientOptions extends discord.ClientOptions {
    authToken?: string
}

export class Client<Ready extends boolean = boolean> extends discord.Client<Ready> {
    private _discordjsRest: REST | undefined

    public constructor({authToken, ...options}: ClientOptions) {
        super(options)

        if (authToken) {
            this.login(authToken)
            this._discordjsRest = new REST({version: "9"}).setToken(authToken)
        }
    }

    /** Get the @discordjs/rest REST instance */
    public get discordJsRest(): REST | undefined {
        return this._discordjsRest
    }

    public override async login(token?: string | undefined): Promise<string> {
        if (token) {
            this._discordjsRest = new REST({version: "9"}).setToken(token)
        }

        return await super.login(token)
    }

    /**
     * Register Application Commands (slash commands). You can use the SlashCommandBuilder class if
     * you prefer, or the implementation shipped with this library
     *
     * @param commands - Commands to register
     * @param clientId - App client ID
     */
    public async registerCommands(
        commands: RESTPostAPIApplicationCommandsJSONBody[],
        clientId: string,
    ): Promise<unknown> {
        if (!this._discordjsRest) {
            throw new Error("Client not logged in")
        }

        return await this._discordjsRest.put(Routes.applicationCommands(clientId), {
            body: commands,
        })
    }
}
