import {
    type CommandInteraction,
    Message,
    type MessageEditOptions,
    type MessageOptions,
} from "discord.js"

/* eslint-disable @typescript-eslint/no-non-null-assertion */

export abstract class BaseResponse {
    public abstract defer(): Promise<void>
    public abstract send(
        options: string | Omit<MessageOptions, "reply" | "stickers">,
    ): Promise<Message | void>
    public abstract reply(
        options: string | Omit<MessageOptions, "reply" | "stickers">,
    ): Promise<Message | void>
    public abstract replyEphemeral(
        options:
            | string
            | (Omit<MessageOptions, "reply" | "stickers"> & {fallback?: "dm" | "normal" | "skip"}),
    ): Promise<Message | void>
    public abstract edit(options: string | MessageEditOptions): Promise<Message | void>
    public abstract del(): Promise<Message | void>
}

export class MessageResponse extends BaseResponse {
    private _messages: Message[] = []

    public constructor(public readonly message: Message) {
        super()
    }

    // eslint-disable-next-line require-await
    public async defer(): Promise<void> {
        return
    }

    public async send(
        options: string | Omit<MessageOptions, "reply" | "stickers">,
    ): Promise<Message> {
        const message = await this.message.channel.send(options)

        this._messages.push(message)

        return message
    }

    public async reply(
        options: string | Omit<MessageOptions, "reply" | "stickers">,
    ): Promise<Message> {
        const message = await this.message.reply(options)

        this._messages.push(message)

        return message
    }

    public async replyEphemeral(
        options:
            | string
            | (Omit<MessageOptions, "reply" | "stickers"> & {fallback?: "dm" | "normal" | "skip"}),
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

    public async edit(options: string | MessageEditOptions): Promise<Message> {
        const message = await this._messages[this._messages.length - 1]!.edit(options)

        this._messages.push(message)

        return message
    }

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

    public async defer(): Promise<void> {
        return await this.interaction.deferReply()
    }

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

    public async reply(
        options: string | Omit<MessageOptions, "reply" | "stickers">,
    ): Promise<void> {
        await this.interaction.reply(options)

        return
    }

    public async replyEphemeral(
        options:
            | string
            | (Omit<MessageOptions, "reply" | "stickers"> & {fallback?: "dm" | "normal" | "skip"}),
    ): Promise<void> {
        await this.interaction.reply({
            ...(typeof options === "string" ? {content: options} : options),
            ephemeral: true,
        })

        return
    }

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

    public async del(): Promise<void> {
        await this.interaction.deleteReply()

        return
    }
}

export type Response = MessageResponse | InteractionResponse

export const createResponse = (trigger: Message | CommandInteraction): BaseResponse =>
    trigger instanceof Message ? new MessageResponse(trigger) : new InteractionResponse(trigger)
