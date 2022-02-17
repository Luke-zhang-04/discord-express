/**
 * Rate limit middleware for discord-express, derived from express-rate-limit
 *
 * @license MIT
 * @copyright 2021 Nathan Friedly, 2022 Luke Zhang
 * @see https://github.com/nfriedly/express-rate-limit
 */

import {type Store, MemoryStore} from "./store"
import type {Request, Response} from "../.."
import {type DiscordExpressHandler} from "../.."
import {type MaybePromise} from "@luke-zhang-04/utils"
import {NextFunc} from "../../types"

export type RateLimitMethods = "guild" | "channel" | "user" | "guildUser" | "channelUser"

export interface RateLimitOptions {
    /**
     * What to rate limit with. E.g `user` will rate limit by user id, and using `guilduser` will
     * combine guild and user.
     *
     * If a function is included, it will be run to determine the key
     *
     * @default user
     */
    rateLimitBy?: RateLimitMethods | ((request: Request) => MaybePromise<string>)

    /**
     * Rate limit window for number of milliseconds a request is remembered
     *
     * @default 60_000
     */
    windowMs?: number

    /**
     * The maximum number of requests within `windowMs` before the client is rate limited
     *
     * A function may be used to determine this value based on the request
     *
     * @default 5
     */
    max?: number | ((request: Request) => MaybePromise<number>)

    /**
     * Message to send when the client is rate limited
     *
     * @default 'You are being rate limited'
     */
    message?: string

    /**
     * Handle rate limit reached. If provided, this will override the default behaviour of sending
     * `message` to the client.
     */
    handler?: (
        request: Request,
        response: Response,
        next: NextFunc,
        options: RateLimitOptions,
    ) => MaybePromise<void>

    /** Determine if a request should be skipped */
    skip?: (request: Request) => MaybePromise<void>

    /**
     * Any implementation of the `Store` interface
     *
     * @default new MemoryStore()
     * @see {Store}
     */
    store?: Store

    /**
     * The property name to store rate limit data in the `metadata` field in the request
     *
     * @default 'rateLimit'
     */
    metaPropertyName?: string
}

const getKeyFromRatelimitMethod = (request: Request, method: RateLimitMethods): string => {
    switch (method) {
        case "user":
            return request.user.id
        case "channel":
            return request.channelId ?? `noChannel-${request.user.id}`
        case "guild":
            return request.guildId ?? `noGuild-${request.user.id}`
        case "guildUser":
            return request.guildId
                ? `${request.guildId}-${request.user.id}`
                : `noGuild-${request.user.id}`
        case "channelUser":
            return request.channelId
                ? `${request.channelId}-${request.user.id}`
                : `noChannel-${request.user.id}`
        default:
            throw new Error(
                `rate limit method must be one of [user, channel, guild, guildUser, channelUser], found ${method}`,
            )
    }
}

/** RateLimit rate limits a user, guild, or channel from using the application or a certain route */
export const rateLimit = ({
    rateLimitBy = "user",
    windowMs = 60_000,
    max = 5,
    message = "You are being rate limited",
    metaPropertyName = "rateLimit",
    handler,
    skip,
    store: _store,
}: RateLimitOptions = {}): DiscordExpressHandler => {
    const options = {
        rateLimitBy,
        windowMs,
        max,
        message,
        handler,
        skip,
    }

    const store: Store = _store ?? new MemoryStore(options)

    store.init?.(options)

    return async (request, response, next) => {
        if (skip?.(request)) {
            next()
        }

        const key =
            typeof rateLimitBy === "function"
                ? await rateLimitBy(request)
                : getKeyFromRatelimitMethod(request, rateLimitBy)

        // Increment the client's hit counter by one
        const {totalHits, resetTime} = await store.increment(key)

        const maxHits = typeof max === "function" ? await max(request) : max

        request.metadata[metaPropertyName] = {
            limit: maxHits,
            current: totalHits,
            remaining: Math.max(maxHits - totalHits, 0),
            resetTime,
        }

        // If the client has exceeded their rate limit, set the Retry-After header
        // and call the `handler` function
        if (totalHits > maxHits) {
            if (handler) {
                await handler(request, response, next, options)
            } else {
                await response.replyEphemeral({content: message, fallback: "normal"})
            }

            return
        }

        next()
    }
}

export default rateLimit
