import type {Request} from "./request"
import type {BaseResponse as Response} from "./response"

export type {Request, Response}

export type NextFunc = (error?: unknown) => void

export type DiscordExpressHandler = (
    request: Request,
    response: Response,
    nextFunc: NextFunc,
) => void
