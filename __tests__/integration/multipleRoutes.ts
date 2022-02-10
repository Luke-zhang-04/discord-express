import {Awaiter} from "../utils"
import {MockDiscord} from "~/__mocks__/discord"
import {middleware} from "~/src"

const awaiter = new Awaiter()

afterEach(() => {
    awaiter.reset()
})

describe("test multiple routes", () => {
    const mockDiscord = new MockDiscord()
    const {client} = mockDiscord

    client.initExpress()

    client.use(...middleware.recommended())
    client.use(middleware.messageCommandParser({prefix: "!"}))

    client.command(["myCommand", "myOtherCommand"], () => {
        awaiter.call()
    })

    test("should accept both commands", async () => {
        const wait = awaiter.waitFor(2, 1000)

        client.emit(
            "interactionCreate",
            mockDiscord.mockCommandInteraction(undefined, {
                name: "my-command",
            }),
        )

        client.emit(
            "interactionCreate",
            mockDiscord.mockCommandInteraction(undefined, {
                name: "my-other-command",
            }),
        )

        await wait
    })
})
