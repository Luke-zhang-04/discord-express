import {Awaiter} from "../utils"
import {MockDiscord} from "~/__mocks__/discord"
import {middleware} from "~/src"

const awaiter = new Awaiter()

afterEach(() => {
    awaiter.reset()
})

describe("test error handler", () => {
    const mockDiscord = new MockDiscord()
    const {client} = mockDiscord

    client.initExpress()

    client.use(...middleware.recommended())
    client.use(middleware.messageCommandParser({prefix: "!"}))

    client.use(() => {
        throw new Error("test error")
    })

    client.error(async () => {
        awaiter.call()
    })

    test("should handle errors", async () => {
        const interaction = mockDiscord.mockCommandInteraction()

        const wait = awaiter.wait(1000)

        client.emit("interactionCreate", interaction)

        await wait
    })
})
