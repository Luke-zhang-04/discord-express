/**
 * Details for the hit counter store
 *
 * @license MIT
 * @copyright 2021 Nathan Friedly, 2022 Luke Zhang
 * @see https://github.com/nfriedly/express-rate-limit
 */

import {type MaybePromise} from "@luke-zhang-04/utils"
import {type RateLimitOptions} from "."

const calculateNextResetTime = (windowMs: number): Date => {
    const resetTime = new Date()
    resetTime.setMilliseconds(resetTime.getMilliseconds() + windowMs)
    return resetTime
}

/** Response from the `Store` when a client's hit counter is incremented */
export interface IncrementResponse {
    /** The number of hits for that client so far */
    totalHits: number
    /** The time when the counter resets */
    resetTime?: Date
}

/** An interface that all hit counter stores must implement. */
export interface Store {
    /**
     * Method that initializes the store, and has access to the options passed to the middleware too.
     *
     * @remarks
     * Use a constructor when possible
     * @param options - The options used to setup the middleware.
     */
    init?: (options: RateLimitOptions) => MaybePromise<void>

    /**
     * Method to increment a client's hit counter.
     *
     * @param key - The identifier for a client.
     * @returns The number of hits and reset time for that client.
     */
    increment: (key: string) => MaybePromise<IncrementResponse>

    /**
     * Method to decrement a client's hit counter.
     *
     * @param key - The identifier for a client.
     */
    decrement: (key: string) => MaybePromise<void>

    /**
     * Method to reset a client's hit counter.
     *
     * @param key - The identifier for a client.
     */
    resetKey: (key: string) => MaybePromise<void>

    /** Method to reset everyone's hit counter. */
    resetAll?: () => MaybePromise<void>
}

export class MemoryStore implements Store {
    /** The duration of time before which all hit counts are reset (in milliseconds). */
    public readonly windowMs: number

    /** The map that stores the number of hits for each client in memory. */
    public hits: {
        [key: string]: number | undefined
    }

    /** The time at which all hit counts will be reset. */
    public resetTime: Date

    public constructor(options: RateLimitOptions & Required<Pick<RateLimitOptions, "windowMs">>) {
        // Get the duration of a window from the options
        this.windowMs = options.windowMs
        // Then calculate the reset time using that
        this.resetTime = calculateNextResetTime(this.windowMs)

        // Initialise the hit counter map
        this.hits = {}

        // Reset hit counts for ALL clients every `windowMs` - this will also
        // re-calculate the `resetTime`
        const interval = setInterval(async () => {
            await this.resetAll()
        }, this.windowMs)

        interval.unref?.()
    }

    /**
     * Method to increment a client's hit counter.
     *
     * @param key {string} - The identifier for a client.
     * @returns {IncrementResponse} - The number of hits and reset time for that client.
     * @public
     */
    public increment(key: string): IncrementResponse {
        const totalHits = (this.hits[key] ?? 0) + 1
        this.hits[key] = totalHits

        return {
            totalHits,
            resetTime: this.resetTime,
        }
    }

    /**
     * Method to decrement a client's hit counter.
     *
     * @param key {string} - The identifier for a client.
     * @public
     */
    public decrement(key: string): void {
        const current = this.hits[key]
        if (current) {
            this.hits[key] = current - 1
        }
    }

    /**
     * Method to reset a client's hit counter.
     *
     * @param key {string} - The identifier for a client.
     * @public
     */
    public resetKey(key: string): void {
        delete this.hits[key]
    }

    /**
     * Method to reset everyone's hit counter.
     *
     * @public
     */
    public resetAll(): void {
        this.hits = {}
        this.resetTime = calculateNextResetTime(this.windowMs)
    }
}
