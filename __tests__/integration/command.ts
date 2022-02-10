import {Awaiter} from "../utils"
import {MockDiscord} from "~/__mocks__/discord"
import {middleware} from "~/src"

const awaiter = new Awaiter()

afterEach(() => {
    awaiter.reset()
})

describe("test basic application", () => {
    const mockDiscord = new MockDiscord()
    const {client} = mockDiscord

    client.initExpress()

    client.use(...middleware.recommended())
    client.use(middleware.messageCommandParser({prefix: "!"}))

    client.command("myCommand", () => {
        awaiter.call()
    })

    test("should pass slash command down middleware chain", async () => {
        const interaction = mockDiscord.mockCommandInteraction(undefined, {
            name: "my-command",
        })

        const wait = awaiter.wait(1000)

        client.emit("interactionCreate", interaction)

        await wait
    })

    test("should pass message command down middleware chain", async () => {
        const interaction = mockDiscord.mockMessage({
            content: "!myCommand",
        })

        const wait = awaiter.wait(1000)

        client.emit("messageCreate", interaction)

        await wait
    })

    test("should not pass normal message down middleware chain", async () => {
        const interaction = mockDiscord.mockMessage({
            content: "myCommand",
        })

        client.emit("messageCreate", interaction)

        expect(awaiter.callCount).toBe(0)
    })
})
