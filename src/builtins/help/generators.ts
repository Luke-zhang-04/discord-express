import {
    type Command,
    type Commands,
    type Subcommand,
    type SubcommandGroup,
    isSubcommand,
    isSubcommandGroup,
} from "../../commands/types"
import {MessageEmbed, type MessageEmbedOptions} from "discord.js"

export const generateTopLevelHelp = (
    commands: Commands,
    defaultData: MessageEmbedOptions,
): MessageEmbed =>
    new MessageEmbed({
        ...defaultData,
        fields: Object.entries(commands).map(([name, entry]) => {
            if (isSubcommandGroup(entry)) {
                return {
                    name,
                    value: `${entry.description}\nsubcommands: ${Object.keys(entry.subcommands)
                        .map((subcommandName) => `\`${subcommandName}\``)
                        .join(", ")}`,
                }
            } else if (isSubcommand(entry)) {
                return {
                    name,
                    value: `${entry.description}\ncommands: ${Object.keys(entry.commands)
                        .map((commandName) => `\`${commandName}\``)
                        .join(", ")}`,
                }
            }
            return {
                name,
                value: entry.description,
            }
        }),
    })

export const generateSubcommandGroupHelp = (
    subcommandGroup: SubcommandGroup,
    defaultData: MessageEmbedOptions,
): MessageEmbed =>
    new MessageEmbed({
        ...defaultData,
        description: `${subcommandGroup.description}\n\n${subcommandGroup.longDescription ?? ""}`,
        fields: [
            {
                name: "Subcommands",
                value:
                    Object.entries(subcommandGroup.subcommands ?? {})
                        .map(([name, {description}]) => `\`${name}\` - ${description}`)
                        .join("\n") || "none",
            },
            ...(subcommandGroup.helpFields ?? []),
        ],
    })

export const generateSubcommandHelp = (
    subcommand: Subcommand,
    defaultData: MessageEmbedOptions,
): MessageEmbed =>
    new MessageEmbed({
        ...defaultData,
        description: `${subcommand.description}\n\n${subcommand.longDescription ?? ""}`,
        fields: [
            {
                name: "Commands",
                value:
                    Object.entries(subcommand.commands ?? {})
                        .map(([name, {description}]) => `\`${name}\` - ${description}`)
                        .join("\n") || "none",
            },
            ...(subcommand.helpFields ?? []),
        ],
    })

export const generateCommandHelp = (
    command: Command,
    defaultData: MessageEmbedOptions,
): MessageEmbed =>
    new MessageEmbed({
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
                                `\`${name}\` - ${
                                    required ? "required" : "optional"
                                } - ${description}`,
                        )
                        .join("\n") || "none",
            },
            ...(command.helpFields ?? []),
        ],
    })
