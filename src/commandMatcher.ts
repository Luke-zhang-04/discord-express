import {runIfDefined, isObject} from "@luke-zhang-04/utils"
import Case from "case"
import type {CommandArray} from "./client"
import type {Request} from "./request"

export const matchCommand = (
    commandArray: CommandArray,
    {body, command, requestType}: Request,
): boolean => {
    const isMatchingCommand = commandArray[0] === "*" || commandArray[0] === command[0]
    const isMatchingSubCommandGroup =
        commandArray[1] === "*" || commandArray[0] === "*" || commandArray[1] === command[1]
    const isMatchingSubCommand =
        commandArray[2] === "*" ||
        commandArray[1] === "*" ||
        commandArray[0] === "*" ||
        commandArray[2] === command[2]

    if (requestType === "interaction") {
        // Since camelCase is not allowed by discord slash commands, a conversion is made
        const isMatchingKebabCommand = Case.kebab(commandArray[0]) === command[0]
        const isMatchingKebabSubCommandGroup =
            runIfDefined(commandArray[1], Case.kebab) === command[1]
        const isMatchingKebabSubCommand = runIfDefined(commandArray[2], Case.kebab) === command[2]

        if (
            !isMatchingCommand &&
            isMatchingKebabCommand &&
            command[0] !== undefined &&
            commandArray[0] !== undefined
        ) {
            command[0] = commandArray[0]
        }
        if (
            !isMatchingSubCommandGroup &&
            isMatchingKebabSubCommandGroup &&
            command[1] !== undefined &&
            commandArray[1] !== undefined
        ) {
            command[1] = commandArray[1]
        }
        if (
            !isMatchingSubCommand &&
            isMatchingKebabSubCommand &&
            command[2] !== undefined &&
            commandArray[2] !== undefined
        ) {
            command[2] = commandArray[2]
        }

        return (
            (isMatchingCommand || isMatchingKebabCommand) &&
            (isMatchingSubCommandGroup || isMatchingKebabSubCommandGroup) &&
            (isMatchingSubCommand || isMatchingKebabSubCommand)
        )
    }

    if (commandArray.length === 1) {
        if (isMatchingCommand) {
            return true
        }
    } else if (commandArray.length === 2) {
        if (isMatchingCommand && isMatchingSubCommandGroup) {
            if (isObject(body) && body._ instanceof Array) {
                body._.splice(0, 1)
            }

            return true
        }
    } else if (commandArray.length === 3) {
        if (isMatchingCommand && isMatchingSubCommandGroup && isMatchingSubCommand) {
            if (isObject(body) && body._ instanceof Array) {
                body._.splice(0, 2)
            }

            return true
        }
    }

    return false
}

export default matchCommand
