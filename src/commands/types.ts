import {type APIApplicationCommandChannelOption} from "discord-api-types/v9"
import {isObject} from "@luke-zhang-04/utils"

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

export interface Subcommand {
    description: string
    commands: {[commandName: string]: Command}
}

export const isSubcommand = (obj: unknown): obj is Subcommand =>
    isObject(obj) && typeof obj.commands === "object"

export interface SubcommandGroup {
    description: string
    subcommands: {
        [subcommandName: string]: Subcommand
    }
}

export const isSubcommandGroup = (obj: unknown): obj is SubcommandGroup =>
    isObject(obj) && typeof obj.subcommands === "object"

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
    } & (Command | Subcommand | SubcommandGroup)
}
