import {DiscordExpressHandler} from ".."
import {noBots} from "./noBots"
import {noDMs} from "./noDMs"

interface RecommendedOptions {
    allowBots?: boolean
    allowDMs?: boolean
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
}: RecommendedOptions = {}): DiscordExpressHandler[] => {
    const middlewares: DiscordExpressHandler[] = []

    if (!allowBots) {
        middlewares.push(noBots())
    }
    if (!allowDMs) {
        middlewares.push(noDMs())
    }

    return middlewares
}

export {noBots}
