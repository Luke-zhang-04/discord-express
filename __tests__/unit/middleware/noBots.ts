import {Counter} from "../../utils"
import MockDiscord from "~/__mocks__/discord"
import {createRequest} from "~/src/request"
import {createResponse} from "~/src/response"
import noBots from "~/src/middleware/noBots"

describe("noBots", () => {
    test("should not call next if author is a bot", () => {
        const mockDiscord = new MockDiscord()
        const counter = new Counter()
        const message = mockDiscord.mockMessage({
            author: {
                ...mockDiscord.apiUser,
                bot: true,
            },
        })
        const request = createRequest(message)

        const middleware = noBots()

        middleware(request, createResponse(message), counter.increment)

        expect(counter.callCount).toBe(0)
    })

    test("should not call next if author is a webhook", () => {
        const mockDiscord = new MockDiscord()
        const counter = new Counter()
        const message = mockDiscord.mockMessage({
            webhook_id: Date.now().toString(),
        })
        const request = createRequest(message)

        const middleware = noBots()

        middleware(request, createResponse(message), counter.increment)

        expect(counter.callCount).toBe(0)
    })

    test("should call next if author is not a bot", () => {
        const mockDiscord = new MockDiscord()
        const counter = new Counter()
        const message = mockDiscord.mockMessage()
        const request = createRequest(message)

        const middleware = noBots()

        middleware(request, createResponse(message), counter.increment)

        expect(counter.callCount).toBe(1)
    })
})
