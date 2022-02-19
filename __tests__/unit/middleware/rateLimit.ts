import {Awaiter} from "../../utils"
import MockDiscord from "~/__mocks__/discord"
import {createRequest} from "~/src/request"
import {createResponse} from "~/src/response"
import rateLimit from "~/src/middleware/rateLimit"

describe("rateLimit", () => {
    test("should rate limit", async () => {
        const mockDiscord = new MockDiscord()
        const awaiter = new Awaiter()
        let didResolve = false
        const message = mockDiscord.mockMessage({
            channel_id: mockDiscord.dmChannel.id,
        })

        const request = createRequest(message)
        const middleware = rateLimit({
            handler: () => {
                didResolve = true
            },
            max: 10,
        })

        const wait = awaiter.waitFor(10, 1000)

        for (let _ = 0; _ <= 10; _++) {
            middleware(request, createResponse(message), awaiter.increment)
        }

        await wait

        expect(didResolve).toBe(true)
    })

    test.each([
        ["guild", "mockGuild"],
        ["channel", "mockGuildChannel"],
        ["user", "mockUser"],
        [(request: import("~/src").Request) => request.guildId as string, "mockGuild"],
    ] as const)("should rate limit by %s", async (rateLimitBy, mockProp) => {
        const mockDiscord = new MockDiscord()
        const awaiter = new Awaiter()
        let didResolve = false
        let message = mockDiscord.mockMessage()

        let request = createRequest(message)
        const middleware = rateLimit({
            rateLimitBy,
            handler: () => {
                didResolve = true
            },
            max: () => 10,
        })

        let wait = awaiter.waitFor(10, 1000)

        for (let _ = 0; _ <= 10; _++) {
            middleware(request, createResponse(message), awaiter.increment)
        }

        await wait

        expect(didResolve).toBe(true)

        mockDiscord[mockProp]()
        message = mockDiscord.mockMessage()
        request = createRequest(message)
        didResolve = false
        wait = awaiter.waitFor(10, 1000)

        for (let _ = 0; _ <= 10; _++) {
            middleware(request, createResponse(message), awaiter.increment)
        }

        await wait

        expect(didResolve).toBe(true)
    })
})
