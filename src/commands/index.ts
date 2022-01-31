import {
    type AllOptionTypes,
    type ChannelOption,
    type Commands,
    type NumericOption,
    type Option,
    OptionTypes,
    type StringOption,
    type SubCommand,
    type SubCommandGroup,
    isSubCommand,
    isSubCommandGroup,
} from "./types"
import {
    type APIApplicationCommandBasicOption,
    type APIApplicationCommandSubcommandGroupOption,
    type APIApplicationCommandSubcommandOption,
    ApplicationCommandOptionType,
    type RESTPostAPIApplicationCommandsJSONBody,
} from "discord-api-types/v9"
import Case from "case"
import {pick} from "@luke-zhang-04/utils"
import {commandsSchema} from "./validate"

const resolveOptionType = (
    optionType: AllOptionTypes,
):
    | ApplicationCommandOptionType.String
    | ApplicationCommandOptionType.Integer
    | ApplicationCommandOptionType.Boolean
    | ApplicationCommandOptionType.User
    | ApplicationCommandOptionType.Channel
    | ApplicationCommandOptionType.Role
    | ApplicationCommandOptionType.Mentionable
    | ApplicationCommandOptionType.Number => {
    switch (optionType) {
        case "string":
        case "str":
        case OptionTypes.String:
            return ApplicationCommandOptionType.String
        case "integer":
        case "int":
        case OptionTypes.Integer:
            return ApplicationCommandOptionType.Integer
        case "boolean":
        case "bool":
        case OptionTypes.Boolean:
            return ApplicationCommandOptionType.Boolean
        case "user":
        case OptionTypes.User:
            return ApplicationCommandOptionType.User
        case "channel":
        case OptionTypes.Channel:
            return ApplicationCommandOptionType.Channel
        case "role":
            return ApplicationCommandOptionType.Role
        case "mentionable":
        case "mention":
        case OptionTypes.Mentionable:
            return ApplicationCommandOptionType.Mentionable
        case "number":
        case "num":
        case OptionTypes.Number:
            return ApplicationCommandOptionType.Number
        default:
            throw new Error(`Option type "${optionType}" is invalid`)
    }
}

const resolveCommandOptions = (
    options:
        | {
              [name: string]: Option
          }
        | undefined,
): APIApplicationCommandBasicOption[] =>
    options === undefined
        ? []
        : Object.entries(options)
              .map(
                  ([
                      name,
                      {description, required: isRequired, ...option},
                  ]): APIApplicationCommandBasicOption => {
                      const type = resolveOptionType(option.type)

                      const commonAttributes = {
                          name,
                          description,
                          required: isRequired ?? false,
                      }

                      switch (type) {
                          case ApplicationCommandOptionType.Integer:
                              return {
                                  ...commonAttributes,
                                  type,
                                  ...pick(option as NumericOption, "autoComplete", "defaultValue"),
                                  min_value: (option as NumericOption).min,
                                  max_value: (option as NumericOption).max,
                                  choices: (option as NumericOption).choices?.map((val) =>
                                      val instanceof Array
                                          ? {name: val[0], value: val[1]}
                                          : {name: val.toString(), value: val},
                                  ),
                              }

                          // Can't combine these; typescript gets mad
                          case ApplicationCommandOptionType.Number:
                              return {
                                  ...commonAttributes,
                                  type,
                                  ...pick(option as NumericOption, "autoComplete", "defaultValue"),
                                  min_value: (option as NumericOption).min,
                                  max_value: (option as NumericOption).max,
                                  choices: (option as NumericOption).choices?.map((val) =>
                                      val instanceof Array
                                          ? {name: val[0], value: val[1]}
                                          : {name: val.toString(), value: val},
                                  ),
                              }
                          case ApplicationCommandOptionType.String:
                              return {
                                  ...commonAttributes,
                                  type,
                                  ...pick(option as StringOption, "autoComplete", "defaultValue"),
                                  choices: (option as StringOption).choices?.map((val) =>
                                      val instanceof Array
                                          ? {name: val[0], value: val[1]}
                                          : {name: val, value: val},
                                  ),
                              }
                          case ApplicationCommandOptionType.Channel:
                              return {
                                  ...commonAttributes,
                                  type,
                                  channel_types: (option as ChannelOption).channelTypes,
                              }
                          default:
                              return {
                                  ...commonAttributes,
                                  type,
                              }
                      }
                  },
              )
              .sort((first, second) => (first.required && !second.required ? -1 : 0))

const resolveSubCommands = ({subCommands}: SubCommand): APIApplicationCommandSubcommandOption[] =>
    Object.entries(subCommands).map(
        ([name, {description, options}]): APIApplicationCommandSubcommandOption => ({
            name: Case.kebab(name),
            description,
            type: ApplicationCommandOptionType.Subcommand,
            options: resolveCommandOptions(options),
        }),
    )

const resolveSubCommandGroups = ({
    subCommandGroups,
}: SubCommandGroup): APIApplicationCommandSubcommandGroupOption[] =>
    Object.entries(subCommandGroups).map(
        ([name, subCommands]): APIApplicationCommandSubcommandGroupOption => ({
            name: Case.kebab(name),
            description: subCommands.description,
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: resolveSubCommands(subCommands),
        }),
    )

export const createCommands = (commands: Commands): RESTPostAPIApplicationCommandsJSONBody[] =>
    commandsSchema.parse(
        Object.entries(commands).map(([name, command]): RESTPostAPIApplicationCommandsJSONBody => {
            const commonAttributes = {
                name: Case.kebab(name),
                default_permission: command.defaultPermission,
                description: command.description,
            }

            if (isSubCommand(command)) {
                return {
                    ...commonAttributes,
                    options: resolveSubCommands(command),
                }
            } else if (isSubCommandGroup(command)) {
                return {
                    ...commonAttributes,
                    options: resolveSubCommandGroups(command),
                }
            }

            return {
                ...commonAttributes,
                options: resolveCommandOptions(command.options),
            }
        }),
    )

export default createCommands
