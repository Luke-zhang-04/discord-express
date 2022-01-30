import {
    type CacheType,
    type Client,
    CommandInteraction,
    type CommandInteractionOption,
    type Guild,
    type GuildMember,
    type InteractionType,
    Message,
    type MessageType,
    type TextBasedChannel,
    type User,
} from "discord.js"
import type {APIInteractionGuildMember} from "discord-api-types"
import {pick} from "@luke-zhang-04/utils"

export interface BaseRequest {
    appId: string | null

    /**
     * Author of the request
     *
     * @alias user
     */
    author: User

    /**
     * User who triggered the request
     *
     * @alias author
     */
    user: User
    channel: TextBasedChannel | null
    channelId: string | null
    client: Client | null
    createdAt: Date
    createdTimestamp: number
    guild: Guild | null
    guildId: string | null
    id: string
    /** Arguments and options passed from the command */
    body: unknown
    /**
     * Command details. Note that for message commands, positional arguments are inserted even if
     * they may not be subcommands or subcommand groups.
     *
     * @example
     *
     * ```ts
     * // A command that looks like this
     * const input = "!myCommand arg1 arg2 arg3"
     *
     * // Will output this
     * const output = {
     *     body: {
     *         _: ["arg1", "arg2", "arg4"],
     *     },
     *     command: ["myCommand", "arg1", "arg2"],
     * }
     * ```
     *
     * Because of this ambiguity, the decision of how to treat this behaviour is up to the
     * programmer later on. Note that this behaviour is properly handled by discord-express.
     */
    command: [command?: string, subCommandGroup?: string, subCommand?: string]
    /** Extra metadata that can be stored for any purpose */
    metadata: {[key: string]: unknown}
}

export interface MessageRequest extends BaseRequest {
    requestType: "message"
    member: GuildMember | null
    type: MessageType

    message?: Message
    interaction?: undefined
    /** What triggered the command. In this case, it's a message */
    trigger: Message
}

export interface InteractionRequest extends BaseRequest {
    requestType: "interaction"
    member: APIInteractionGuildMember | GuildMember | null
    type: InteractionType

    message?: undefined
    interaction?: CommandInteraction
    /** What triggered the command. In this case, it's a command interaction */
    trigger: CommandInteraction
}

export type Request = MessageRequest | InteractionRequest

const convertInteractionOption = (
    options: readonly CommandInteractionOption<CacheType>[],
): {[key: string]: string | number | boolean | undefined} => {
    const body: {[key: string]: string | number | boolean | undefined} = {}

    for (const option of options) {
        body[option.name] = option.value
    }

    return body
}

export const createRequest = (trigger: Message | CommandInteraction): Request => {
    const commonAttributes = {
        appId: trigger.applicationId,
        metadata: {},
        command: [] as [string?, string?, string?],
        ...pick(
            trigger,
            "channel",
            "channelId",
            "client",
            "createdAt",
            "createdTimestamp",
            "guild",
            "guildId",
            "id",
        ),
    }

    if (trigger instanceof Message) {
        return {
            ...commonAttributes,
            requestType: "message",
            author: trigger.author,
            user: trigger.author,
            member: trigger.member,

            type: trigger.type,
            message: trigger,
            interaction: undefined,
            trigger,
            body: trigger.content,
        }
    }

    const commandArray: [string, string?, string?] = [trigger.commandName]
    const subCommandGroup = trigger.options.getSubcommandGroup(false) ?? undefined
    const subCommand = trigger.options.getSubcommand(false) ?? undefined

    if (subCommandGroup) {
        commandArray.push(subCommandGroup, subCommand)
    } else {
        commandArray.push(subCommand, undefined)
    }

    return {
        ...commonAttributes,
        requestType: "interaction",
        author: trigger.user,
        user: trigger.user,
        member: trigger.member,

        type: trigger.type,
        message: undefined,
        interaction: trigger,
        trigger,
        body: convertInteractionOption(trigger.options.data),
        command: commandArray,
    }
}
