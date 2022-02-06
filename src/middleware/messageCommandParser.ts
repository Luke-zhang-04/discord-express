import {type DiscordExpressHandler} from ".."
import {escapeRegex} from "@luke-zhang-04/utils"
import {parseArgsStringToArgv as stringArgv} from "string-argv"

/* eslint-disable @typescript-eslint/no-non-null-assertion */

const parseArgs = (
    str: string,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    RegexProvier: RegExpConstructor = RegExp,
): {[key: string]: unknown; _: string[]} | undefined => {
    const argArray = stringArgv(str)
    const args: {[key: string]: unknown} = {}
    const positional = []

    let index = 0

    for (; index < argArray.length; index++) {
        const arg = argArray[index]!

        if (arg.startsWith("-")) {
            break
        }

        positional.push(arg)
    }

    let currentFlag: string | undefined = undefined
    let flagValues: string[] = []

    for (; index < argArray.length; index++) {
        const arg = argArray[index]!

        if (arg.startsWith("-")) {
            if (currentFlag) {
                switch (flagValues.length) {
                    case 0:
                        args[currentFlag] = true

                        break
                    case 1:
                        args[currentFlag] = flagValues[0]!

                        break
                    default:
                        args[currentFlag] = flagValues
                }
            }

            currentFlag = arg.replace(new RegexProvier(/^-{1,2}/u, "u"), "")
            flagValues = []

            const equalsMatch = currentFlag.match(
                new RegexProvier(/^(?<flag>[A-z1-9]+)=(?<value>.*)/u, "u"),
            )

            if (equalsMatch?.groups) {
                if (equalsMatch.groups.flag) {
                    currentFlag = equalsMatch.groups.flag
                }
                if (equalsMatch.groups.value) {
                    flagValues.push(
                        ...equalsMatch.groups.value
                            .replace(new RegexProvier(/^['"]|['"]$/gu, "gu"), "")
                            .split(" "),
                    )
                }
            }
        } else {
            flagValues.push(arg.replace(new RegexProvier(/^['"]|['"]$/gu, "gu"), ""))
        }
    }

    if (currentFlag) {
        switch (flagValues.length) {
            case 0:
                args[currentFlag] = true

                break
            case 1:
                args[currentFlag] = flagValues[0]!

                break
            default:
                args[currentFlag] = flagValues
        }
    }

    return {...args, _: positional}
}

export interface MessageCommandParserOptions {
    /**
     * Bot prefix on top of a direct mention to the bot. Dynamic prefixes will require a custom
     * implementation
     */
    prefix?: string

    /** Optionally set a custom regex provider, such as RE2 */
    regexProvider?: RegExpConstructor
}

/**
 * MessageCommandParser is a forgiving implementation of an argv parser, simillar to the command
 * line. The parsed options are put in the body. "Positional" arguments are put in the "_" field.
 * See example below.
 *
 * @example
 *
 * ```ts
 * const intput = "!myCommand a b c d --flag"
 *
 * // Becomes
 * const output = {
 *     _: ["a", "b", "c", "d"],
 *     flag: true,
 * }
 *
 * const intput = "<@BOT_ID> anotherCommand -flag a b c d --option=10"
 *
 * // Becomes
 * const output = {
 *     flag: ["a", "b", "c", "d"],
 *     option: "10",
 * }
 * ```
 */
export const messageCommandParser =
    ({
        prefix,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        regexProvider: RegexProvider = RegExp,
    }: MessageCommandParserOptions = {}): DiscordExpressHandler =>
    (request, _, next) => {
        if (!request.message) {
            next()

            return
        } else if (!request.client?.user?.id) {
            throw new Error("Client user id not defined")
        }

        const prefixRegex = new RegexProvider(
            `^(?<prefix><@[!&]?${request.client.user.id}> ?${
                prefix ? `|${escapeRegex(prefix)}` : ""
            })(?<command>[A-z1-9]+)(?<rest>.*)`,
            "u",
        )

        const match = request.message.content.match(prefixRegex)

        if (match?.groups?.command && match.groups.rest !== undefined) {
            const parsedArguments = parseArgs(match.groups.rest, RegexProvider)

            request.body = parsedArguments
            request.command = [match.groups.command, parsedArguments?._[0], parsedArguments?._[1]]

            next()
        } else {
            return
        }
    }

export default messageCommandParser
