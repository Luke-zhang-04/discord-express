import * as discord from "discord.js"
import {type DiscordExpressErrorHandler, type DiscordExpressHandler} from "."
import {type RESTPostAPIApplicationCommandsJSONBody, Routes} from "discord-api-types/v9"
import {type Request, createRequest} from "./request"
import {createResponse} from "./response"
import fetch from "node-fetch"
import {matchCommand} from "./commandMatcher"

export interface ClientOptions extends discord.ClientOptions {
    authToken?: string
}

export type CommandArray = [command: string, subCommandGroup?: string, subCommand?: string]

export type StackItem =
    | {type: "use"; handler: DiscordExpressHandler}
    | {type: "error"; handler: DiscordExpressErrorHandler}
    | {type: "command"; command: CommandArray[]; handler: DiscordExpressHandler}

type Ref<T> = {current?: T}

export class Client<Ready extends boolean = boolean> extends discord.Client<Ready> {
    private _stack: StackItem[] = []

    public constructor({authToken, ...options}: ClientOptions) {
        super(options)

        if (authToken) {
            this.login(authToken)
        }
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

        const response = await fetch(
            `https://discord.com/api/v9/${Routes.applicationCommands(clientId)}`,
            {
                method: "PUT",
                body: JSON.stringify(commands),
                headers: {
                    Authorization: `Bot ${this.token}`,
                    "Content-Type": "application/json",
                },
            },
        )

        if (!response.ok) {
            throw new Error(await response.text())
        }

        return await response.json()
    }

    public use(...handlers: DiscordExpressHandler[]): void {
        for (const handler of handlers) {
            this._stack.push({type: "use", handler})
        }
    }

    public command(commands: string | string[], ...handlers: DiscordExpressHandler[]): void {
        const commandArray: CommandArray[] = []
        commands = typeof commands === "string" ? [commands] : commands

        for (const command of commands) {
            commandArray.push(command.replace(/^\//u, "").split("/") as CommandArray)
        }

        for (const handler of handlers) {
            this._stack.push({
                type: "command",
                command: commandArray,
                handler,
            })
        }
    }

    public error(...handlers: DiscordExpressErrorHandler[]): void {
        for (const handler of handlers) {
            this._stack.push({type: "error", handler})
        }
    }

    public initExpress(): void {
        this.on("messageCreate", this.applyStack)
        this.on("interactionCreate", this.applyStack)
    }

    public async applyStack(trigger: discord.Message | discord.Interaction): Promise<void> {
        if (trigger instanceof discord.Interaction) {
            if (!trigger.isCommand() || trigger.user.id === this.user?.id) {
                return
            }
        } else {
            if (trigger.author.id === this.user?.id) {
                return
            }
        }

        const error: Ref<unknown> = {}
        const request = createRequest(trigger)
        const response = createResponse(trigger)
        const stackIter = this._getStack(request, error)

        const nextFunction = async (err?: unknown): Promise<void> => {
            // Avoid infinite error loop
            const shouldCallNextOnError = error.current === undefined

            if (err) {
                error.current = err
            }

            try {
                const item = stackIter.next().value

                if (!item) {
                    return
                } else if (item.type === "error") {
                    await item.handler(error.current, request, response, nextFunction)
                } else {
                    await item.handler(request, response, nextFunction)
                }
            } catch (_err) {
                error.current = _err

                if (shouldCallNextOnError) {
                    await nextFunction()
                }
            }
        }

        await nextFunction()
    }

    private *_getStack(
        request: Request,
        errorRef: Ref<unknown>,
    ): Generator<StackItem, undefined, StackItem> {
        // Use index loop for performance
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let index = 0; index < this._stack.length; index++) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const stackItem = this._stack[index]!

            if (errorRef.current) {
                if (stackItem.type === "error") {
                    yield stackItem
                }
            } else {
                if (stackItem.type === "use") {
                    yield stackItem
                } else if (stackItem.type === "command") {
                    for (const commandArray of stackItem.command) {
                        if (matchCommand(commandArray, request)) {
                            yield stackItem
                        }
                    }
                }
            }
        }

        return
    }
}

export default Client
