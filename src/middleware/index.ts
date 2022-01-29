import {type NoBotsOptions,noBots, } from "./noBots"
import {type NoDMsOptions, noDMs} from "./noDMs"
import {DiscordExpressHandler} from ".."

interface RecommendedOptions {
    allowBots?: boolean
    noBotsOptions?: NoBotsOptions
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
    noBotsOptions,
    allowDMs = false,
    noDMsOptons,
}: RecommendedOptions = {}): DiscordExpressHandler[] => {
    const middlewares: DiscordExpressHandler[] = []

    if (!allowBots) {
        middlewares.push(noBots(noBotsOptions))
    }
    if (!allowDMs) {
        middlewares.push(noDMs(noDMsOptons))
    }

    return middlewares
}

export {noBots, noDMs}

export {messageCommandParser} from "./messageCommandParser"
