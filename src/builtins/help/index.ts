import * as generators from "./generators"
import * as zod from "zod"
import {
    type BaseMessageComponentOptions,
    type MessageActionRow,
    type MessageActionRowOptions,
    MessageEmbed,
    type MessageEmbedOptions,
} from "discord.js"
import {
    Command,
    Commands,
    Subcommand,
    SubcommandGroup,
    isCommand,
    isSubcommand,
    isSubcommandGroup,
} from "../../commands/types"
import Case from "case"
import {CommandArray} from "../../client"
import {type DiscordExpressHandler} from "../.."

const slashCommandHelpShema = zod.object({
    command: zod.string().optional(),
})

const messageCommandHelpShema = zod.object({
    _: zod.array(zod.string()),
})

export interface HelpOptions {
    /** Commands to give help for. Only supports discord-express command object */
    commands: Commands

    /** Where the help message should be sent if not ephemeral */
    fallbackToDMs?: boolean

    /** Colour of the embed */
    color?: MessageEmbedOptions["color"]

    /** URL of the embed */
    url?: MessageEmbedOptions["url"]

    /** Thumbnail URL of the embed */
    thumbnail?: MessageEmbedOptions["thumbnail"]

    /** Description of the embed for the top level help message */
    description?: MessageEmbedOptions["description"]

    /** Footer text of the embed */
    footerText?: string

    /** Title of the help message */
    title?: string

    /** Message components to add to the help message */
    components?: (
        | MessageActionRow
        | (Required<BaseMessageComponentOptions> & MessageActionRowOptions)
    )[]

    /** Custom embed generator to show top-level help */
    generateTopLevelHelp?: (commands: Commands, defaultData: MessageEmbedOptions) => MessageEmbed

    /** Custom embed generator to show help for a specific command */
    generateCommandHelp?: (command: Command, defaultData: MessageEmbedOptions) => MessageEmbed

    /** Custom embed generator to show help for a specific subcommand */
    generateSubcommandHelp?: (
        subcommand: Subcommand,
        defaultData: MessageEmbedOptions,
    ) => MessageEmbed

    /** Custom embed generator to show help for a specific subcommand group */
    generateSubcommandGroupHelp?: (
        subcommandGroup: SubcommandGroup,
        defaultData: MessageEmbedOptions,
    ) => MessageEmbed
}

/* eslint-disable max-statements */

/**
 * Help is a built in help command you can use
 *
 * @example
 *
 * ```ts
 * import {Client, createCommands, builtin} from "discord-express"
 *
 * const commands = createCommands({
 *     // Your commands
 *     help: builtin.help.command,
 * })
 *
 * const client = new Client({
 *     intents: ["GUILD_MESSAGES", "GUILDS"],
 *     authToken: process.env.TOKEN,
 * })
 *
 * client.registerCommands(commands, process.env.CLIENT_ID)
 * client.initExpress()
 *
 * client.command("help", builtin.help.handler({commands}))
 * ```
 */
