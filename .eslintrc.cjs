function* range(min, max) {
    for (let num = min; num < max; num++) {
        yield num
    }
}

module.exports = {
    env: {
        es2021: true,
        node: true,
    },
    extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: 12,
        sourceType: "module",
        project: ["./tsconfig.json", "./tsconfig.test.json"],
    },
    plugins: ["@typescript-eslint", "prefer-arrow", "prettier"],
    rules: {
        // General ESLint rules
        "arrow-body-style": ["warn", "as-needed"],
        "default-case-last": "warn",
        "dot-location": ["warn", "property"],
        eqeqeq: "error",
        "max-len": [
            "warn",
            {
                code: 100,
                tabWidth: 4,
                ignoreComments: true,
                ignoreTrailingComments: true,
                ignoreStrings: true,
                ignoreTemplateLiterals: true,
                ignoreRegExpLiterals: true,
            },
        ],
        "max-lines": ["warn", 500],
        "max-statements": ["warn", {max: 30}],
        "no-else-return": "warn",
        "no-empty": ["warn", {allowEmptyCatch: true}],
        "no-negated-condition": "warn",
        "no-nested-ternary": "warn",
        "no-var": "warn",
        "object-shorthand": "warn",
        "one-var": ["warn", "never"],
        "prefer-const": "warn",
        "prefer-destructuring": [
            "error",
            {
                array: false,
                object: true,
            },
        ],
        "prefer-exponentiation-operator": "warn",
        "prefer-object-spread": "warn",
        "prefer-template": "warn",
        "require-await": "warn",
        "require-unicode-regexp": "warn",
        "sort-imports": ["warn"],

        // Typescript Rules
        "@typescript-eslint/array-type": "warn",
        "@typescript-eslint/consistent-indexed-object-style": ["warn", "index-signature"],
        "@typescript-eslint/consistent-type-assertions": ["warn", {assertionStyle: "as"}],
        "@typescript-eslint/member-ordering": "warn",
        "@typescript-eslint/naming-convention": [
            "error",
            {
                selector: "default",
                format: ["camelCase"],
            },
            {
                selector: "variableLike",
                format: ["camelCase"],
                leadingUnderscore: "allow",
            },
            {
                selector: "memberLike",
                modifiers: ["private"],
                format: ["camelCase"],
                leadingUnderscore: "require",
            },
            {
                selector: "typeLike",
                format: ["PascalCase"],
            },
            {
                selector: "variable",
                types: ["boolean"],
                format: ["PascalCase"],
                prefix: ["is", "should", "has", "can", "did", "will"],
            },
            {
                selector: "parameter",
                format: ["camelCase"],
                leadingUnderscore: "allow",
            },
            {
                selector: "property",
                format: ["camelCase", "PascalCase", "snake_case", "UPPER_CASE"],
                leadingUnderscore: "allow",
            },
            {
                selector: "enumMember",
                format: ["camelCase", "PascalCase", "snake_case", "UPPER_CASE"],
            },
        ],
        "@typescript-eslint/no-duplicate-imports": "warn",
        "@typescript-eslint/no-empty-interface": "off",
        "@typescript-eslint/no-magic-numbers": [
            "warn",
            {
                ignoreEnums: true,
                ignoreNumericLiteralTypes: true,
                ignoreReadonlyClassProperties: true,
                ignoreArrayIndexes: true,
                ignore: Array.from(range(-10, 11)),
            },
        ],
        "@typescript-eslint/no-unnecessary-boolean-literal-compare": "warn",
        "@typescript-eslint/prefer-for-of": "warn",
        "@typescript-eslint/prefer-function-type": "warn",
        "@typescript-eslint/prefer-optional-chain": "warn",

        // Typescript extension rules
        "@typescript-eslint/default-param-last": "warn",
        "@typescript-eslint/dot-notation": "warn",
        "@typescript-eslint/lines-between-class-members": [
            "warn",
            "always",
            {exceptAfterSingleLine: true},
        ],
        "@typescript-eslint/no-dupe-class-members": "warn",
        "@typescript-eslint/no-duplicate-imports": "warn",
        "@typescript-eslint/no-extra-semi": "off",
        "@typescript-eslint/no-shadow": "warn",
        "@typescript-eslint/no-unused-expressions": "warn",
        "@typescript-eslint/no-use-before-define": "warn",

        // Preter arrow rules
        "prefer-arrow-callback": "warn",
        "prefer-arrow/prefer-arrow-functions": [
            "warn",
            {
                disallowPrototype: true,
                singleReturnOnly: false,
                classPropertiesAllowed: false,
                allowStandaloneDeclarations: false,
            },
        ],

        // Prettier rules
        "prettier/prettier": [
            "warn",
            {},
            {
                usePrettierrc: true,
            },
        ],
    },
}
