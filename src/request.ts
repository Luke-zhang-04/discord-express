import {
    type Client,
    type Guild,
    type GuildMember,
    Interaction,
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
    author: User
    user: User
    channel: TextBasedChannel | null
    channelId: string | null
    client: Client | null
    createdAt: Date
    createdTimestamp: number
    guild: Guild | null
    guildId: string | null
    id: string
}

export type MessageRequest = BaseRequest & {
    requestType: "message"
    member: GuildMember | null
    type: MessageType

    message?: Message
    interaction?: undefined
    trigger: Message
}

export type InteractionRequest = BaseRequest & {
    requestType: "interaction"
    member: APIInteractionGuildMember | GuildMember | null
    type: InteractionType

    message?: undefined
    interaction?: Interaction
    trigger: Interaction
}

export type Request = MessageRequest | InteractionRequest

export const createRequest = (trigger: Message | Interaction): Request => {
    const commonAttributes = {
        appId: trigger.applicationId,
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
    }
}
