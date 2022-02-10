/**
 * @file minimal Validation for command output. Checks are very basic and do not garuntee a good
 *   request to the API
 */

import * as zod from "zod"
import {ApplicationCommandOptionType, ApplicationCommandType} from "discord-api-types"

const nameSchema = zod
    .string()
    .min(1)
    .max(32)
    .regex(/^[\P{Lu}\p{N}_-]+$/u)

const descriptionSchema = zod.string().min(1).max(100)

const optionSchema = zod.object({
    type: zod.number(),
    name: nameSchema,
    description: descriptionSchema,
    required: zod.boolean().optional(),
})

const anyOptionSchema = optionSchema.extend({
    autocomplete: zod.boolean().optional(),
    choices: zod.array(zod.unknown()).optional(),
    options: zod.array(optionSchema).optional(),
    min_value: zod.number().optional(),
    max_value: zod.number().optional(),
    channel_types: zod.array(zod.number()).optional(),
})

const subcommandSchema = optionSchema.extend({
    type: zod.number().refine((arg) => arg === ApplicationCommandOptionType.Subcommand),
    options: zod.array(anyOptionSchema).optional(),
})

const subcommandGroupSchema = optionSchema.extend({
    type: zod.number().refine((arg) => arg === ApplicationCommandOptionType.SubcommandGroup),
    options: zod.array(subcommandSchema).optional(),
})

const apiApplicationCommandOptionSchema = zod.union([
    subcommandSchema,
    subcommandGroupSchema,
    anyOptionSchema,
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
