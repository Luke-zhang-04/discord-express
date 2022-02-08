import {Counter} from "../../utils"
import MockDiscord from "~/__mocks__/discord"
import {createRequest} from "~/src/request"
import {createResponse} from "~/src/response"
import noDMs from "~/src/middleware/noDMs"

describe("noDMs", () => {
    test("should not call next if author is in DMs", () => {
        const mockDiscord = new MockDiscord()
        const counter = new Counter()
        const message = mockDiscord.mockMessage({
            channel_id: mockDiscord.dmChannel.id,
        })

        const request = createRequest(message)

        const middleware = noDMs()

        middleware(request, createResponse(message), counter.increment)

        expect(counter.callCount).toBe(0)
    })

    test("should call next if author is in allowedUsers", () => {
        const mockDiscord = new MockDiscord()
        const counter = new Counter()
        const message = mockDiscord.mockMessage({
            channel_id: mockDiscord.dmChannel.id,
        })
        const request = createRequest(message)

        const middleware = noDMs({allowedUsers: [mockDiscord.user.id]})

        middleware(request, createResponse(message), counter.increment)

        expect(counter.callCount).toBe(1)
    })

    test("should call next if author is not in DMs", () => {
        const mockDiscord = new MockDiscord()
        const counter = new Counter()
        const message = mockDiscord.mockMessage()
        const request = createRequest(message)

        const middleware = noDMs()

        middleware(request, createResponse(message), counter.increment)

        expect(counter.callCount).toBe(1)
    })
})
