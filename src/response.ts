import {
    type CommandInteraction,
    Message,
    type MessageEditOptions,
    type MessageOptions,
} from "discord.js"

interface EphemeralMessageOptions extends Omit<MessageOptions, "reply" | "stickers"> {
    /**
     * Fallback in case an ephemeral reply is not possible
     *
     * - `dm`: reply via DM
     * - `normal`: reply as a normal message
     * - `skip`: don't reply at all
     *
     * @default 'normal'
     */
    fallback?: "dm" | "normal" | "skip"
}

/* eslint-disable @typescript-eslint/no-non-null-assertion */

export abstract class BaseResponse {
    /**
     * Defer the reply. Only applicable to slash commands, and is needed if the response will take
     * more than 3 seconds.
     *
     * @see https://discordjs.guide/interactions/replying-to-slash-commands.html#responding-to-a-command
     */
    public abstract defer(): Promise<void>

    /** Send a message to the channel of the request */
    public abstract send(
        options: string | Omit<MessageOptions, "reply" | "stickers">,
    ): Promise<Message | void>

    /**
     * Reply to the trigger. If this is an interaction, at least one of these is required for the
     * interaction not to show a "failed" status.
     */
    public abstract reply(
        options: string | Omit<MessageOptions, "reply" | "stickers">,
    ): Promise<Message | void>

    /**
     * If the trigger is an interaction, reply ephemerally (a temporary, dismissable message only
     * the requester can see). Otherwise, reply using the specified fallback.
     */
    public abstract replyEphemeral(
        options: string | EphemeralMessageOptions,
    ): Promise<Message | void>

    /** Edit the latest response. */
    public abstract edit(options: string | MessageEditOptions): Promise<Message | void>

    /** Delete the latest response. */
    public abstract del(): Promise<Message | void>
}

export class MessageResponse extends BaseResponse {
    private _messages: Message[] = []

    public constructor(public readonly message: Message) {
        super()
    }

    /** No-op: only applicable to interaction commands */
    public defer(): Promise<void> {
        return Promise.resolve()
    }

    /** Send a message to the channel of the request */
    public async send(
        options: string | Omit<MessageOptions, "reply" | "stickers">,
    ): Promise<Message> {
        const message = await this.message.channel.send(options)

        this._messages.push(message)

        return message
    }

    /** Reply to the message */
    public async reply(
        options: string | Omit<MessageOptions, "reply" | "stickers">,
    ): Promise<Message> {
        const message = await this.message.reply(options)

        this._messages.push(message)

        return message
    }

    /** Reply using the specified fallback. */
    public async replyEphemeral(
        options: string | EphemeralMessageOptions,
    ): Promise<Message | undefined> {
        if (typeof options === "string") {
            return await this.message.reply(options)
        }

        let message: Message

        switch (options.fallback) {
            case "dm":
                message = await this.message.author.send(options)

                break
            case "skip":
                return
            default:
                message = await this.message.reply(options)
        }

        this._messages.push(message)

        return message
    }

    /** Edit the latest message response */
    public async edit(options: string | MessageEditOptions): Promise<Message> {
        const message = await this._messages[this._messages.length - 1]!.edit(options)

        this._messages.push(message)

        return message
    }

    /** Delete the latest message response */
    public async del(): Promise<Message | undefined> {
        const message = this._messages[this._messages.length - 1]!

        this._messages.splice(this._messages.length - 1, 1)

        return await message.delete()
    }
}

export class InteractionResponse extends BaseResponse {
    public constructor(public readonly interaction: CommandInteraction) {
        super()
    }

    /**
     * Defer the reply. This is needed if the response will take more than 3 seconds.
     *
     * @see https://discordjs.guide/interactions/replying-to-slash-commands.html#responding-to-a-command
     */
    public async defer(): Promise<void> {
        return await this.interaction.deferReply()
    }

    /** Send a message to the channel of the request */
    public async send(
        options: string | Omit<MessageOptions, "reply" | "stickers">,
    ): Promise<void> {
        if (this.interaction.channel) {
            await this.interaction.channel.send(options)
        } else {
            await this.interaction.reply(options)
        }

        return
    }

    /**
     * Reply to the interaction. At least one of these is required for the interaction not to show
     * a "failed" status.
     */
    public async reply(
        options: string | Omit<MessageOptions, "reply" | "stickers">,
    ): Promise<void> {
        await this.interaction.reply(options)

        return
    }

    /** Reply ephemerally (a temporary, dismissable message only the requester can see). */
    public async replyEphemeral(options: string | EphemeralMessageOptions): Promise<void> {
        await this.interaction.reply({
            ...(typeof options === "string" ? {content: options} : options),
            ephemeral: true,
        })

        return
    }

    /** Delete the latest response. */
    public async edit(options: string | MessageEditOptions): Promise<void> {
        await this.interaction.editReply(
            typeof options === "string"
                ? options
                : {
                      ...options,
                      embeds: options.embeds ?? undefined,
                  },
        )

        return
    }

    /** Delete the latest response. */
    public async del(): Promise<void> {
        await this.interaction.deleteReply()

        return
    }
}

export type Response = MessageResponse | InteractionResponse

export const createResponse = (
    trigger: Message | CommandInteraction,
): MessageResponse | InteractionResponse =>
    trigger instanceof Message ? new MessageResponse(trigger) : new InteractionResponse(trigger)