export const help =
    ({
        commands,
        fallbackToDMs = false,
        footerText,
        title,
        components = [],
        generateTopLevelHelp = generators.generateTopLevelHelp,
        generateCommandHelp = generators.generateCommandHelp,
        generateSubcommandHelp = generators.generateSubcommandHelp,
        generateSubcommandGroupHelp = generators.generateSubcommandGroupHelp,
        ...rest
    }: HelpOptions): DiscordExpressHandler =>
    async (request, response) => {
        let specifier: CommandArray | undefined

        if (request.requestType === "interaction") {
            specifier = slashCommandHelpShema.parse(request.body).command?.split(" ") as
                | CommandArray
                | undefined
        } else {
            const input = messageCommandHelpShema.parse(request.body)._

            specifier = input.length === 0 ? undefined : (input as CommandArray)
        }

        const avatarURL = request.client?.user?.avatarURL({size: 128, dynamic: true}) ?? undefined
        const username = request.client?.user?.username ?? "bot"

        const defaultEmbedData: MessageEmbedOptions = {
            description: `Run \`${
                typeof request.metadata.prefix === "string"
                    ? `${request.metadata.prefix}help <specifier>`
                    : "/help command: specifier"
            }\` to get help on a specific command`,
            ...rest,
            title:
                title ||
                (specifier ? `Help for \`${specifier.join(" ")}\`` : `Help for \`${username}\``),
            timestamp: new Date(),
            footer: {
                text: footerText,
                iconURL: avatarURL,
            },
            author: {
                name: username,
                iconURL: avatarURL,
                url: rest.url,
            },
        }
        const fallback = fallbackToDMs ? "dm" : "normal"

        const defaultSendData = {
            fallback,
            components,
        } as const

        if (specifier === undefined) {
            return await response.replyEphemeral({
                ...defaultSendData,
                embeds: [generateTopLevelHelp(commands, defaultEmbedData)],
            })
        } else if (specifier[2] !== undefined && specifier[1] !== undefined) {
            const [subcommandGroupName, subcommandName, commandName] = specifier

            const subcommandGroup =
                commands[subcommandGroupName] ?? commands[Case.camel(subcommandGroupName)]

            if (!isSubcommandGroup(subcommandGroup)) {
                return await response.replyEphemeral({
                    fallback,
                    content: `Error: \`${subcommandGroupName}\` is not a subcommand group`,
                    embeds: [
                        generateTopLevelHelp(commands, {
                            ...defaultEmbedData,
                            title: title || `Help for \`${username}\``,
                        }),
                    ],
                })
            }

            const subcommand =
                subcommandGroup.subcommands[subcommandName] ??
                subcommandGroup.subcommands[Case.camel(subcommandName)]

            if (!isSubcommand(subcommand)) {
                return await response.replyEphemeral({
                    fallback,
                    content: `Error: \`${subcommandName}\` is not a subcommand`,
                    embeds: [
                        generateSubcommandGroupHelp(subcommandGroup, {
                            ...defaultEmbedData,
                            title: title || `Help for \`${subcommandGroupName}\``,
                        }),
                    ],
                })
            }

            const command =
                subcommand.commands[commandName] ?? subcommand.commands[Case.camel(commandName)]

            if (!isCommand(command)) {
                return await response.replyEphemeral({
                    fallback,
                    content: `Error: \`${commandName}\` is not a command`,
                    embeds: [
                        generateSubcommandHelp(subcommand, {
                            ...defaultEmbedData,
                            title:
                                title || `Help for \`${subcommandGroupName} ${subcommandName}\``,
                        }),
                    ],
                })
            }

            return await response.replyEphemeral({
                fallback,
                embeds: [generateCommandHelp(command, defaultEmbedData)],
            })
        } else if (specifier[1] !== undefined) {
            const [subcommandName, commandName] = specifier

            const subcommand = commands[subcommandName] ?? commands[Case.camel(subcommandName)]

            if (isSubcommand(subcommand)) {
                const command =
                    subcommand.commands[commandName] ??
                    subcommand.commands[Case.camel(commandName)]

                if (isCommand(command)) {
                    return await response.replyEphemeral({
                        fallback,
                        embeds: [generateCommandHelp(command, defaultEmbedData)],
                    })
                }

                return await response.replyEphemeral({
                    fallback,
                    content: `\`${commandName}\` is not a command`,
                    embeds: [
                        generateTopLevelHelp(commands, {
                            ...defaultEmbedData,
                            title: title || `Help for \`${username}\``,
                        }),
                    ],
                })
            } else if (isSubcommandGroup(subcommand)) {
                const subcommandGroup = subcommand
                const subcommand1 =
                    subcommandGroup.subcommands[commandName] ??
                    subcommandGroup.subcommands[Case.camel(commandName)]

                if (isSubcommand(subcommand1)) {
                    return await response.replyEphemeral({
                        fallback,
                        embeds: [generateSubcommandHelp(subcommand1, defaultEmbedData)],
                    })
                }

                return await response.replyEphemeral({
                    fallback,
                    content: `Error: \`${commandName}\` is not a subcommand`,
                    embeds: [
                        generateSubcommandGroupHelp(subcommandGroup, {
                            ...defaultEmbedData,
                            title: title || `Help for \`${subcommandName}\``,
                        }),
                    ],
                })
            }

            return await response.replyEphemeral({
                fallback,
                content: `Error: \`${subcommandName}\` was not found`,
                embeds: [
                    generateTopLevelHelp(commands, {
                        ...defaultEmbedData,
                        title: title || `Help for \`${username}\``,
                    }),
                ],
            })
        }

        const entry = commands[specifier[0]] ?? commands[Case.camel(specifier[0])]

        if (isCommand(entry)) {
            return await response.replyEphemeral({
                fallback,
                embeds: [generateCommandHelp(entry, defaultEmbedData)],
            })
        } else if (isSubcommand(entry)) {
            return await response.replyEphemeral({
                fallback,
                embeds: [generateSubcommandHelp(entry, defaultEmbedData)],
            })
        } else if (isSubcommandGroup(entry)) {
            return await response.replyEphemeral({
                fallback,
                embeds: [generateSubcommandGroupHelp(entry, defaultEmbedData)],
            })
        }

        return await response.replyEphemeral({
            fallback,
            content: `Error: \`${specifier[0]}\` was not found`,
            embeds: [
                generateTopLevelHelp(commands, {
                    ...defaultEmbedData,
                    title: title || `Help for \`${username}\``,
                }),
            ],
        })
    }

export const command: Command = {
    description: "Display help message",
    options: {
        command: {
            description:
                "Specify the command, subcommand, or subcommand group to show help for, space separated.",
            type: "string",
        },
    },
}

export default {
    command,
    handler: help,
}
