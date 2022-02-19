import * as discord from "discord.js"
import {type DiscordExpressErrorHandler, type DiscordExpressHandler} from "."
import type {DiscordExpressInteractionCommandHandler, DiscordExpressMessageHandler} from "./types"
import {type RESTPostAPIApplicationCommandsJSONBody, Routes} from "discord-api-types/v9"
import {type Request, createRequest} from "./request"
import {
    type Response,
    createResponse,
    type MessageResponse,
    type InteractionResponse,
} from "./response"
import fetch from "node-fetch"
import {matchCommand} from "./commandMatcher"

const inlineTryPromise = async <T>(func: () => Promise<T>): Promise<unknown> => {
    try {
        await func()

        return undefined
    } catch (err) {
        return err
    }
}

export interface ClientOptions extends discord.ClientOptions {
    /** Authentication token */
    authToken?: string
}

export type CommandArray = [string, string?, string?]

export type StackCommand =
    | {type: "command"; command: CommandArray[]; handler: DiscordExpressHandler}
    | {type: "messageCommand"; command: CommandArray[]; handler: DiscordExpressMessageHandler}
    | {
          type: "interactionCommand"
          command: CommandArray[]
          handler: DiscordExpressInteractionCommandHandler
      }

export type StackItem =
    | {type: "use"; command?: CommandArray[]; handler: DiscordExpressHandler}
    | {type: "error"; command?: CommandArray[]; handler: DiscordExpressErrorHandler}
    | StackCommand

type Ref<T> = {current?: T}

/**
 * An extension of the default Discord.js `Client` class that includes methods for the
 * middleware-like command system
 */
export class Client<Ready extends boolean = boolean> extends discord.Client<Ready> {
    /** @alias interactionCommand */
    public slashCommand = this.interactioncommand
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

    public use(...handlers: DiscordExpressHandler[]): void
    public use(routes: string | string[], ...handlers: DiscordExpressHandler[]): void

    public use(
        routesOrHandler: string | string[] | DiscordExpressHandler,
        ...handlers: DiscordExpressHandler[]
    ): void {
        if (typeof routesOrHandler === "function") {
            for (const handler of [routesOrHandler, ...handlers]) {
                this._stack.push({type: "use", handler})
            }
        } else {
            this._addItem("use", routesOrHandler, handlers)
        }
    }

    public command(commands: string | string[], ...handlers: DiscordExpressHandler[]): void {
        this._addItem("command", commands, handlers)
    }

    public messageCommand(
        commands: string | string[],
        ...handlers: DiscordExpressMessageHandler[]
    ): void {
        this._addItem("messageCommand", commands, handlers)
    }

    public interactioncommand(
        commands: string | string[],
        ...handlers: DiscordExpressInteractionCommandHandler[]
    ): void {
        this._addItem("interactionCommand", commands, handlers)
    }

    public error(...handlers: DiscordExpressErrorHandler[]): void
    public error(routes: string | string[], ...handlers: DiscordExpressErrorHandler[]): void

    public error(
        routesOrHandler: string | string[] | DiscordExpressErrorHandler,
        ...handlers: DiscordExpressErrorHandler[]
    ): void {
        if (typeof routesOrHandler === "function") {
            for (const handler of [routesOrHandler, ...handlers]) {
                this._stack.push({type: "error", handler})
            }
        } else {
            this._addItem("error", routesOrHandler, handlers)
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

        const error: Ref<{error: unknown; didHandle: boolean}> = {}
        const request = createRequest(trigger)
        const response = createResponse(trigger)
        let stackIter:
            | AsyncGenerator<undefined | unknown, undefined, undefined | unknown>
            | undefined

        const nextFunction = async (err?: unknown): Promise<void> => {
            if (err) {
                error.current = {error: err, didHandle: false}
            }

            try {
                const _err = (await stackIter?.next())?.value

                if (_err) {
                    await nextFunction(_err)
                } else if (error.current?.didHandle === false) {
                    console.error(error.current.error)
                }
            } catch (_err) {
                await nextFunction(_err)
            }
        }

        stackIter = this._getStack(request, response, nextFunction, error)

        await nextFunction()
    }

    private async *_getStack(
        request: Request,
        response: Response,
        nextFunction: (err?: unknown) => Promise<void>,
        errorRef: Ref<{error: unknown; didHandle: boolean}>,
    ): AsyncGenerator<undefined | unknown, undefined, undefined | unknown> {
        const params = [request, response, nextFunction] as const

        // Use index loop for performance
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let index = 0; index < this._stack.length; index++) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const stackItem = this._stack[index]!

            if (errorRef.current) {
                if (stackItem.type === "error") {
                    if (stackItem.command) {
                        for (const commandArray of stackItem.command) {
                            if (matchCommand(commandArray, request)) {
                                errorRef.current.didHandle = true

                                const err = await inlineTryPromise(
                                    async () =>
                                        await stackItem.handler(
                                            errorRef.current!.error,
                                            ...params,
                                        ),
                                )

                                yield err

                                if (err) {
                                    break
                                }
                            }
                        }
                    } else {
                        errorRef.current.didHandle = true

                        yield await inlineTryPromise(
                            async () =>
                                await stackItem.handler(errorRef.current!.error, ...params),
                        )
                    }
                }
            } else {
                switch (stackItem.type) {
                    case "use":
                        if (stackItem.command) {
                            for (const commandArray of stackItem.command) {
                                if (matchCommand(commandArray, request)) {
                                    const err = await inlineTryPromise(
                                        async () => await stackItem.handler(...params),
                                    )

                                    yield err

                                    if (err) {
                                        break
                                    }
                                }
                            }
                        } else {
                            yield await inlineTryPromise(
                                async () => await stackItem.handler(...params),
                            )
                        }
                        break
                    case "command":
                        for (const commandArray of stackItem.command) {
                            if (matchCommand(commandArray, request)) {
                                const err = await inlineTryPromise(
                                    async () => await stackItem.handler(...params),
                                )

                                yield err

                                if (err) {
                                    break
                                }
                            }
                        }
                        break
                    case "messageCommand":
                        if (request.requestType === "message") {
                            for (const commandArray of stackItem.command) {
                                if (matchCommand(commandArray, request)) {
                                    const err = await inlineTryPromise(
                                        async () =>
                                            await stackItem.handler(
                                                request,
                                                response as MessageResponse,
                                                nextFunction,
                                            ),
                                    )

                                    yield err

                                    if (err) {
                                        break
                                    }
                                }
                            }
                        }
                        break
                    case "interactionCommand":
                        if (request.requestType === "interaction") {
                            for (const commandArray of stackItem.command) {
                                if (matchCommand(commandArray, request)) {
                                    const err = await inlineTryPromise(
                                        async () =>
                                            await stackItem.handler(
                                                request,
                                                response as InteractionResponse,
                                                nextFunction,
                                            ),
                                    )

                                    yield err

                                    if (err) {
                                        break
                                    }
                                }
                            }
                        }
                        break
                }
            }
        }

        return
    }

    private _addItem(
        type: StackItem["type"],
        commands: string | string[],
        handlers: StackItem["handler"][],
    ): void {
        const commandArray: CommandArray[] = []
        const arrCommands = typeof commands === "string" ? [commands] : commands

        for (const command of arrCommands) {
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
