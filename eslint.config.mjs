import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
    {
        ignores: ["dist/**", "node_modules/**", "data/**"],
    },
    js.configs.recommended,
    {
        files: ["src/**/*.{ts,tsx}"],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                console: "readonly",
                document: "readonly",
                window: "readonly",
                fetch: "readonly",
                Response: "readonly",
                Set: "readonly",
                Map: "readonly",
                Promise: "readonly",
                Date: "readonly",
                JSON: "readonly",
                Math: "readonly",
                Number: "readonly",
                HTMLElement: "readonly",
                HTMLInputElement: "readonly",
                HTMLDivElement: "readonly",
                MouseEvent: "readonly",
                Node: "readonly",
                KeyboardEvent: "readonly",
            },
        },
        plugins: {
            "@typescript-eslint": tseslint,
            "react-hooks": reactHooks,
            "react-refresh": reactRefresh,
        },
        rules: {
            ...tseslint.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
            "@typescript-eslint/no-explicit-any": "warn",
        },
    },
];
