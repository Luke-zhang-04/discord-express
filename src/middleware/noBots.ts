import {type DiscordExpressHandler} from ".."

export interface NoBotsOptions {}

/** NoBots makes sure commands aren't from bots */
export const noBots = (): DiscordExpressHandler => (request, _, next) => {
    if (request.author.bot || request.message?.webhookId || request.interaction?.user.bot) {
        return
    }

    next()
}

export default noBots
