import {
    type APIApplicationCommandBasicOption,
    type APIApplicationCommandChannelOption,
    type APIApplicationCommandSubcommandGroupOption,
    type APIApplicationCommandSubcommandOption,
    ApplicationCommandOptionType,
    type RESTPostAPIApplicationCommandsJSONBody,
} from "discord-api-types/v9"
import {isObject, pick} from "@luke-zhang-04/utils"

export enum OptionTypes {
    String = 3,
    /** Any integer between -2^53 and 2^53 */
    Integer,
    Boolean,
    User,
    /** Includes all channel types + categories */
    Channel,
    Role,
    /** Includes users and roles */
    Mentionable,
    /** Any double between -2^53 and 2^53 */
    Number,
}

export type OptionStringTypes =
    | "string"
    | "str"
    | "integer"
    | "int"
    | "boolean"
    | "bool"
    | "user"
    | "channel"
    | "role"
    | "mentionable"
    | "mention"
    | "number"
    | "num"

export type AllOptionTypes = OptionTypes | OptionStringTypes

export interface Option<Type extends AllOptionTypes = AllOptionTypes> {
    /**
     * Value type for option
     *
     * @see https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-types
     */
    type: Type
    description: string

    /**
     * If option is a required option or not
     *
     * @default true
     */
    required?: boolean
}

export type NumericOptionTypes =
    | "int"
    | "integer"
    | "number"
    | "num"
    | OptionTypes.Integer
    | OptionTypes.Number

export interface NumericOption<Type extends NumericOptionTypes = NumericOptionTypes>
    extends Option<Type> {
    min?: number
    max?: number

    /** Default value of option. No-op if `required` is `true` */
    defaultValue?: number

    /**
     * Possible choices for this option. Note that if choices are specified, no other values will be allowed
     *
     * Choices are an array of numbers of key-value pairs
     *
     * @example
     *
     * ```ts
     * const option = {
     *     choices: [0],
     * }
     * // Is the same as
     * const option = {
     *     choices: [["0", 0]],
     * }
     * // You can speficy a better name
     * const option = {
     *     choices: [["zero", 0]],
     * }
     * ```
     */
    choices?: (number | [name: string, value: number])[]

    /**
     * If autocomplete is enabled. No-op if choices are specified
     *
     * @default false
     */
    autoComplete?: boolean
}

export type StringOptionTypes = "string" | "str" | OptionTypes.String

export interface StringOption<Type extends StringOptionTypes = StringOptionTypes>
    extends Option<Type> {
    /** Default value of option. No-op if `required` is `true` */
    defaultValue?: string

    /**
     * Possible choices for this option. Note that if choices are specified, no other values will be allowed
     *
     * Choices are an array of numbers of key-value pairs
     *
     * @example
     *
     * ```ts
     * const option = {
     *     choices: ["ts"],
     * }
     * // Is the same as
     * const option = {
     *     choices: [["ts", "ts"]],
     * }
     * // You can speficy a better name
     * const option = {
     *     choices: [["TypeScript", "ts"]],
     * }
     * ```
     */
    choices?: (string | [name: string, value: string])[]

    /**
     * If autocomplete is enabled. No-op if choices are specified
     *
     * @default false
     */
    autoComplete?: boolean
}

export type ChannelOptionTypes = "channel" | OptionTypes.Channel

export interface ChannelOption<Type extends ChannelOptionTypes = ChannelOptionTypes>
    extends Option<Type> {
    /** Types of channel to allow */
    channelTypes?: APIApplicationCommandChannelOption["channel_types"]
}

export type OtherOption = Option<
    Exclude<AllOptionTypes, NumericOptionTypes | StringOptionTypes | ChannelOptionTypes>
>

export interface Command {
    description: string
    options?: {[name: string]: StringOption | NumericOption | ChannelOption | OtherOption}
}

export interface SubCommand {
    description: string
    subCommands: {[subCommands: string]: Command}
}

const isSubCommand = (obj: unknown): obj is SubCommand =>
    isObject(obj) && typeof obj.subCommands === "object"

export interface SubCommandGroup {
    description: string
    subCommandGroups: {
        [subCommandGroup: string]: SubCommand
    }
}

const isSubCommandGroup = (obj: unknown): obj is SubCommandGroup =>
    isObject(obj) && typeof obj.subCommandGroups === "object"

export interface Commands {
    [name: string]: {
        /**
         * Sets whether the command is enabled by default when the application is added to a guild.
         *
         * **Note**: If set to `false`, you will have to later `PUT` the permissions for this command.
         *
         * @see https://discord.com/developers/docs/interactions/application-commands#permissions
         */
        defaultPermission?: boolean
    } & (Command | SubCommand | SubCommandGroup)
}

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
        : Object.entries(options).map(
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

const resolveSubCommands = ({subCommands}: SubCommand): APIApplicationCommandSubcommandOption[] =>
    Object.entries(subCommands).map(
        ([name, {description, options}]): APIApplicationCommandSubcommandOption => ({
            name,
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
            name,
            description: subCommands.description,
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: resolveSubCommands(subCommands),
        }),
    )

export const createCommands = (commands: Commands): RESTPostAPIApplicationCommandsJSONBody[] =>
    Object.entries(commands).map(([name, command]): RESTPostAPIApplicationCommandsJSONBody => {
        const commonAttributes = {
            name,
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
    })

export default createCommands
