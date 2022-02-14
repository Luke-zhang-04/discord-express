import type {InteractionRequest, MessageRequest, Request} from "./request"
import type {InteractionResponse, MessageResponse, Response} from "./response"

export type {Request, Response}

export type NextFunc = (error?: unknown) => void

export type DiscordExpressHandler = (
    request: Request,
    response: Response,
    nextFunc: NextFunc,
) => void

export type DiscordExpressMessageHandler = (
    request: MessageRequest,
    response: MessageResponse,
    nextFunc: NextFunc,
) => void

export type DiscordExpressInteractionCommandHandler = (
    request: InteractionRequest,
    response: InteractionResponse,
    nextFunc: NextFunc,
) => void

export type DiscordExpressErrorHandler = (
    error: unknown,
    request: Request,
    response: Response,
    nextFunc: NextFunc,
) => void
