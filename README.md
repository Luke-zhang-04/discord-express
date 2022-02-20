<p align="center">
    <img width="50%" src="media/train.png"/>
</p>

# Discord Express

[![Node.js CI](https://img.shields.io/github/workflow/status/luke-zhang-04/discord-express/Node.js%20CI?style=flat-square&logo=github)](https://github.com/Luke-zhang-04/discord-express/actions/workflows/ci.yml)

> DiscordJS reimagined: seamlessly integrate slash and message commands with the pluggable, middleware-based Discord bot framework inspiried by ExpressJS.

Discord-express delivers the promise of "express" in 3 ways:

1. **Express inspiried**

    Discord-express is inspiried by [Express](https://expressjs.com/), so if you have used Express before, you will already be quite familliar.

2. **Expressive**

    Write code that's easier to understand with reuseable, pluggable middleware, and an alternative slash command builder that doesn't feel as cluncky and verbose as the default builder.

3. **The express route**

    Write DRYer (don't repeat yourself) code and don't WET (write everything twice) yourself! Take advantage of discord-express's seamsless slash and message command integration, and get rid of your boilerplate code.

_Never use Discord bot boilerplate template again_

Discord-express takes care of that for you, so you can just install and get going with your business instead of trying to figure out someone elses template.

## Why?

When slash commands came around, I knew I would eventually have to migrate. But if I wanted to keep message commands around, there was no good way of going about it. I was also getting tired of all the boilerplate needed for a Discord bot. There's tons of elaborate templates on Github just to get a bot started. But if you look at an express app, there isn't nearly as much boilerplate. Why can't there be a solution then?

## How?

There is still boilerplate associated with creating a bot. This will get you started.

Requirements: node >= 16.6

**Javascript**:

```sh
npm i discord.js discord-express
yarn add discord.js discord-express
pnpm add discord.js discord-express
```

**Typescript**:

```sh
npm i @types/node
yarn add @types/node
pnpm add @types/node
```

```js
import {Client, builtins, createCommands, middleware} from "./lib"
import dotenv from "dotenv"

dotenv.config()

/** @type {import("discord-express").Commands} */
const commands = {
    echo: {
        description: `Echo a message`,
    },
    help: builtins.help.command,
}

const client = new Client({
    intents: ["GUILD_MESSAGES", "GUILDS"],
    authToken: process.env.TOKEN,
})

client.registerCommands(createCommands(commands), process.env.CLIENT_ID)
client.initExpress()

client.use(...middleware.recommended())
client.use(middleware.messageCommandParser({prefix: "~"}))
client.command("help", builtins.help.handler({commands}))

client.command("echo", (request, response) => {
    console.log(request.body)

    if (request.requestType === "interaction") {
        response.reply(request.body.content)
    } else {
        response.reply(request.body._.join(" "))
    }
})

client.on("ready", () => {
    console.log("ready")
})
```

And that's it! You're ready to get started.
