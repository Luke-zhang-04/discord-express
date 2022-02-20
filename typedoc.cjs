module.exports = {
    entryPoints: ["./src/"],
    plugin: "./node_modules/typedoc-plugin-missing-exports",
    darkHighlightTheme: "material-darker",
    lightHighlightTheme: "min-light",
    exclude: ["**/node_modules/**"],
}
