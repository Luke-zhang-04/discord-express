import MockDiscord from "../../../__mocks__/discord"
import {MockNext} from "../../../__mocks__/discord-express"
import {createRequest} from "../../../src/request"
import {createResponse} from "../../../src/response"
import messageCommandParser from "../../../src/middleware/messageCommandParser"

describe("messageCommandParser", () => {
    describe("parse command", () => {
        test("should parse command with ping", () => {
            const mockDiscord = new MockDiscord()
            const mockNext = new MockNext()
            const message = mockDiscord.mockMessage()
            const request = createRequest(message)

            message.content = `<@${message.client.user?.id}> myCommand`

            const middleware = messageCommandParser({prefix: "!"})

            middleware(request, createResponse(message), mockNext.next.bind(mockNext))

            expect(mockNext.callCount).toBe(1)
            expect(request.body).toMatchObject({_: []})
            expect(request.command[0]).toBe("myCommand")
        })

        test("should parse command with prefix", () => {
            const mockDiscord = new MockDiscord()
            const mockNext = new MockNext()
            const message = mockDiscord.mockMessage({
                content: "!myCommand123",
            })
            const request = createRequest(message)

            const middleware = messageCommandParser({prefix: "!"})

            middleware(request, createResponse(message), mockNext.next.bind(mockNext))

            expect(mockNext.callCount).toBe(1)
            expect(request.body).toMatchObject({_: []})
            expect(request.command[0]).toBe("myCommand123")
        })
    })

    describe.each([
        {
            name: "positional arguments",
            data: [
                ["a b c d", {_: ["a", "b", "c", "d"]}],
                ['"a b" c d', {_: ["a b", "c", "d"]}],
            ],
        },
        {
            name: "flags",
            data: [
                ["-flag a --flag2 a b -flag3", {flag: "a", flag2: ["a", "b"], flag3: true}],
                [
                    '--flag="a" -flag2 --flag3=1 2 3 abcd',
                    {flag: "a", flag2: true, flag3: ["1", "2", "3", "abcd"]},
                ],
            ],
        },
        {
            name: "positional arguments and flags",
            data: [
                [
                    "a b c 1 2 3 -flag --flag2 abc",
                    {_: ["a", "b", "c", "1", "2", "3"], flag: true, flag2: "abc"},
                ],
                [
                    "'ab' c 1 '2 3' -flag=x \"y 9\" 10 --flag2",
                    {_: ["ab", "c", "1", "2 3"], flag: ["x", "y 9", "10"], flag2: true},
                ],
            ],
        },
    ])("parsing $name", ({name, data}) => {
        test.each(data)(`should parse command with ${name}`, (input, output) => {
            const mockDiscord = new MockDiscord()
            const mockNext = new MockNext()
            const message = mockDiscord.mockMessage({
                content: `!myCommand2 ${input}`,
            })
            const request = createRequest(message)

            const middleware = messageCommandParser({prefix: "!"})

            middleware(request, createResponse(message), mockNext.next.bind(mockNext))

            expect(mockNext.callCount).toBe(1)
            expect(request.body).toMatchObject(output)
        })
    })
})
