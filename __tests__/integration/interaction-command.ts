import {Awaiter} from "../utils"
import {MockDiscord} from "~/__mocks__/discord"
import {middleware} from "~/src"

const awaiter = new Awaiter()

afterEach(() => {
    awaiter.reset()
})

describe("test message command handler", () => {
    const mockDiscord = new MockDiscord()
    const {client} = mockDiscord

    client.initExpress()

    client.use(...middleware.recommended())
    client.use(middleware.messageCommandParser({prefix: "!"}))

    client.interactioncommand("myCommand", (request) => {
        expect(request.requestType).toBe("interaction")
        awaiter.call()
    })

    client.use(() => {
        awaiter.resolveAll()
    })

    test("should call handler with slash command", async () => {
        const interaction = mockDiscord.mockCommandInteraction(undefined, {
            name: "myCommand",
        })

        const wait = awaiter.wait(1000)

        client.emit("interactionCreate", interaction)

        await wait

        expect(awaiter.count).toBe(1)
    })

    test("should not call handler with message command", async () => {
        const message = mockDiscord.mockMessage({
            content: "!myCommand",
        })

        const wait = awaiter.wait(1000)

        client.emit("messageCreate", message)

        await wait

        expect(awaiter.count).toBe(0)
    })
})
