// https://github.com/discordjs/discord.js/discussions/6179#discussioncomment-1044212
import {
    type APIChannel,
    type APIChatInputApplicationCommandInteraction,
    type APIChatInputApplicationCommandInteractionData,
    type APIGuild,
    type APIGuildMember,
    type APIMessage,
    type APIUser,
    ApplicationCommandType,
    ChannelType,
    GuildDefaultMessageNotifications,
    GuildNSFWLevel,
    GuildPremiumTier,
    GuildSystemChannelFlags,
    InteractionType,
    MessageType,
} from "discord-api-types"
import {
    Channel,
    type ClientOptions,
    ClientUser,
    CommandInteraction,
    DMChannel,
    Guild,
    type GuildBasedChannel,
    GuildChannel,
    GuildMember,
    type GuildTextBasedChannel,
    Message,
    MessageManager,
    User,
} from "discord.js"
import {Client} from "~/src"
import crypto from "crypto"
import {randint} from "@luke-zhang-04/utils"

/* eslint-disable @typescript-eslint/ban-ts-comment */

const randomTimestamp = (): number => randint(0, Date.now())

interface ConstructorOptions {
    clientOptions?: Partial<ClientOptions>
    guildOptions?: Partial<APIGuild>
    channelOptions?: Partial<APIChannel>
    guildChannelOptions?: Partial<APIChannel>
    dmChannelOptions?: Partial<APIChannel>
    userOptions?: Partial<APIUser>
    guildMemberOptions?: Partial<APIGuildMember>
    messageOptions?: Partial<APIMessage>
    commandInteractionOptions?: Partial<APIChatInputApplicationCommandInteraction>
}

export class MockDiscord {
    private _client!: {instance: Client; data: ClientOptions}
    private _guild!: {instance: Guild; data: APIGuild}
    private _channel!: {instance: Channel; data: APIChannel}
    private _guildChannel!: {instance: GuildTextBasedChannel; data: APIChannel}
    private _dmChannel!: {instance: DMChannel; data: APIChannel}
    private _user!: {instance: User; data: APIUser}
    private _guildMember!: {instance: GuildMember; data: APIGuildMember}
    private _message!: {instance: Message; data: APIMessage}
    private _commandInteraction!: {
        instance: CommandInteraction
        data: APIChatInputApplicationCommandInteraction
    }

    constructor({
        clientOptions,
        guildOptions,
        channelOptions,
        guildChannelOptions,
        dmChannelOptions,
        userOptions,
        guildMemberOptions,
        messageOptions,
        commandInteractionOptions,
    }: ConstructorOptions = {}) {
        this.mockClient(clientOptions)
        this.mockGuild(guildOptions)
        this.mockChannel(channelOptions)
        this.mockGuildChannel(guildChannelOptions)
        this.mockDmChannel(dmChannelOptions)
        this.mockUser(userOptions)
        this.mockGuildMember(guildMemberOptions)
        this.mockMessage(messageOptions)
        this.mockCommandInteraction(commandInteractionOptions)
    }

    public get client(): Client {
        return this._client.instance
    }

    public get guild(): Guild {
        return this._guild.instance
    }

    public get apiGuild(): APIGuild {
        return this._guild.data
    }

    public get channel(): Channel {
        return this._channel.instance
    }

    public get apiChannel(): APIChannel {
        return this._channel.data
    }

    public get guildChannel(): GuildTextBasedChannel {
        return this._guildChannel.instance
    }

    public get apiGuildChannel(): APIChannel {
        return this._guildChannel.data
    }

    public get dmChannel(): DMChannel {
        return this._dmChannel.instance
    }

    public get apiDmChannel(): APIChannel {
        return this._dmChannel.data
    }

    public get user(): User {
        return this._user.instance
    }

    public get apiUser(): APIUser {
        return this._user.data
    }

    public get guildMember(): GuildMember {
        return this._guildMember.instance
    }

    public get apiGuildMember(): APIGuildMember {
        return this._guildMember.data
    }

    public get message(): Message {
        return this._message.instance
    }

    public get apiMessage(): APIMessage {
        return this._message.data
    }

    public get commandInteraction(): CommandInteraction {
        return this._commandInteraction.instance
    }

    public get apiCommandInteraction(): APIChatInputApplicationCommandInteraction {
        return this._commandInteraction.data
    }

    public mockClient(options: Partial<ClientOptions> = {}): Client {
        const data: ClientOptions = {intents: [], ...options}
        const instance = new Client(data)

        this._client = {data, instance}

        const userData: APIUser = {
            id: randomTimestamp().toString(),
            username: "user username",
            discriminator: "user#0001",
            avatar: "user avatar url",
            bot: true,
        }

        // @ts-expect-error this constructor is private
        const clientUser: ClientUser = new ClientUser(instance, userData)

        instance.user = clientUser

        return instance
    }

