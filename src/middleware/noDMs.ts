import {type DiscordExpressHandler} from ".."

export interface NoDMsOptions {
    /** User IDs which are allowed to interact with the bot in DMS */
    allowedUsers?: string[]
}

/** NoDMs stops users from interacting with the bot from a direct message channel */
export const noDMs =
    ({allowedUsers = []}: NoDMsOptions = {}): DiscordExpressHandler =>
    (request, _, next) => {
        if (request.channel?.type === "DM" && !allowedUsers.includes(request.author.id)) {
            return
        }

        next()
    }

export default noDMs
