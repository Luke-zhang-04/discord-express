import {type NoDMsOptions, noDMs} from "./noDMs"
import {DiscordExpressHandler} from ".."
import {noBots} from "./noBots"

interface RecommendedOptions {
    allowBots?: boolean
    allowDMs?: boolean
    noDMsOptons?: NoDMsOptions
}

/**
 * Recommended middleware to include with every bot
 *
 * @example
 *
 * ```ts
 * import * as middleware from "discord-express/middleware"
 *
 * client.use(...middleware.recommended())
 *
 * // E.g allow bot in DMs
 * client.use(
 *     ...middleware.recommended({
 *         allowDMs: true,
 *     }),
 * )
 * ```
 */
export const recommended = ({
    allowBots = false,
    allowDMs = false,
    noDMsOptons,
}: RecommendedOptions = {}): DiscordExpressHandler[] => {
    const middlewares: DiscordExpressHandler[] = []

    if (!allowBots) {
        middlewares.push(noBots())
    }
    if (!allowDMs) {
        middlewares.push(noDMs(noDMsOptons))
    }

    return middlewares
}

export {noBots, noDMs}

export {blacklist} from "./blacklist"
export {logger} from "./logger"
export {messageCommandParser} from "./messageCommandParser"
export {rateLimit} from "./rateLimit"
