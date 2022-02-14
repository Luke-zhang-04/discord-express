import * as discord from "discord.js"
import {type DiscordExpressErrorHandler, type DiscordExpressHandler} from "."
import type {DiscordExpressInteractionCommandHandler, DiscordExpressMessageHandler} from "./types"
import {type RESTPostAPIApplicationCommandsJSONBody, Routes} from "discord-api-types/v9"
import {type Request, createRequest} from "./request"
import {createResponse} from "./response"
import fetch from "node-fetch"
import {matchCommand} from "./commandMatcher"

export interface ClientOptions extends discord.ClientOptions {
    authToken?: string
}

export type CommandArray = [command: string, subcommandGroup?: string, subcommand?: string]

export type StackCommand =
    | {type: "command"; command: CommandArray[]; handler: DiscordExpressHandler}
    | {type: "messageCommand"; command: CommandArray[]; handler: DiscordExpressMessageHandler}
    | {
          type: "interactionCommand"
          command: CommandArray[]
          handler: DiscordExpressInteractionCommandHandler
      }

export type StackItem =
    | {type: "use"; handler: DiscordExpressHandler}
    | {type: "error"; handler: DiscordExpressErrorHandler}
    | StackCommand

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
        this._addCommand("command", commands, ...handlers)
    }

    public messageCommand(
        commands: string | string[],
        ...handlers: DiscordExpressMessageHandler[]
    ): void {
        this._addCommand("messageCommand", commands, ...handlers)
    }

    public interactioncommand(
        commands: string | string[],
        ...handlers: DiscordExpressInteractionCommandHandler[]
    ): void {
        this._addCommand("interactionCommand", commands, ...handlers)
    }

    /** @alias interactionCommand */
    public slashCommand = this.interactioncommand

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
        let didHandleError = false
        const request = createRequest(trigger)
        const response = createResponse(trigger)
        const stackIter = this._getStack(request, error)

        const nextFunction = async (err?: unknown): Promise<void> => {
            if (err) {
                error.current = err
                didHandleError = false
            }

            try {
                const item = stackIter.next().value

                if (!item) {
                    if (error.current && !didHandleError) {
                        console.error(error.current)
                    }

                    return
                } else if (item.type === "error") {
                    didHandleError = true
                    await item.handler(error.current, request, response, nextFunction)
                } else {
                    await (item.handler as DiscordExpressHandler)(request, response, nextFunction)
                }
            } catch (_err) {
                error.current = _err
                didHandleError = false

                await nextFunction()
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
                switch (stackItem.type) {
                    case "use":
                        yield stackItem
                        break
                    case "command":
                        for (const commandArray of stackItem.command) {
                            if (matchCommand(commandArray, request)) {
                                yield stackItem
                            }
                        }
                        break
                    case "messageCommand":
                        if (request.requestType === "message") {
                            for (const commandArray of stackItem.command) {
                                if (matchCommand(commandArray, request)) {
                                    yield stackItem
                                }
                            }
                        }
                        break
                    case "interactionCommand":
                        if (request.requestType === "interaction") {
                            for (const commandArray of stackItem.command) {
                                if (matchCommand(commandArray, request)) {
                                    yield stackItem
                                }
                            }
                        }
                        break
                }
            }
        }

        return
    }

    private _addCommand(
        type: StackCommand["type"],
        commands: string | string[],
        ...handlers: StackCommand["handler"][]
    ): void {
        const commandArray: CommandArray[] = []
        commands = typeof commands === "string" ? [commands] : commands

        for (const command of commands) {
            commandArray.push(command.replace(/^\//u, "").split("/") as CommandArray)
        }

        for (const handler of handlers) {
            this._stack.push({
                type,
                command: commandArray,
                handler,
            } as StackItem)
        }
    }
}

export default Client
