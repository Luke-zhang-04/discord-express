import {Counter} from "../../utils"
import MockDiscord from "~/__mocks__/discord"
import blacklist from "~/src/middleware/blacklist"
import {createRequest} from "~/src/request"
import {createResponse} from "~/src/response"

describe("blacklist", () => {
    test("should not call next if user is blacklisted", () => {
        const userId = "100"
        const mockDiscord = new MockDiscord({
            userOptions: {
                id: userId,
            },
        })
        const counter = new Counter()
        const message = mockDiscord.mockMessage()
        const request = createRequest(message)

        const middleware = blacklist({
            users: [userId],
        })

        middleware(request, createResponse(message), counter.increment)

        expect(counter.callCount).toBe(0)
    })

    test("should not call next if guild is blacklisted", () => {
        const guildId = "100"
        const mockDiscord = new MockDiscord({
            guildOptions: {
                id: guildId,
            },
        })
        const counter = new Counter()
        const message = mockDiscord.mockMessage({
            channel_id: mockDiscord.guildChannel.id,
        })
        const request = createRequest(message)

        const middleware = blacklist({
            guilds: [guildId],
        })

        middleware(request, createResponse(message), counter.increment)

        expect(counter.callCount).toBe(0)
    })

    test("should call next if user is blacklisted", () => {
        const mockDiscord = new MockDiscord({})
        const counter = new Counter()
        const message = mockDiscord.mockMessage()
        const request = createRequest(message)

        const middleware = blacklist({
            users: ["100"],
        })

        middleware(request, createResponse(message), counter.increment)

        expect(counter.callCount).toBe(1)
    })

    test("should call next if guild is blacklisted", () => {
        const mockDiscord = new MockDiscord({})
        const counter = new Counter()
        const message = mockDiscord.mockMessage({
            channel_id: mockDiscord.guildChannel.id,
        })
        const request = createRequest(message)

        const middleware = blacklist({
            guilds: ["100"],
        })

        middleware(request, createResponse(message), counter.increment)

        expect(counter.callCount).toBe(1)
    })
})
