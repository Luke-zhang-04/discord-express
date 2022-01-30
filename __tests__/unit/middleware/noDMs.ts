import MockDiscord from "../../../__mocks__/discord"
import {MockNext} from "../../../__mocks__/discord-express"
import {createRequest} from "../../../src/request"
import {createResponse} from "../../../src/response"
import noDMs from "../../../src/middleware/noDMs"

describe("noDMs", () => {
    test("should not call next if author is in DMs", async () => {
        const mockDiscord = new MockDiscord()
        const mockNext = new MockNext()
        const message = mockDiscord.mockMessage({
            channel_id: mockDiscord.dmChannel.id,
        })

        const request = createRequest(message)

        const middleware = noDMs()

        middleware(request, createResponse(message), mockNext.next.bind(mockNext))

        expect(mockNext.callCount).toBe(0)
    })

    test("should call next if author is in allowedUsers", async () => {
        const mockDiscord = new MockDiscord()
        const mockNext = new MockNext()
        const message = mockDiscord.mockMessage({
            channel_id: mockDiscord.dmChannel.id,
        })
        const request = createRequest(message)

        const middleware = noDMs({allowedUsers: [mockDiscord.user.id]})

        middleware(request, createResponse(message), mockNext.next.bind(mockNext))

        expect(mockNext.callCount).toBe(1)
    })

    test("should call next if author is not in DMs", async () => {
        const mockDiscord = new MockDiscord()
        const mockNext = new MockNext()
        const message = mockDiscord.mockMessage()
        const request = createRequest(message)

        const middleware = noDMs()

        middleware(request, createResponse(message), mockNext.next.bind(mockNext))

        expect(mockNext.callCount).toBe(1)
    })
})
