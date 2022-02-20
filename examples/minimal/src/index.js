// https://discord.com/api/oauth2/authorize?client_id=936421848982355969&permissions=8&scope=applications.commands%20bot

import {Client, builtins, createCommands, middleware} from "discord-express"
import {MessageEmbed} from "discord.js"
import dotenv from "dotenv"

dotenv.config()

/** @type {import("discord-express").Commands} */
const commands = {
    echo: {
        description: `Echo a message`,
        options: {
            repeat: {
                type: "integer",
                description: "Number of times to repeat",
                min: 1,
                max: 10,
                required: false,
            },
            content: {
                type: "string",
                description: "Content to echo",
                required: true,
            },
            type: {
                type: "string",
                description: "Echo message type",
                choices: ["normal", "embed"],
            },
        },
    },
    help: builtins.help.command,
}

const client = new Client({
    intents: ["GUILD_MESSAGES", "GUILDS"],
    authToken: process.env.DISCORD_AUTH_TOKEN,
})

client.registerCommands(createCommands(commands), process.env.DISCORD_CLIENT_ID)
client.initExpress()

client.use(...middleware.recommended({allowDMs: true}))
client.use(middleware.messageCommandParser({prefix: "!"}))

client.command("echo", async (request, response) => {
    /** @type {string} */
    const content =
        request.requestType === "interaction" ? request.body.content : request.body._.join(" ")
    const repeat = Number(request.body.repeat) || 1
    const {type} = request.body

    const message = content.repeat(repeat).slice(0, 2000)

    if (type === "embed") {
        await response.reply({
            embeds: [new MessageEmbed().setDescription(message)],
        })
    } else {
        await response.reply(message)
    }
})

client.command("help", builtins.help.handler({commands}))

client.error(async (err, _, response) => {
    await response.replyEphemeral(String(err))
})

client.on("ready", () => {
    console.log("ready")
})
