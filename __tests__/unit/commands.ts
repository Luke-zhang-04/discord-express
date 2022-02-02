import {ChannelType} from "discord-api-types"
import {SlashCommandBuilder} from "@discordjs/builders"
import {createCommands, OptionTypes} from "../../src"

describe("createCommands", () => {
    describe("commands", () => {
        const cases = [
            [
                createCommands({
                    echo: {
                        description: "Echo a message",
                    },
                }),
                [
                    new SlashCommandBuilder()
                        .setName("echo")
                        .setDescription("Echo a message")
                        .toJSON(),
                ],
            ],
            [
                createCommands({
                    echo: {
                        description: "Echo a message",
                    },
                    myCommand: {
                        description: "My Command",
                    },
                }),
                [
                    new SlashCommandBuilder()
                        .setName("echo")
                        .setDescription("Echo a message")
                        .toJSON(),
                    new SlashCommandBuilder()
                        .setName("my-command")
                        .setDescription("My Command")
                        .toJSON(),
                ],
            ],
        ]

        test.each(cases)("should create API commands properly", (result, expected) => {
            for (const command of result) {
                command.options?.sort((option, other) => (option.name > other.name ? 1 : -1))
            }

            for (const command of expected) {
                command.options?.sort((option, other) => (option.name > other.name ? 1 : -1))
            }

            expect(result).toMatchObject(expected)
        })
    })

    describe("commands + options", () => {
        const cases = [
            [
                createCommands({
                    echo: {
                        description: "Number of times to repeat",
                        options: {
                            repeat: {
                                type: "integer",
                                description: "Number of times to repeat",
                                min: 1,
                                max: 10,
                                required: false,
                            },
                            content: {
                                type: "string",
                                description: "Content to echo",
                                required: true,
                            },
                            type: {
                                type: "string",
                                description: "Echo message type",
                                choices: ["normal", "embed"],
                            },
                        },
                    },
                }),
                [
                    new SlashCommandBuilder()
                        .setName("echo")
                        .setDescription("Number of times to repeat")
                        .addIntegerOption((option) =>
                            option
                                .setName("repeat")
                                .setDescription("Number of times to repeat")
                                .setMinValue(1)
                                .setMaxValue(10)
                                .setRequired(false),
                        )
                        .addStringOption((option) =>
                            option
                                .setName("content")
                                .setDescription("Content to echo")
                                .setRequired(true),
                        )
                        .addStringOption((option) =>
                            option
                                .setName("type")
                                .setDescription("Echo message type")
                                .setChoices([
                                    ["normal", "normal"],
                                    ["embed", "embed"],
                                ]),
                        )
                        .toJSON(),
                ],
            ],
            [
                createCommands({
                    myCommand: {
                        description: "description",
                        options: {
                            option1: {
                                type: "boolean",
                                description: "option1",
                                required: false,
                            },
                            option2: {
                                type: "channel",
                                description: "option2",
                                required: true,
                                channelTypes: [ChannelType.GuildText],
                            },
                            option3: {
                                type: "mentionable",
                                description: "option3",
                            },
                        },
                    },
                }),
                [
                    new SlashCommandBuilder()
                        .setName("my-command")
                        .setDescription("description")
                        .addBooleanOption((option) =>
                            option.setName("option1").setDescription("option1").setRequired(false),
                        )
                        .addChannelOption((option) =>
                            option
                                .setName("option2")
                                .setDescription("option2")
                                .setRequired(true)
                                .addChannelType(ChannelType.GuildText),
                        )
                        .addMentionableOption((option) =>
                            option.setName("option3").setDescription("option3"),
                        )
                        .toJSON(),
                ],
            ],
        ]

        test.each(cases)("should create API commands properly", (result, expected) => {
            for (const command of result) {
                command.options?.sort((option, other) => (option.name > other.name ? 1 : -1))
            }

            for (const command of expected) {
                command.options?.sort((option, other) => (option.name > other.name ? 1 : -1))
            }

            expect(result).toMatchObject(expected)
        })
    })

    describe("commands + subCommands + options", () => {
        const cases = [
            [
                createCommands({
                    mySubCommandGroup: {
                        description: "My subcommand group",
                        defaultPermission: true,
                        subCommandGroups: {
                            mySubCommand: {
                                description: "My subcommand",
                                subCommands: {
                                    myCommand: {
                                        description: "My command",
                                        options: {
                                            myOption: {
                                                description: "My option",
                                                type: "role",
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    myOtherSubCommand: {
                        description: "My other subcommand",
                        subCommands: {
                            myOtherCommand: {
                                description: "My other command",
                                options: {
                                    myOtherOption: {
                                        description: "My other option",
                                        type: "user",
                                    },
                                },
                            },
                        },
                    },
                    myOtherCommand: {
                        description: "My other command",
                        options: {
                            option1: {
                                type: OptionTypes.String,
                                description: "Option 1",
                                autoComplete: true,
                            },
                            option2: {
                                type: OptionTypes.Number,
                                description: "Option 2",
                                autoComplete: false,
                                required: false,
                            },
                        },
                    },
                }),
                [
                    new SlashCommandBuilder()
                        .setName("my-sub-command-group")
                        .setDescription("My subcommand group")
                        .setDefaultPermission(true)
                        .addSubcommandGroup((subCommandGroup) =>
                            subCommandGroup
                                .setName("my-sub-command")
                                .setDescription("My subcommand")
                                .addSubcommand((subCommand) =>
                                    subCommand
                                        .setName("my-command")
                                        .setDescription("My command")
                                        .addRoleOption((option) =>
                                            option
                                                .setName("my-option")
                                                .setDescription("My option"),
                                        ),
                                ),
                        )
                        .toJSON(),
                    new SlashCommandBuilder()
                        .setName("my-other-sub-command")
                        .setDescription("My other subcommand")
                        .addSubcommand((subCommand) =>
                            subCommand
                                .setName("my-other-command")
                                .setDescription("My other command")
                                .addUserOption((option) =>
                                    option
                                        .setName("my-other-option")
                                        .setDescription("My other option"),
                                ),
                        )
                        .toJSON(),
                    new SlashCommandBuilder()
                        .setName("my-other-command")
                        .setDescription("My other command")
                        .addStringOption((option) =>
                            option
                                .setName("option1")
                                .setDescription("Option 1")
                                .setAutocomplete(true),
                        )
                        .addNumberOption((option) =>
                            option
                                .setName("option2")
                                .setDescription("Option 2")
                                .setAutocomplete(false)
                                .setRequired(false),
                        )
                        .toJSON(),
                ],
            ],
        ]

        test.each(cases)("should create API commands properly", (result, expected) => {
            for (const command of result) {
                command.options?.sort((option, other) => (option.name > other.name ? 1 : -1))
            }

            for (const command of expected) {
                command.options?.sort((option, other) => (option.name > other.name ? 1 : -1))
            }

            expect(result).toMatchObject(expected)
        })
    })
})
