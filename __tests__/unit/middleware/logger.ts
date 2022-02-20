import {type Request, createRequest} from "~/src/request"
import {type Response, createResponse} from "~/src/response"
import logger, {type Tokens} from "~/src/middleware/logger"
import {Counter} from "../../utils"
import MockDiscord from "~/__mocks__/discord"
import {PassThrough} from "stream"

describe("noDMs", () => {
    test("should log request", () => {
        const mockDiscord = new MockDiscord()
        const counter = new Counter()
        const message = mockDiscord.mockCommandInteraction(undefined, {
            name: "command",
        })
        let content = ""
        const stream = new PassThrough()

        stream.on("data", (str) => {
            content += String(str)
        })

        const request = createRequest(message)

        const middleware = logger({stream})

        middleware(request, createResponse(message), counter.increment)

        stream.end()
        stream.destroy()

        expect(counter.callCount).toBe(1)
        expect(content).toContain(
            'username#0000 | mocked js guild | guild-channel - interaction "/command"',
        )
    })

    test.each([
        ["tiny", "/command"],
        ["short", "username#0000 /command"],
    ])("should log request with %s format", (format, expected) => {
        const mockDiscord = new MockDiscord()
        const counter = new Counter()
        const message = mockDiscord.mockCommandInteraction(undefined, {
            name: "command",
        })
        let content = ""
        const stream = new PassThrough()

        stream.on("data", (str) => {
            content += String(str)
        })

        const request = createRequest(message)

        const middleware = logger({format, stream})

        middleware(request, createResponse(message), counter.increment)

        stream.end()
        stream.destroy()

        expect(counter.callCount).toBe(1)
        expect(content.trim()).toEqual(expected)
    })

    test.each([
        [
            ":username#:discriminator :guild :channel - :type :prefix:command",
            "username#0000 mocked js guild guild-channel - interaction /command",
        ],
        [":username :prefix:command", "username /command"],
    ])('should log request with "%s" format', (format, expected) => {
        const mockDiscord = new MockDiscord()
        const counter = new Counter()
        const message = mockDiscord.mockCommandInteraction(undefined, {
            name: "command",
        })
        let content = ""
        const stream = new PassThrough()

        stream.on("data", (str) => {
            content += String(str)
        })

        const request = createRequest(message)

        const middleware = logger({format, stream})

        middleware(request, createResponse(message), counter.increment)

        stream.end()
        stream.destroy()

        expect(counter.callCount).toBe(1)
        expect(content.trim()).toEqual(expected)
    })

    test.each<[(tokens: Tokens, request: Request, response: Response) => string, string]>([
        [
            (tokens, req) =>
                `${tokens.username(req)}#:discriminator ${tokens.guild(
                    req,
                )} :channel - ${tokens.type(req)} :prefix:command`,
            "username#0000 mocked js guild guild-channel - interaction /command",
        ],
        [
            (tokens, req) => `:username ${tokens.prefix(req)}${tokens.command(req)}`,
            "username /command",
        ],
    ])("should log request with function format", (format, expected) => {
        const mockDiscord = new MockDiscord()
        const counter = new Counter()
        const message = mockDiscord.mockCommandInteraction(undefined, {
            name: "command",
        })
        let content = ""
        const stream = new PassThrough()

        stream.on("data", (str) => {
            content += String(str)
        })

        const request = createRequest(message)

        const middleware = logger({format, stream})

        middleware(request, createResponse(message), counter.increment)

        stream.end()
        stream.destroy()

        expect(counter.callCount).toBe(1)
        expect(content.trim()).toEqual(expected)
    })
})
