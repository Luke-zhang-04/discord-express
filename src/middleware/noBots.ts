import {type DiscordExpressHandler} from ".."

export interface NoBotsOptions {
    allowWebhooks?: boolean
}

/** NoBots makes sure commands aren't from bots */
export const noBots =
    ({allowWebhooks = false}: NoBotsOptions = {}): DiscordExpressHandler =>
    (request, _, next) => {
        if (
            request.author.bot ||
            (!allowWebhooks && request.message?.webhookId) ||
            request.interaction?.user.bot
        ) {
            return
        }

        next()
    }

export default noBots