    public mockGuild(options: Partial<APIGuild> = {}): Guild {
        const data: APIGuild = {
            unavailable: false,
            id: randomTimestamp().toString(),
            name: "mocked js guild",
            icon: "mocked guild icon url",
            splash: "mocked guild splash url",
            region: "eu-west",
            member_count: 42,
            large: false,
            features: [],
            application_id: randomTimestamp().toString(),
            afk_timeout: 1000,
            afk_channel_id: randomTimestamp().toString(),
            system_channel_id: randomTimestamp().toString(),
            verification_level: 2,
            explicit_content_filter: 3,
            mfa_level: 8,
            joined_at: new Date("2018-01-01").getTime().toString(),
            owner_id: randomTimestamp().toString(),
            channels: [],
            roles: [],
            presences: [],
            voice_states: [],
            emojis: [],
            discovery_splash: "discovery-splash",
            default_message_notifications: GuildDefaultMessageNotifications.OnlyMentions,
            system_channel_flags: GuildSystemChannelFlags.SuppressGuildReminderNotifications,
            rules_channel_id: randomTimestamp().toString(),
            vanity_url_code: "vanity-url-code",
            description: "description",
            banner: "banner",
            premium_tier: GuildPremiumTier.None,
            preferred_locale: "en-US",
            public_updates_channel_id: randomTimestamp().toString(),
            nsfw_level: GuildNSFWLevel.Default,
            stickers: [],
            premium_progress_bar_enabled: true,
            ...options,
        }

        // @ts-expect-error this constructor is private
        const instance: Guild = new Guild(this.client, data)

        this._guild = {data, instance}

        this.client.guilds.cache.set(instance.id, instance)

        return instance
    }

    public mockChannel(options: Partial<APIChannel> = {}): Channel {
        const data: APIChannel = {
            id: randomTimestamp().toString(),
            type: ChannelType.GuildText,
            ...options,
        }
        // @ts-expect-error this constructor is private
        const instance: Channel = new Channel(this.client, data)

        this._channel = {data, instance}

        return instance
    }

    public mockGuildChannel(options: Partial<APIChannel> = {}): GuildTextBasedChannel {
        const data: APIChannel = {
            ...this._channel.data,

            id: randomTimestamp().toString(),
            name: "guild-channel",
            position: 1,
            parent_id: "123456789",
            permission_overwrites: [],
            type: ChannelType.GuildText,
            ...options,
        }

        // @ts-expect-error
        const instance: GuildTextBasedChannel = new GuildChannel(this.guild, data)

        // @ts-expect-error this constructor is private
        instance.messages = new MessageManager(instance)

        this._guildChannel = {data, instance}

        this.guild.channels.cache.set(instance.id, instance as GuildBasedChannel)

        return instance
    }

    public mockDmChannel(options: Partial<APIChannel> = {}): DMChannel {
        const data: APIChannel = {
            id: randomTimestamp().toString(),
            topic: "topic",
            nsfw: false,
            last_message_id: "123456789",
            last_pin_timestamp: new Date("2019-01-01").getTime().toString(),
            rate_limit_per_user: 0,
            type: ChannelType.DM,
            ...options,
        }

        // @ts-expect-error this constructor is private
        const instance: DMChannel = new DMChannel(this.client, data)

        this._dmChannel = {data, instance}

        this.client.channels.cache.set(instance.id, instance)

        return instance
    }

    public mockUser(options: Partial<APIUser> = {}): User {
        const data: APIUser = {
            id: randomTimestamp().toString(),
            username: "user username",
            discriminator: "user#0000",
            avatar: "user avatar url",
            bot: false,
            ...options,
        }

        // @ts-expect-error this constructor is private
        const instance: User = new User(this.client, data)

        this._user = {data, instance}

        return instance
    }

    public mockGuildMember(options: Partial<APIGuildMember> = {}): GuildMember {
        const data: APIGuildMember = {
            deaf: false,
            mute: false,
            nick: "nick",
            joined_at: new Date("2020-01-01").getTime().toString(),
            user: this._user as unknown as APIUser,
            roles: [],
            ...options,
        }

        // @ts-expect-error this constructor is private
        const instance: GuildMember = new GuildMember(this.client, data, this.guild)

        this._guildMember = {data, instance}

        return instance
    }

    public mockMessage(options: Partial<APIMessage> = {}): Message {
        const data: APIMessage = {
            channel_id: this.guildChannel.id,
            id: randomTimestamp().toString(),
            type: MessageType.Default,
            content: "this is the message content",
            author: this._user.data,
            webhook_id: undefined,
            member: this._guildMember.data,
            pinned: false,
            tts: false,
            nonce: "nonce (HAHAHAHA)",
            embeds: [],
            attachments: [],
            edited_timestamp: null,
            reactions: [],
            mentions: [],
            mention_roles: [],
            mention_everyone: true,
            timestamp: randomTimestamp().toString(),
            ...options,
        }

        // @ts-expect-error this constructor is private
        const instance: Message = new Message(this.client, data)

        this._message = {data, instance}

        if (data.channel_id === this.guildChannel.id) {
            this.guildChannel.messages.cache.set(instance.id, instance)

            instance.guildId = this.guild.id
        } else if (data.channel_id === this.dmChannel.id) {
            this.dmChannel.messages.cache.set(instance.id, instance)
        }

        return instance
    }

    public mockCommandInteraction(
        options: Partial<APIChatInputApplicationCommandInteraction> = {},
        _data: Partial<APIChatInputApplicationCommandInteractionData> = {},
    ): CommandInteraction {
        const data: APIChatInputApplicationCommandInteraction = {
            id: randomTimestamp().toString(),
            application_id: randomTimestamp().toString(),
            type: InteractionType.ApplicationCommand,
            guild_id: this.guild.id,
            channel_id: this.guildChannel.id,
            member: {
                ...this._guildMember.data,
                permissions: "",
                user: this._user.data,
            },
            user: this._user.data,
            token: crypto.randomBytes(32).toString("utf-8"),
            version: 1,
            data: {
                id: randomTimestamp().toString(),
                name: "Command Interaction Data Name",
                type: ApplicationCommandType.ChatInput,
                options: [],
                ..._data,
            },
            ...options,
        }

        // @ts-expect-error
        const instance: CommandInteraction = new CommandInteraction(this.client, data)

        this._commandInteraction = {data, instance}

        return instance
    }
}

export default MockDiscord
