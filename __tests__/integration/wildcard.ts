import {ApplicationCommandOptionType} from "discord-api-types"
import {Awaiter} from "../utils"
import {MockDiscord} from "~/__mocks__/discord"
import {middleware} from "~/src"

const awaiter = new Awaiter()

afterEach(() => {
    awaiter.reset()
})

describe("test wildcard matching", () => {
    describe("top level wildcards", () => {
        const mockDiscord = new MockDiscord()
        const {client} = mockDiscord

        client.initExpress()

        client.use(...middleware.recommended())
        client.use(middleware.messageCommandParser({prefix: "!"}))

        client.command("*", () => {
            awaiter.call()
        })

        test.each(["random-command", "another-command", "e"])(
            "should match any command",
            async (name) => {
                const interaction = mockDiscord.mockCommandInteraction(undefined, {
                    name,
                })

                const wait = awaiter.wait(1000)

                client.emit("interactionCreate", interaction)

                await wait
            },
        )

        test.each([
            ["random-subcommand", "random-command"],
            ["another-subcommand", "another-command"],
            ["a", "e"],
        ])("should match any subcommand", async (subCommand, command) => {
            const interaction = mockDiscord.mockCommandInteraction(undefined, {
                name: subCommand,
                options: [
                    {
                        type: ApplicationCommandOptionType.Subcommand,
                        name: command,
                    },
                ],
            })

            const wait = awaiter.wait(1000)

            client.emit("interactionCreate", interaction)

            await wait
        })

        test.each([
            ["random-subcommand-group", "random-subcommand", "random-command"],
            ["another-subcommand-group", "another-subcommand", "another-command"],
            ["O", "a", "e"],
        ])("should match any subcommand group", async (subCommandGroup, subCommand, command) => {
            const interaction = mockDiscord.mockCommandInteraction(undefined, {
                name: subCommandGroup,
                options: [
                    {
                        type: ApplicationCommandOptionType.SubcommandGroup,
                        name: subCommand,
                        options: [
                            {
                                type: ApplicationCommandOptionType.Subcommand,
                                name: command,
                            },
                        ],
                    },
                ],
            })

            const wait = awaiter.wait(1000)

            client.emit("interactionCreate", interaction)

            await wait
        })
    })

    describe("subcommand level wildcards", () => {
        const mockDiscord = new MockDiscord()
        const {client} = mockDiscord

        client.initExpress()

        client.use(...middleware.recommended())
        client.use(middleware.messageCommandParser({prefix: "!"}))

        client.command("mySubCommand/*", () => {
            awaiter.call()
        })

        test.each(["random-command", "another-command", "e"])(
            "should match any subcommand",
            async (command) => {
                const interaction = mockDiscord.mockCommandInteraction(undefined, {
                    name: "my-sub-command",
                    options: [
                        {
                            type: ApplicationCommandOptionType.Subcommand,
                            name: command,
                        },
                    ],
                })

                const wait = awaiter.wait(1000)

                client.emit("interactionCreate", interaction)

                await wait
            },
        )

        test.each([
            ["random-subcommand", "random-command"],
            ["another-subcommand", "another-command"],
            ["a", "e"],
        ])("should match any subcommand group", async (subCommand, command) => {
            const interaction = mockDiscord.mockCommandInteraction(undefined, {
                name: "my-sub-command",
                options: [
                    {
                        type: ApplicationCommandOptionType.SubcommandGroup,
                        name: subCommand,
                        options: [
                            {
                                type: ApplicationCommandOptionType.Subcommand,
                                name: command,
                            },
                        ],
                    },
                ],
            })

            const wait = awaiter.wait(1000)

            client.emit("interactionCreate", interaction)

            await wait
        })
    })

    describe("subcommand group level wildcards", () => {
        const mockDiscord = new MockDiscord()
        const {client} = mockDiscord

        client.initExpress()

        client.use(...middleware.recommended())
        client.use(middleware.messageCommandParser({prefix: "!"}))

        client.command("mySubCommandGroup/mySubCommand/*", () => {
            awaiter.call()
        })

        test.each(["random-command", "another-command", "e"])(
            "should match any subcommand group",
            async (command) => {
                const interaction = mockDiscord.mockCommandInteraction(undefined, {
                    name: "my-sub-command-group",
                    options: [
                        {
                            type: ApplicationCommandOptionType.SubcommandGroup,
                            name: "my-sub-command",
                            options: [
                                {
                                    type: ApplicationCommandOptionType.Subcommand,
                                    name: command,
                                },
                            ],
                        },
                    ],
                })

                const wait = awaiter.wait(1000)

                client.emit("interactionCreate", interaction)

                await wait
            },
        )
    })
})
