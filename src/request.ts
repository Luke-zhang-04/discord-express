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

const convertInteractionOption = (
    options: readonly CommandInteractionOption<CacheType>[],
): {[key: string]: string | number | boolean | undefined} => {
    const body: {[key: string]: string | number | boolean | undefined} = {}

    for (const option of options) {
        body[option.name] = option.value
    }

    return body
}

export abstract class BaseRequest<Body = unknown> {
    public readonly appId: string | null
    public readonly channel: TextBasedChannel | null
    public readonly channelId: string | null
    public readonly client: Client | null
    public readonly createdAt: Date
    public readonly createdTimestamp: number
    public readonly guild: Guild | null
    public readonly guildId: string | null
    public readonly id: string
    public readonly startAt = new Date()

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
    public command: [command?: string, subcommandGroup?: string, subcommand?: string] = []

    /** Extra metadata that can be stored for any purpose */
    public metadata: {[key: string]: unknown} = {}

    /**
     * User who triggered the request
     *
     * @alias author
     */
    public abstract readonly user: User
    public abstract readonly requestType: "message" | "interaction"
    public abstract readonly member: GuildMember | APIInteractionGuildMember | null
    public abstract readonly type: MessageType | InteractionType
    public abstract readonly message?: Message
    public abstract readonly interaction?: CommandInteraction
    public abstract readonly trigger: Message | CommandInteraction

    /** Arguments and options passed from the command */
    public abstract body: Body

    public constructor(trigger: Message | CommandInteraction) {
        this.appId = trigger.applicationId
        this.channel = trigger.channel
        this.channelId = trigger.channelId
        this.client = trigger.client
        this.createdAt = trigger.createdAt
        this.createdTimestamp = trigger.createdTimestamp
        this.guild = trigger.guild
        this.guildId = trigger.guildId
        this.id = trigger.id
    }

    /**
     * Author of the request
     *
     * @alias user
     */
    public get author(): User {
        return this.user
    }
}

export class MessageRequest<Body = unknown> extends BaseRequest<Body> {
    /**
     * User who triggered the request
     *
     * @alias author
     */
    public override readonly user: User
    public override readonly requestType = "message" as const
    public override readonly member: GuildMember | null
    public override readonly type: MessageType

    public override readonly interaction?: undefined = undefined
    /** What triggered the command. In this case, it's a message */
    public override readonly trigger: Message
    public override body: Body

    public readonly isMessageRequest = true
    public readonly isInteractionRequest = false

    public constructor(public override readonly message: Message) {
        super(message)

        this.user = message.author
        this.member = message.member

        this.type = message.type
        this.trigger = message
        this.body = message.content as unknown as Body
    }
}

export class InteractionRequest<Body = unknown> extends BaseRequest<Body> {
    /**
     * User who triggered the request
     *
     * @alias author
     */
    public override readonly user: User
    public override readonly requestType = "interaction" as const
    public override readonly member: APIInteractionGuildMember | GuildMember | null
    public override readonly type: InteractionType

    public override readonly message?: undefined = undefined
    /** What triggered the command. In this case, it's a command interaction */
    public override readonly trigger: CommandInteraction
    public override body: Body

    public readonly isMessageRequest = false
    public readonly isInteractionRequest = true

    public constructor(public override readonly interaction: CommandInteraction) {
        super(interaction)

        this.user = interaction.user
        this.member = interaction.member

        this.type = interaction.type
        this.trigger = interaction
        this.body = convertInteractionOption(interaction.options.data) as unknown as Body

        const commandArray: [string, string?, string?] = [interaction.commandName]
        const subcommandGroup = interaction.options.getSubcommandGroup(false) ?? undefined
        const subcommand = interaction.options.getSubcommand(false) ?? undefined

        if (subcommandGroup) {
            commandArray.push(subcommandGroup, subcommand)
        } else {
            commandArray.push(subcommand, undefined)
        }

        this.command = commandArray
    }
}

// export {BaseRequest as Request}
export type Request = MessageRequest | InteractionRequest

export const createRequest = (
    trigger: Message | CommandInteraction,
): MessageRequest | InteractionRequest =>
    trigger instanceof Message ? new MessageRequest(trigger) : new InteractionRequest(trigger)
