import * as discord from "discord.js"
import {type RESTPostAPIApplicationCommandsJSONBody, Routes} from "discord-api-types/v9"
import {DiscordExpressHandler} from "."
import {createRequest} from "./request"
import {createResponse} from "./response"
import fetch from "node-fetch"

export interface ClientOptions extends discord.ClientOptions {
    authToken?: string
}

type StackItem = {
    type: "use"
    handler: DiscordExpressHandler
}

export class Client<Ready extends boolean = boolean> extends discord.Client<Ready> {
    private _stack: StackItem[] = []

    public constructor({authToken, ...options}: ClientOptions) {
        super(options)

        if (authToken) {
            this.login(authToken)
        }
    }

    public override async login(token?: string | undefined): Promise<string> {
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
        if (!this.token) {
            throw new Error("Client not logged in")
        }

        return await fetch(`https://discord.com/api/v9/${Routes.applicationCommands(clientId)}`, {
            method: "PUT",
            body: JSON.stringify(commands),
            headers: {
                Authorization: `Bot ${this.token}`,
            },
        })
    }

    public use(...handlers: DiscordExpressHandler[]): void {
        for (const handler of handlers) {
            this._stack.push({type: "use", handler})
        }
    }

    public initExpress(): void {
        this.on("messageCreate", this.applyStack)
        this.on("interaction", this.applyStack)
    }

    public async applyStack(trigger: discord.Message | discord.Interaction): Promise<void> {
        if (trigger instanceof discord.Interaction) {
            if (!trigger.isCommand()) {
                return
            }
        }

        const stackIter = this._getStack()

        const request = createRequest(trigger)
        const response = createResponse(trigger)

        const nextFunction = () => {
            stackIter.next().value?.handler(request, response, nextFunction)
        }

        nextFunction()
    }

    private *_getStack(): Generator<StackItem, undefined, StackItem> {
        // Use index loop for performance
        for (let index = 0; index < this._stack.length; index++) {
            const stackItem = this._stack[index]

            if (stackItem?.type === "use") {
                yield stackItem
            }
        }

        return
    }
}
