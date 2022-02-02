import {type DiscordExpressHandler} from ".."

export interface BlacklistOptions {
    /** Array of guild IDs to blacklist */
    guilds?: string[]
    /** Array of user IDs to blacklist */
    users?: string[]
}

/** Blacklist stops the middleware chain from continuing if the request meets the blacklist criteria. */
export const blacklist =
    ({guilds = [], users = []}: BlacklistOptions = {}): DiscordExpressHandler =>
    (request, _, next) => {
        if (
            (request.guildId && guilds.includes(request.guildId)) ||
            users.includes(request.author.id)
        ) {
            return
        }

        next()
    }

export default blacklist
