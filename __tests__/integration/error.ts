import {Awaiter} from "../utils"
import {MockDiscord} from "~/__mocks__/discord"
import {middleware} from "~/src"

const awaiter = new Awaiter()

afterEach(() => {
    awaiter.reset()
})

describe("test thrown error", () => {
    const mockDiscord = new MockDiscord()
    const {client} = mockDiscord

    client.initExpress()

    client.use(...middleware.recommended())
    client.use(middleware.messageCommandParser({prefix: "!"}))

    client.use(async () => {
        await Promise.resolve()

        throw new Error("test error")
    })

    client.error(async () => {
        await Promise.resolve()

        awaiter.call()
    })

    test("should handle errors", async () => {
        const interaction = mockDiscord.mockCommandInteraction()

        const wait = awaiter.wait(1000)

        client.emit("interactionCreate", interaction)

        await wait
    })
})

describe("test error in specific route", () => {
    const mockDiscord = new MockDiscord()
    const {client} = mockDiscord

    client.initExpress()

    client.use(...middleware.recommended())
    client.use(middleware.messageCommandParser({prefix: "!"}))

    client.use(async () => {
        await Promise.resolve()

        awaiter.call()

        throw new Error("test error")
    })

    client.error("myCommand", async () => {
        await Promise.resolve()

        awaiter.call()
    })

    test("should handle errors", async () => {
        const interaction = mockDiscord.mockCommandInteraction(undefined, {
            name: "myCommand",
        })

        const wait = awaiter.waitFor(2, 1000)

        client.emit("interactionCreate", interaction)

        await wait
    })

    test("should handle errors", async () => {
        let output = ""
        const consoleError = console.error

        console.error = (...data: unknown[]): void => {
            output += data.join(" ")
            awaiter.increment()
        }

        const interaction = mockDiscord.mockCommandInteraction(undefined, {
            name: "myOtherCommand",
        })

        const wait = awaiter.waitFor(2, 1000)

        client.emit("interactionCreate", interaction)

        await wait

        expect(output).toBe("Error: test error")

        console.error = consoleError
    })
})

describe("test next error", () => {
    const mockDiscord = new MockDiscord()
    const {client} = mockDiscord

    client.initExpress()

    client.use(...middleware.recommended())
    client.use(middleware.messageCommandParser({prefix: "!"}))

    client.use(async (_req, _res, next) => {
        await Promise.resolve()

        next(new Error("test error"))
    })

    client.error(async () => {
        await Promise.resolve()

        awaiter.call()
    })

    test("should handle errors", async () => {
        const interaction = mockDiscord.mockCommandInteraction()

        const wait = awaiter.wait(1000)

        client.emit("interactionCreate", interaction)

        await wait
    })
})

describe("test error in error handler", () => {
    const mockDiscord = new MockDiscord()
    const {client} = mockDiscord

    client.initExpress()

    client.use(...middleware.recommended())
    client.use(middleware.messageCommandParser({prefix: "!"}))

    client.use(async () => {
        await Promise.resolve()

        throw new Error("test error")
    })

    client.error(() => {
        awaiter.call()

        throw new Error("test error 2")
    })

    client.error(async () => {
        await Promise.resolve()

        awaiter.call()
        awaiter.resolveAll()
    })

    test("should not restart middleware chain if an error handler raises an error", async () => {
        const interaction = mockDiscord.mockCommandInteraction()

        const wait = awaiter.waitFor(Infinity, 1000)

        client.emit("interactionCreate", interaction)

        await wait

        expect(awaiter.callCount).toBe(2)
    })
})

describe("test error in last error handler", () => {
    const mockDiscord = new MockDiscord()
    const {client} = mockDiscord

    client.initExpress()

    client.use(...middleware.recommended())
    client.use(middleware.messageCommandParser({prefix: "!"}))

    client.use(async () => {
        await Promise.resolve()

        awaiter.call()

        throw new Error("expected test error")
    })

    test("should log unhandled errors", async () => {
        let output = ""
        const consoleError = console.error

        console.error = (...data: unknown[]): void => {
            output += data.join(" ")
            awaiter.increment()
        }

        const interaction = mockDiscord.mockCommandInteraction()

        const wait = awaiter.waitFor(2, 1000)

        client.emit("interactionCreate", interaction)

        await wait

        expect(output).toBe("Error: expected test error")

        console.error = consoleError
    })
})
