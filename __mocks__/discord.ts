// https://github.com/discordjs/discord.js/discussions/6179#discussioncomment-1044212
import type {APIMessage, APIUser, APIGuildMember, APIChannel, APIGuild} from "discord-api-types"
import {
    Client,
    Guild,
    Channel,
    GuildChannel,
    TextChannel,
    User,
    GuildMember,
    Message,
    ClientOptions,
    ClientUser,
} from "discord.js"
import {
    ChannelType,
    GuildDefaultMessageNotifications,
    GuildSystemChannelFlags,
    GuildPremiumTier,
    GuildNSFWLevel,
    MessageType,
} from "discord-api-types"

interface ConstructorOptions {
    clientOptions?: Partial<ClientOptions>
    guildOptions?: Partial<APIGuild>
    channelOptions?: Partial<APIChannel>
    guildChannelOptions?: Partial<APIChannel>
    textChannelOptions?: Partial<APIChannel>
    userOptions?: Partial<APIUser>
    guildMemberOptions?: Partial<APIGuildMember>
    messageOptions?: Partial<APIMessage>
}

export default class MockDiscord {
    private _client!: {instance: Client; data: ClientOptions}
    private _guild!: {instance: Guild; data: APIGuild}
    private _channel!: {instance: Channel; data: APIChannel}
    private _guildChannel!: {instance: GuildChannel; data: APIChannel}
    private _textChannel!: {instance: TextChannel; data: APIChannel}
    private _user!: {instance: User; data: APIUser}
    private _guildMember!: {instance: GuildMember; data: APIGuildMember}
    private _message!: {instance: Message; data: APIMessage}

    constructor({
        clientOptions,
        guildOptions,
        channelOptions,
        guildChannelOptions,
        textChannelOptions,
        userOptions,
        guildMemberOptions,
        messageOptions,
    }: ConstructorOptions = {}) {
        this.mockClient(clientOptions)
        this.mockGuild(guildOptions)
        this.mockChannel(channelOptions)
        this.mockGuildChannel(guildChannelOptions)
        this.mockTextChannel(textChannelOptions)
        this.mockUser(userOptions)
        this.mockGuildMember(guildMemberOptions)
        // @ts-expect-error
        this.guild.members._add(this.guildMember)
        this.mockMessage(messageOptions)
    }

    public get client(): Client {
        return this._client.instance
    }

    public get guild(): Guild {
        return this._guild.instance
    }

    public get channel(): Channel {
        return this._channel.instance
    }

    public get guildChannel(): GuildChannel {
        return this._guildChannel.instance
    }

    public get textChannel(): TextChannel {
        return this._textChannel.instance
    }

    public get user(): User {
        return this._user.instance
    }

    public get guildMember(): GuildMember {
        return this._guildMember.instance
    }

    public get message(): Message {
        return this._message.instance
    }

    public mockClient(options: Partial<ClientOptions> = {}): Client {
        const data: ClientOptions = {intents: [], ...options}
        const instance = new Client(data)

        this._client = {data, instance}

        const userData: APIUser = {
            id: Date.now().toString(),
            username: "user username",
            discriminator: "user#0001",
            avatar: "user avatar url",
            bot: true,
        }

        // @ts-expect-error
        const clientUser: ClientUser = new ClientUser(instance, userData)

        instance.user = clientUser

        return instance
    }

    public mockGuild(options: Partial<APIGuild> = {}): Guild {
        const data: APIGuild = {
            unavailable: false,
            id: Date.now().toString(),
            name: "mocked js guild",
            icon: "mocked guild icon url",
            splash: "mocked guild splash url",
            region: "eu-west",
            member_count: 42,
            large: false,
            features: [],
            application_id: Date.now().toString(),
            afk_timeout: 1000,
            afk_channel_id: Date.now().toString(),
            system_channel_id: Date.now().toString(),
            verification_level: 2,
            explicit_content_filter: 3,
            mfa_level: 8,
            joined_at: new Date("2018-01-01").getTime().toString(),
            owner_id: Date.now().toString(),
            channels: [],
            roles: [],
            presences: [],
            voice_states: [],
            emojis: [],
            discovery_splash: "discovery-splash",
            default_message_notifications: GuildDefaultMessageNotifications.OnlyMentions,
            system_channel_flags: GuildSystemChannelFlags.SuppressGuildReminderNotifications,
            rules_channel_id: Date.now().toString(),
            vanity_url_code: "vanity-url-code",
            description: "description",
            banner: "banner",
            premium_tier: GuildPremiumTier.None,
            preferred_locale: "en-US",
            public_updates_channel_id: Date.now().toString(),
            nsfw_level: GuildNSFWLevel.Default,
            stickers: [],
            premium_progress_bar_enabled: true,
            ...options,
        }

        // @ts-expect-error
        const instance: Guild = new Guild(this.client, data)

        this._guild = {data, instance}

        return instance
    }

    public mockChannel(options: Partial<APIChannel> = {}): Channel {
        const data: APIChannel = {
            id: Date.now().toString(),
            type: ChannelType.GuildText,
            ...options,
        }
        // @ts-expect-error
        const instance: Channel = new Channel(this.client, data)

        this._channel = {data, instance}

        return instance
    }

    public mockGuildChannel(options: Partial<APIChannel> = {}): GuildChannel {
        const data: APIChannel = {
            ...this._channel.data,

            name: "guild-channel",
            position: 1,
            parent_id: "123456789",
            permission_overwrites: [],
            type: ChannelType.GuildText,
            ...options,
        }

        // @ts-expect-error
        const instance: GuildChannel = new GuildChannel(this.guild, data)

        this._guildChannel = {data, instance}

        return instance
    }

    public mockTextChannel(options: Partial<APIChannel> = {}): TextChannel {
        const data: APIChannel = {
            ...this._guildChannel.data,

            topic: "topic",
            nsfw: false,
            last_message_id: "123456789",
            last_pin_timestamp: new Date("2019-01-01").getTime().toString(),
            rate_limit_per_user: 0,
            type: ChannelType.GuildText,
            ...options,
        }

        // @ts-expect-error
        const instance: TextChannel = new TextChannel(this.guild, data)

        this._textChannel = {data, instance}

        return instance
    }

    public mockUser(options: Partial<APIUser> = {}): User {
        const data: APIUser = {
            id: Date.now().toString(),
            username: "user username",
            discriminator: "user#0000",
            avatar: "user avatar url",
            bot: false,
            ...options,
        }

        // @ts-expect-error
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

        // @ts-expect-error
        const instance: GuildMember = new GuildMember(this.client, data, this.guild)

        this._guildMember = {data, instance}

        return instance
    }

    public mockMessage(options: Partial<APIMessage> = {}): Message {
        const data: APIMessage = {
            channel_id: this._textChannel.data.id,
            id: Date.now().toString(),
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
            timestamp: Date.now().toString(),
            ...options,
        }

        // @ts-expect-error
        const instance: Message = new Message(this.client, data)

        this._message = {data, instance}

        return instance
    }
}
