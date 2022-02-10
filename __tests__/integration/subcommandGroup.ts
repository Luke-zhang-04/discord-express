import {ApplicationCommandOptionType} from "discord-api-types"
import {Awaiter} from "../utils"
import {MockDiscord} from "~/__mocks__/discord"
import {middleware} from "~/src"

const awaiter = new Awaiter()

afterEach(() => {
    awaiter.reset()
})

describe("test subcommand groups", () => {
    const mockDiscord = new MockDiscord()
    const {client} = mockDiscord

    client.initExpress()

    client.use(...middleware.recommended())
    client.use(middleware.messageCommandParser({prefix: "!"}))

    client.command("mySubcommandGroup/mySubcommand/myCommand", () => {
        awaiter.call()
    })

    test("should run subcommand", async () => {
        const interaction = mockDiscord.mockCommandInteraction(undefined, {
            name: "my-subcommand-group",
            options: [
                {
                    type: ApplicationCommandOptionType.SubcommandGroup,
                    name: "my-subcommand",
                    options: [
                        {
                            type: ApplicationCommandOptionType.Subcommand,
                            name: "my-command",
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
