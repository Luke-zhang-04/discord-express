import {Awaiter} from "../utils"
import {MockDiscord} from "~/__mocks__/discord"
import {middleware} from "~/src"

const awaiter = new Awaiter()

afterEach(() => {
    awaiter.reset()
})

describe("test multiple handlers", () => {
    const mockDiscord = new MockDiscord()
    const {client} = mockDiscord

    client.initExpress()

    client.use(...middleware.recommended())
    client.use(middleware.messageCommandParser({prefix: "!"}))

    client.command(
        "myCommand",
        (_req, _res, next) => {
            awaiter.call()
            next()
        },
        (_req, _res, next) => {
            awaiter.call()
            next()
        },
        () => {
            awaiter.call()
        },
    )

    test("should call all 3 handlers", async () => {
        const interaction = mockDiscord.mockCommandInteraction(undefined, {
            name: "my-command",
        })

        const wait = awaiter.waitFor(3, 1000)

        client.emit("interactionCreate", interaction)

        await wait
    })
})
