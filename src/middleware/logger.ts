import {type DiscordExpressHandler, type Request, type Response} from ".."
import {type Writable as WriteStream} from "stream"

const addZero = (str: string): string => (str.length === 1 ? `0${str}` : str)

const clfMonths = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
]

/** Format a Date in common log format */
const clfdate = (date: Date): string => {
    const year = date.getUTCFullYear()
    const month = clfMonths[date.getUTCMonth()]
    const day = date.getUTCDate()
    const hours = date.getUTCHours()
    const minutes = date.getUTCMinutes()
    const seconds = date.getUTCSeconds()

    return `${addZero(day.toString())}/${month}/${year}:${addZero(hours.toString())}:${addZero(
        minutes.toString(),
    )}:${addZero(seconds.toString())} +0000`
}

const tokens = {
    username: (request: Request): string => request.user.username,
    discriminator: (request: Request): string => request.user.discriminator,
    userId: (request: Request): string => request.user.id,
    type: (request: Request): string => request.requestType,
    startAt: (request: Request, format: "clf" | "iso" | "web" = "web"): string => {
        switch (format) {
            case "clf":
                return clfdate(request.startAt)
            case "iso":
                return request.startAt.toISOString()
            default:
                return request.startAt.toUTCString()
        }
    },
    date: (_request: Request, format: "clf" | "iso" | "web" = "web"): string => {
        const date = new Date()

        switch (format) {
            case "clf":
                return clfdate(date)
            case "iso":
                return date.toISOString()
            default:
                return date.toUTCString()
        }
    },
    guild: (request: Request): string =>
        request.guild?.name ?? `DM-${request.user.username}#${request.user.discriminator}`,
    guildId: (request: Request): string => request.guildId ?? `DM-${request.user.id}`,
    channel: (request: Request): string =>
        request.channelId
            ? request.guild?.channels.cache.find((channel) => channel.id === request.channelId)
                  ?.name ?? `NOT-FOUND-${request.user.username}#${request.user.discriminator}`
            : `DM-${request.user.username}#${request.user.discriminator}`,
    channelId: (request: Request): string => request.channelId ?? `DM-${request.user.id}`,
    command: (request: Request): string => request.command.filter((val) => Boolean(val)).join("/"),
    prefix: (request: Request): string =>
        typeof request.metadata.prefix === "string" ? request.metadata.prefix : "/",
}

export type Tokens = typeof tokens

const formats = {
    tiny: ":prefix:command",
    short: ":username#:discriminator :prefix:command",
    combined: ':startAt - :username#:discriminator | :guild | :channel - :type ":prefix:command"',
}

export type Formats = typeof formats

const formatString = (request: Request, str: string): string =>
    str.replace(/:[a-zA-Z]+/gu, (param): string => {
        const key = param.slice(1) // Remove colon

        return key in tokens ? tokens[key as keyof typeof tokens](request) : str
    })

const getFormat = (format: string): string =>
    format in formats ? formats[format as keyof typeof formats] : format

export interface LoggerOptions {
    format?:
        | string
        | keyof typeof formats
        | ((_tokens: typeof tokens, request: Request, response: Response) => string)
    stream?: WriteStream
}

/**
 * Logger logs requests to a stream, or stdout by default
 *
 * @example
 *
 * ```ts
 * client.use(logger({format: "tiny"}))
 * client.use(logger({format: ":date - :username#:discriminator :type :command"}))
 * client.use(
 *     logger({
 *         format: (tokens, req) =>
 *             `:username#:discriminator ${tokens.date(req, "clf")} ":requestType :command"`,
 *     }),
 * )
 * ```
 */
export const logger =
    ({format = "combined", stream = process.stdout}: LoggerOptions = {}): DiscordExpressHandler =>
    (request, response, next) => {
        const formattedLine =
            typeof format === "function"
                ? formatString(request, format(tokens, request, response))
                : formatString(request, getFormat(format))

        stream.write(`${formattedLine}\n`)

        next()
    }

export default logger
