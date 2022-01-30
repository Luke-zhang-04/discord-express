import {
    type Client,
    CommandInteraction,
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

export type BaseRequest = {
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
    commandName?: string
    /** Extra metadata that can be stored for any purpose */
    metadata: {[key: string]: unknown}
}

export type MessageRequest = BaseRequest & {
    requestType: "message"
    member: GuildMember | null
    type: MessageType

    message?: Message
    interaction?: undefined
    /** What triggered the command. In this case, it's a message */
    trigger: Message
}

export type InteractionRequest = BaseRequest & {
    requestType: "interaction"
    member: APIInteractionGuildMember | GuildMember | null
    type: InteractionType

    message?: undefined
    interaction?: CommandInteraction
    /** What triggered the command. In this case, it's a command interaction */
    trigger: CommandInteraction
    commandName: string
}

export type Request = MessageRequest | InteractionRequest

export const createRequest = (trigger: Message | CommandInteraction): Request => {
    const commonAttributes = {
        appId: trigger.applicationId,
        metadata: {},
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
        body: trigger.options.data,
        commandName: trigger.commandName,
        metadata: {
            commandName: trigger.commandName,
        },
    }
}
