import {
    type Command,
    type Commands,
    type Subcommand,
    type SubcommandGroup,
    isSubcommand,
    isSubcommandGroup,
} from "../../commands/types"
import {MessageEmbed, type MessageEmbedOptions} from "discord.js"
import Case from "case"
import type {Request} from "../.."

const changeCase = (command: string, {requestType}: Request): string =>
    requestType === "message" ? command : Case.kebab(command)

const mapChangeCase = (names: string | (string | undefined)[], request: Request): string =>
    typeof names === "string"
        ? changeCase(names, request)
        : names
              .filter((val): val is string => Boolean(val))
              .map((name) => changeCase(name, request))
              .join(" ")

const stringifyCommands = (
    names: string | (string | undefined)[],
    prefix: string,
    request: Request,
    commands: {
        [commandName: string]: Command
    },
): string =>
    Object.entries(commands)
        .map(
            ([commandName, command]) =>
                `\`${prefix}${mapChangeCase(names, request)} ${changeCase(
                    commandName,
                    request,
                )}\` - ${command.description}`,
        )
        .join("\n")

const stringifySubcommands = (
    subcommandGroupName: string,
    prefix: string,
    request: Request,
    subcommands: {
        [subcommandName: string]: Subcommand
    },
): string =>
    Object.entries(subcommands)
        .map(([subcommandName, subcommand]) =>
            Object.entries(subcommand.commands)
                .map(
                    ([commandName, command]) =>
                        `\`${prefix}${changeCase(subcommandGroupName, request)} ${changeCase(
                            subcommandName,
                            request,
                        )} ${changeCase(commandName, request)}\` - ${command.description}`,
                )
                .join("\n"),
        )
        .join("\n")

export const generateTopLevelHelp = (
    commands: Commands,
    request: Request,
    defaultData: MessageEmbedOptions,
): MessageEmbed => {
    const prefix = typeof request.metadata.prefix === "string" ? request.metadata.prefix : "/"

    return new MessageEmbed({
        title: `Help for ${request.client?.user?.username ?? "bot"}`,
        ...defaultData,
        fields: [
            {
                name: "Commands",
                value: Object.entries(commands)
                    .map(([name, entry]) => {
                        if (isSubcommandGroup(entry)) {
                            return stringifySubcommands(name, prefix, request, entry.subcommands)
                        } else if (isSubcommand(entry)) {
                            return stringifyCommands(name, prefix, request, entry.commands)
                        }

                        return `\`${prefix}${changeCase(name, request)}\` - ${entry.description}`
                    })
                    .join("\n"),
            },
        ],
    })
}

export const generateSubcommandGroupHelp = (
    [subcommandGroupName]: [string],
    subcommandGroup: SubcommandGroup,
    request: Request,
    defaultData: MessageEmbedOptions,
): MessageEmbed => {
    const prefix = typeof request.metadata.prefix === "string" ? request.metadata.prefix : "/"

    return new MessageEmbed({
        title: `Help for \`${changeCase(subcommandGroupName, request)}\``,
        ...defaultData,
        description: `${subcommandGroup.description}\n\n${subcommandGroup.longDescription ?? ""}`,
        fields: [
            {
                name: "Subcommands",
                value:
                    stringifySubcommands(
                        subcommandGroupName,
                        prefix,
                        request,
                        subcommandGroup.subcommands,
                    ) || "none",
            },
            ...(subcommandGroup.helpFields ?? []),
        ],
    })
}

export const generateSubcommandHelp = (
    names: [string, string?],
    subcommand: Subcommand,
    request: Request,
    defaultData: MessageEmbedOptions,
): MessageEmbed => {
    const prefix = typeof request.metadata.prefix === "string" ? request.metadata.prefix : "/"

    return new MessageEmbed({
        title: `Help for \`${mapChangeCase(names, request)}\``,
        ...defaultData,
        description: `${subcommand.description}\n\n${subcommand.longDescription ?? ""}`,
        fields: [
            {
                name: "Commands",
                value: stringifyCommands(names, prefix, request, subcommand.commands) || "none",
            },
            ...(subcommand.helpFields ?? []),
        ],
    })
}

export const generateCommandHelp = (
    names: [string, string?, string?],
    command: Command,
    request: Request,
    defaultData: MessageEmbedOptions,
): MessageEmbed =>
    new MessageEmbed({
        title: `Help for \`${mapChangeCase(names, request)}\``,
        ...defaultData,
        description: `${command.description}\n\n${command.longDescription ?? ""}`,
        fields: [
            {
                name: "Options",
                value:
                    Object.entries(command.options ?? {})
                        .sort(([, {required}], [, {required: required2}]) => {
                            if (required === required2) {
                                return 0
                            } else if (required) {
                                return -1
                            }

                            return 1
                        })
                        .map(
                            ([name, {description, required}]) =>
                                `\`${changeCase(name, request)}\` - ${
                                    required ? "required" : "optional"
                                } - ${description}`,
                        )
                        .join("\n") || "none",
            },
            ...(command.helpFields ?? []),
        ],
    })
