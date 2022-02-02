import MockDiscord from "../../../__mocks__/discord"
import {MockNext} from "../../../__mocks__/discord-express"
import {createRequest} from "../../../src/request"
import {createResponse} from "../../../src/response"
import blacklist from "../../../src/middleware/blacklist"

describe("blacklist", () => {
    test("should not call next if user is blacklisted", () => {
        const userId = "100"
        const mockDiscord = new MockDiscord({
            userOptions: {
                id: userId,
            },
        })
        const mockNext = new MockNext()
        const message = mockDiscord.mockMessage()
        const request = createRequest(message)

        const middleware = blacklist({
            users: [userId],
        })

        middleware(request, createResponse(message), mockNext.next.bind(mockNext))

        expect(mockNext.callCount).toBe(0)
    })

    test("should not call next if guild is blacklisted", () => {
        const guildId = "100"
        const mockDiscord = new MockDiscord({
            guildOptions: {
                id: guildId,
            },
        })
        const mockNext = new MockNext()
        const message = mockDiscord.mockMessage({
            channel_id: mockDiscord.guildChannel.id,
        })
        const request = createRequest(message)

        const middleware = blacklist({
            guilds: [guildId],
        })

        middleware(request, createResponse(message), mockNext.next.bind(mockNext))

        expect(mockNext.callCount).toBe(0)
    })

    test("should call next if user is blacklisted", () => {
        const mockDiscord = new MockDiscord({})
        const mockNext = new MockNext()
        const message = mockDiscord.mockMessage()
        const request = createRequest(message)

        const middleware = blacklist({
            users: ["100"],
        })

        middleware(request, createResponse(message), mockNext.next.bind(mockNext))

        expect(mockNext.callCount).toBe(1)
    })

    test("should call next if guild is blacklisted", () => {
        const mockDiscord = new MockDiscord({})
        const mockNext = new MockNext()
        const message = mockDiscord.mockMessage({
            channel_id: mockDiscord.guildChannel.id,
        })
        const request = createRequest(message)

        const middleware = blacklist({
            guilds: ["100"],
        })

        middleware(request, createResponse(message), mockNext.next.bind(mockNext))

        expect(mockNext.callCount).toBe(1)
    })
})
