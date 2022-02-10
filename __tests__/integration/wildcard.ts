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
        ])("should match any subcommand", async (subcommand, command) => {
            const interaction = mockDiscord.mockCommandInteraction(undefined, {
                name: subcommand,
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
        ])("should match any subcommand group", async (subcommandGroup, subcommand, command) => {
            const interaction = mockDiscord.mockCommandInteraction(undefined, {
                name: subcommandGroup,
                options: [
                    {
                        type: ApplicationCommandOptionType.SubcommandGroup,
                        name: subcommand,
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

        client.command("mySubcommand/*", () => {
            awaiter.call()
        })

        test.each(["random-command", "another-command", "e"])(
            "should match any subcommand",
            async (command) => {
                const interaction = mockDiscord.mockCommandInteraction(undefined, {
                    name: "my-subcommand",
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
        ])("should match any subcommand group", async (subcommand, command) => {
            const interaction = mockDiscord.mockCommandInteraction(undefined, {
                name: "my-subcommand",
                options: [
                    {
                        type: ApplicationCommandOptionType.SubcommandGroup,
                        name: subcommand,
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

        client.command("mySubcommandGroup/mySubcommand/*", () => {
            awaiter.call()
        })

        test.each(["random-command", "another-command", "e"])(
            "should match any subcommand group",
            async (command) => {
                const interaction = mockDiscord.mockCommandInteraction(undefined, {
                    name: "my-subcommand-group",
                    options: [
                        {
                            type: ApplicationCommandOptionType.SubcommandGroup,
                            name: "my-subcommand",
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
