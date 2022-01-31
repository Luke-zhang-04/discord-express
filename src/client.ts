import * as discord from "discord.js"
import {type RESTPostAPIApplicationCommandsJSONBody, Routes} from "discord-api-types/v9"
import {createRequest, type Request} from "./request"
import {DiscordExpressHandler} from "."
import {createResponse} from "./response"
import fetch from "node-fetch"
import {isObject} from "@luke-zhang-04/utils"

export interface ClientOptions extends discord.ClientOptions {
    authToken?: string
}

export type CommandArray = [command: string, subCommandGroup?: string, subCommand?: string]

export type StackItem =
    | {type: "use"; handler: DiscordExpressHandler}
    | {type: "command"; command: CommandArray[]; handler: DiscordExpressHandler}

const matchCommand = (
    commandArray: CommandArray,
    {body, command, requestType}: Request,
): boolean => {
    const isMatchingCommand = commandArray[0] === "*" || commandArray[0] === command[0]
    const isMatchingSubCommandGroup =
        commandArray[1] === "*" || commandArray[0] === "*" || commandArray[1] === command[1]
    const isMatchingSubCommand =
        commandArray[2] === "*" ||
        commandArray[1] === "*" ||
        commandArray[0] === "*" ||
        commandArray[2] === command[2]

    const isPerfectMatch = isMatchingCommand && isMatchingSubCommandGroup && isMatchingSubCommand

    if (requestType === "interaction" || isPerfectMatch) {
        return isPerfectMatch
    }

    if (commandArray.length === 1) {
        if (isMatchingCommand) {
            return true
        }
    } else if (commandArray.length === 2) {
        if (isMatchingCommand && isMatchingSubCommandGroup) {
            if (isObject(body) && body._ instanceof Array) {
                body._.splice(0, 1)
            }

            return true
        }
    } else if (commandArray.length === 3) {
        if (isMatchingCommand && isMatchingSubCommandGroup && isMatchingSubCommand) {
            if (isObject(body) && body._ instanceof Array) {
                body._.splice(0, 2)
            }

            return true
        }
    }

    return false
}

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

    public initExpress(): void {
        this.on("messageCreate", this.applyStack)
        this.on("interactionCreate", this.applyStack)
    }

    public async applyStack(trigger: discord.Message | discord.CommandInteraction): Promise<void> {
        if (trigger instanceof discord.CommandInteraction) {
            if (!trigger.isCommand() || trigger.user.id === this.user?.id) {
                return
            }
        } else {
            if (trigger.author.id === this.user?.id) {
                return
            }
        }

        const request = createRequest(trigger)
        const response = createResponse(trigger)
        const stackIter = this._getStack(request)

        const nextFunction = async (): Promise<void> => {
            await stackIter.next().value?.handler(request, response, nextFunction)
        }

        await nextFunction()
    }

    private *_getStack(trigger: Request): Generator<StackItem, undefined, StackItem> {
        // Use index loop for performance
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let index = 0; index < this._stack.length; index++) {
            const stackItem = this._stack[index]!

            if (stackItem.type === "use") {
                yield stackItem
            } else if (stackItem.type === "command") {
                for (const commandArray of stackItem.command) {
                    if (matchCommand(commandArray, trigger)) {
                        yield stackItem
                    }
                }
            }
        }

        return
    }
}

export default Client
