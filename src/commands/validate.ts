import * as zod from "zod"
import {ApplicationCommandOptionType, ApplicationCommandType} from "discord-api-types"

const nameSchema = zod
    .string()
    .min(1)
    .max(32)
    .regex(/^[\P{Lu}\p{N}_-]+$/u)

const descriptionSchema = zod.string().min(1).max(100)

const apiApplicationCommandOptionBaseSchema = zod.object({
    type: zod.number(),
    name: nameSchema,
    description: descriptionSchema,
    required: zod.boolean().optional(),
})

const apiApplicationCommandBasicOptionSchema = apiApplicationCommandOptionBaseSchema.extend({
    autocomplete: zod.boolean().optional(),
    choices: zod.array(zod.unknown()).optional(),
})

const apiApplicationCommandSubcommandOptionSchema = apiApplicationCommandOptionBaseSchema.extend({
    type: zod.number().refine((arg) => arg === ApplicationCommandOptionType.Subcommand),
    options: zod.array(apiApplicationCommandBasicOptionSchema).optional(),
})

const apiApplicationCommandSubcommandGroupOption = apiApplicationCommandOptionBaseSchema.extend({
    type: zod.number().refine((arg) => arg === ApplicationCommandOptionType.SubcommandGroup),
    options: zod.array(apiApplicationCommandSubcommandOptionSchema).optional(),
})

const apiApplicationCommandOptionSchema = zod.union([
    apiApplicationCommandBasicOptionSchema,
    apiApplicationCommandSubcommandOptionSchema,
    apiApplicationCommandSubcommandGroupOption,
])

export const commandsSchema = zod.array(
    zod.object({
        type: zod
            .number()
            .optional()
            .refine((arg) => arg === undefined || arg === ApplicationCommandType.ChatInput),
        description: descriptionSchema,
        name: nameSchema,
        options: zod.array(apiApplicationCommandOptionSchema).optional(),
        default_permission: zod.boolean().optional(),
    }),
)
