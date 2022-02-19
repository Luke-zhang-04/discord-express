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
import {type DiscordExpressHandler, type Request} from "../.."
import Case from "case"
import {CommandArray} from "../../client"
import {objectEntries} from "@luke-zhang-04/utils"

const slashCommandHelpShema = zod.object({
    command: zod.string().optional(),
})

const messageCommandHelpShema = zod.object({
    _: zod.array(zod.string()),
})

export const defaultMatcher = <T>(
    obj: {[key: string]: T},
    key: string,
): [trueKey: string, value?: T] => {
    let trueKey = key
    let val = obj[key]

    if (val === undefined) {
        trueKey = Case.camel(key)
        val = obj[Case.camel(key)]
    }

    if (val === undefined) {
        for (const [key2, val] of objectEntries(obj)) {
            const lowercaseKey2 = key2.toLowerCase()

            if (lowercaseKey2 === key) {
                return [key2, val]
            }
        }
    }

    return val === undefined ? [key] : [trueKey, val]
}

/**
 * Matcher type that takes an object and a key, and returns a key value pair if the matcher finds a
 * match. Can be used to implement a fuzzy search
 *
 * @returns A tuple with the real key of the item, and the value
 */
export type Matcher = typeof defaultMatcher

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
    generateTopLevelHelp?: (
        commands: Commands,
        request: Request,
        defaultData: MessageEmbedOptions,
    ) => MessageEmbed

    /** Custom embed generator to show help for a specific command */
    generateCommandHelp?: (
        commandArray: [string, string?, string?],
        command: Command,
        request: Request,
        defaultData: MessageEmbedOptions,
    ) => MessageEmbed

    /** Custom embed generator to show help for a specific subcommand */
    generateSubcommandHelp?: (
        commandArray: [string, string?],
        subcommand: Subcommand,
        request: Request,
        defaultData: MessageEmbedOptions,
    ) => MessageEmbed

    /** Custom embed generator to show help for a specific subcommand group */
    generateSubcommandGroupHelp?: (
        commandArray: [string],
        subcommandGroup: SubcommandGroup,
        request: Request,
        defaultData: MessageEmbedOptions,
    ) => MessageEmbed

    /**
     * Custom command matcher. The default matcher accounts for direct matches, camelCase matches,
     * and uncapitalized matches.
     */
    matcher?: Matcher
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
        matcher = defaultMatcher,
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
                embeds: [generateTopLevelHelp(commands, request, defaultEmbedData)],
            })
        } else if (specifier[2] !== undefined && specifier[1] !== undefined) {
            const [subcommandGroupName, subcommandGroup] = matcher(commands, specifier[0])

            if (!isSubcommandGroup(subcommandGroup)) {
                return await response.replyEphemeral({
                    fallback,
                    content: `Error: \`${subcommandGroupName}\` is not a subcommand group`,
                    embeds: [
                        generateTopLevelHelp(commands, request, {
                            ...defaultEmbedData,
                            title: title || `Help for \`${username}\``,
                        }),
                    ],
                })
            }

            const [subcommandName, subcommand] = matcher(subcommandGroup.subcommands, specifier[1])

            if (!isSubcommand(subcommand)) {
                return await response.replyEphemeral({
                    fallback,
                    content: `Error: \`${subcommandName}\` is not a subcommand`,
                    embeds: [
                        generateSubcommandGroupHelp(
                            [subcommandGroupName],
                            subcommandGroup,
                            request,
                            {
                                ...defaultEmbedData,
                                title: title || `Help for \`${subcommandGroupName}\``,
                            },
                        ),
                    ],
                })
            }

            const [commandName, command] = matcher(subcommand.commands, specifier[2])

            if (!isCommand(command)) {
                return await response.replyEphemeral({
                    fallback,
                    content: `Error: \`${commandName}\` is not a command`,
                    embeds: [
                        generateSubcommandHelp(
                            [subcommandName, commandName],
                            subcommand,
                            request,
                            {
                                ...defaultEmbedData,
                                title:
                                    title ||
                                    `Help for \`${subcommandGroupName} ${subcommandName}\``,
                            },
                        ),
                    ],
                })
            }

            return await response.replyEphemeral({
                fallback,
                embeds: [
                    generateCommandHelp(
                        [subcommandGroupName, subcommandName, commandName],
                        command,
                        request,
                        defaultEmbedData,
                    ),
                ],
            })
        } else if (specifier[1] !== undefined) {
            // const [subcommandName, commandName] = specifier
            const [subcommandName, subcommand] = matcher(commands, specifier[0])

            if (isSubcommand(subcommand)) {
                const [commandName, command] = matcher(subcommand.commands, specifier[1])

                if (isCommand(command)) {
                    return await response.replyEphemeral({
                        fallback,
                        embeds: [
                            generateCommandHelp(
                                [subcommandName, commandName],
                                command,
                                request,
                                defaultEmbedData,
                            ),
                        ],
                    })
                }

                return await response.replyEphemeral({
                    fallback,
                    content: `\`${commandName}\` is not a command`,
                    embeds: [
                        generateTopLevelHelp(commands, request, {
                            ...defaultEmbedData,
                            title: title || `Help for \`${username}\``,
                        }),
                    ],
                })
            } else if (isSubcommandGroup(subcommand)) {
                const subcommandGroup = subcommand
                const [commandName, subcommand1] = matcher(
                    subcommandGroup.subcommands,
                    specifier[1],
                )

                if (isSubcommand(subcommand1)) {
                    return await response.replyEphemeral({
                        fallback,
                        embeds: [
                            generateSubcommandHelp(
                                [subcommandName, commandName],
                                subcommand1,
                                request,
                                defaultEmbedData,
                            ),
                        ],
                    })
                }

                return await response.replyEphemeral({
                    fallback,
                    content: `Error: \`${commandName}\` is not a subcommand`,
                    embeds: [
                        generateSubcommandGroupHelp([subcommandName], subcommandGroup, request, {
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
                    generateTopLevelHelp(commands, request, {
                        ...defaultEmbedData,
                        title: title || `Help for \`${username}\``,
                    }),
                ],
            })
        }

        const [trueKey, entry] = matcher(commands, specifier[0])

        if (isCommand(entry)) {
            return await response.replyEphemeral({
                fallback,
                embeds: [generateCommandHelp([trueKey], entry, request, defaultEmbedData)],
            })
        } else if (isSubcommand(entry)) {
            return await response.replyEphemeral({
                fallback,
                embeds: [generateSubcommandHelp([trueKey], entry, request, defaultEmbedData)],
            })
        } else if (isSubcommandGroup(entry)) {
            return await response.replyEphemeral({
                fallback,
                embeds: [generateSubcommandGroupHelp([trueKey], entry, request, defaultEmbedData)],
            })
        }

        return await response.replyEphemeral({
            fallback,
            content: `Error: \`${specifier[0]}\` was not found`,
            embeds: [
                generateTopLevelHelp(commands, request, {
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
