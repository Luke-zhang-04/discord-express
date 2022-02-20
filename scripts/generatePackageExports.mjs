import {dirname} from "path"
import {fileURLToPath} from "url"
import fs from "fs/promises"
import glob from "glob"
import util from "util"

const __dirname = dirname(fileURLToPath(import.meta.url))

// No
const src = Array.from(
    new Set(
        (await util.promisify(glob)(`${__dirname}/../dist/src/**/*.ts`)).map((file) =>
            file.replace(/^.*\/src\//u, "").replace(/(^|\/)[a-zA-Z1-9.\-_]+$/u, ""),
        ),
    ),
).sort((a, b) => {
    if (!b) {
        return -1
    }

    return b.slice("/").length - a.slice("/").length
})

const exports = {
    ".": {
        require: "./cjs/index.js",
        import: "./index.js",
    },
}

for (const file of src) {
    if (!file) {
        exports["./*"] = {
            require: "./cjs/*.js",
            import: "./*.js",
        }
    } else {
        exports[`./${file}/*`] = {
            require: `./cjs/${file}/*.js`,
            import: `./${file}/*.js`,
        }

        exports[`./${file}`] = {
            require: `./cjs/${file}/index.js`,
            import: `./${file}/index.js`,
        }
    }
}

const packagejson = JSON.parse(await fs.readFile(`${__dirname}/../dist/package.json`, "utf-8"))

packagejson.exports = exports

await fs.writeFile(`${__dirname}/../dist/package.json`, JSON.stringify(packagejson, null, 2))
