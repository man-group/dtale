import babel from "@babel/eslint-plugin";
import { fixupPluginRules } from "@eslint/compat";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import typescriptEslintTslint from "@typescript-eslint/eslint-plugin-tslint";
import tsParser from "@typescript-eslint/parser";
import flowtype from "eslint-plugin-flowtype";
import _import from "eslint-plugin-import";
import jest from "eslint-plugin-jest";
import jsdoc from "eslint-plugin-jsdoc";
import promise from "eslint-plugin-promise";
import react from "eslint-plugin-react";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FILENAME = fileURLToPath(import.meta.url);
const DIRNAME = path.dirname(FILENAME);
const compat = new FlatCompat({
    baseDirectory: DIRNAME,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [...compat.extends("prettier"), {
    plugins: {
        "@typescript-eslint": typescriptEslint,
        "@typescript-eslint/tslint": typescriptEslintTslint,
        "@babel": babel,
        flowtype,
        import: fixupPluginRules(_import),
        jest,
        jsdoc,
        promise,
        react: fixupPluginRules(react),
    },

    linterOptions: {
        reportUnusedDisableDirectives: true,
    },

    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node,
        },

        parser: tsParser,
        ecmaVersion: 2020,
        sourceType: "module",

        parserOptions: {
            createDefaultProgram: true,
            project: "tsconfig.json",
            warnOnUnsupportedTypeScriptVersion: true,
        },
    },

    settings: {
        jsdoc: {
            tagNamePreference: {
                returns: "return",
                return: "return",
            },
        },

        react: {
            version: "detect",
        },
    },

    rules: {
        "@typescript-eslint/adjacent-overload-signatures": "error",

        "@typescript-eslint/array-type": ["error", {
            default: "array-simple",
        }],

        "@typescript-eslint/no-restricted-types": ["error", {
            types: {
                Object: {
                    message: "Avoid using the `Object` type. Did you mean `object`?",
                },
                Function: {
                    message: "Avoid using the `Function` type. Prefer a specific function type, like `() => void`.",
                },

                Boolean: {
                    message: "Avoid using the `Boolean` type. Did you mean `boolean`?",
                },

                String: {
                    message: "Avoid using the `String` type. Did you mean `string`?",
                },

                Symbol: {
                    message: "Avoid using the `Symbol` type. Did you mean `symbol`?",
                },
            },
        }],

        "@typescript-eslint/consistent-type-assertions": ["error", {
            assertionStyle: "as",
            objectLiteralTypeAssertions: "allow",
        }],

        "@typescript-eslint/dot-notation": "error",
        "@typescript-eslint/explicit-member-accessibility": "off",
        "@typescript-eslint/explicit-function-return-type": "off",

        "@typescript-eslint/member-ordering": ["error", {
            default: [
                "public-static-field",
                "public-static-method",
                "protected-static-field",
                "protected-static-method",
                "private-static-field",
                "private-static-method",
                "public-instance-field",
                "protected-instance-field",
                "private-instance-field",
                "constructor",
                "public-instance-method",
                "protected-instance-method",
                "private-instance-method",
            ],
        }],

        "@typescript-eslint/naming-convention": ["error", {
            selector: "class",
            format: ["PascalCase"],
        }, {
            selector: "interface",
            format: ["PascalCase"],

            custom: {
                regex: "^I[A-Z]",
                match: false,
            },
        }, {
            selector: "variable",
            format: ["camelCase", "PascalCase", "UPPER_CASE"],
        }],

        "@typescript-eslint/no-array-constructor": "error",

        "@typescript-eslint/no-empty-function": ["error", {
            allow: ["constructors"],
        }],

        "@typescript-eslint/no-empty-interface": "error",
        "@typescript-eslint/no-inferrable-types": "error",
        "@typescript-eslint/no-misused-new": "error",
        "@typescript-eslint/no-namespace": "error",
        "@typescript-eslint/no-shadow": "error",

        "@typescript-eslint/no-unused-expressions": ["error", {
            allowTernary: true,
        }],

        "@typescript-eslint/no-unused-vars": ["error", {
            args: "none",
        }],

        "@typescript-eslint/no-use-before-define": ["error", {
            functions: false,
        }],

        "@typescript-eslint/prefer-for-of": "error",
        "@typescript-eslint/prefer-function-type": "error",
        "@typescript-eslint/prefer-namespace-keyword": "error",
        "@typescript-eslint/tslint/config": "off",

        "@typescript-eslint/triple-slash-reference": ["error", {
            path: "never",
            types: "never",
            lib: "never",
        }],

        "@typescript-eslint/unified-signatures": "error",
        "constructor-super": "error",
        curly: "error",
        "default-case": "error",

        eqeqeq: ["error", "always", {
            null: "ignore",
        }],

        "guard-for-in": "error",

        "id-blacklist": [
            "off",
            "any",
            "Number",
            "number",
            "String",
            "string",
            "Boolean",
            "boolean",
            "Undefined",
            "undefined",
        ],

        "import/order": ["error", {
            alphabetize: {
                order: "asc",
                caseInsensitive: true,
            },

            groups: [["builtin", "external"], ["internal", "parent"], "sibling", "index"],
            "newlines-between": "always",
        }],

        "jest/consistent-test-it": ["error", {
            fn: "it",
            withinDescribe: "it",
        }],

        "jest/no-conditional-expect": "error",
        "jest/no-focused-tests": "error",
        "jest/no-identical-title": "error",
        "jest/valid-expect": "error",
        "jest/valid-title": "error",
        "jsdoc/check-alignment": "error",
        "jsdoc/check-indentation": "error",

        "jsdoc/check-param-names": ["error", {
            checkDestructured: false,
            checkRestProperty: false,
            enableFixer: true,
        }],

        "jsdoc/check-tag-names": "error",
        "jsdoc/no-types": "off",

        "jsdoc/require-description": ["error", {
            checkConstructors: false,
            contexts: ["any"],
            exemptedBy: ["inheritdoc", "type", "typedef"],
        }],

        "jsdoc/require-jsdoc": ["error", {
            checkGetters: true,
            checkSetters: true,
            enableFixer: false,
            contexts: ["TSEnumDeclaration", "TSInterfaceDeclaration", "TSTypeAliasDeclaration"],

            require: {
                ArrowFunctionExpression: false,
                ClassDeclaration: true,
                ClassExpression: true,
                FunctionDeclaration: true,
                FunctionExpression: true,
                MethodDefinition: true,
            },
        }],

        "jsdoc/require-param-description": "error",

        "jsdoc/require-param": ["error", {
            checkDestructured: false,
            checkDestructuredRoots: false,
            contexts: ["FunctionDeclaration", "FunctionExpression"],
            enableFixer: false,
        }],

        "jsdoc/require-returns-check": "error",
        "jsdoc/require-returns-description": "error",

        "jsdoc/require-returns": ["error", {
            contexts: ["FunctionDeclaration", "FunctionExpression"],
        }],

        "max-classes-per-file": ["error", 1],
        "no-bitwise": "error",
        "no-caller": "error",
        "no-cond-assign": ["error", "always"],
        "no-console": "error",
        "no-debugger": "error",
        "no-empty": "error",
        "no-eval": "error",
        "no-fallthrough": "error",

        "no-labels": ["error", {
            allowLoop: true,
            allowSwitch: true,
        }],

        "no-new-wrappers": "error",
        "no-redeclare": "error",
        "no-shadow": "off",
        "no-undef-init": "error",
        "no-unsafe-finally": "error",
        "no-unused-labels": "error",
        "no-var": "error",
        "one-var": ["error", "never"],

        "prefer-const": ["error", {
            destructuring: "any",
        }],

        radix: ["error", "always"],
        "react/jsx-boolean-value": ["error", "always"],
        "react/jsx-key": "error",

        "react/jsx-no-bind": ["error", {
            allowArrowFunctions: true,
        }],

        "react/jsx-uses-react": "error",
        "react/jsx-uses-vars": "error",
        "react/no-string-refs": "error",
        "react/self-closing-comp": "error",

        "sort-imports": ["error", {
            ignoreCase: true,
            ignoreDeclarationSort: true,
            ignoreMemberSort: false,
        }],

        "spaced-comment": ["error", "always", {
            exceptions: ["!"],
        }],

        "use-isnan": "error",
        "valid-typeof": "error",
    },
}, {
    files: ["**/*.ts", "**/*.tsx"],

    rules: {
        "@typescript-eslint/tslint/config": ["error", {
            rules: {
                "match-default-export-name": true,
            },
        }],

        "@typescript-eslint/explicit-function-return-type": ["error", {
            allowExpressions: true,
            allowTypedFunctionExpressions: true,
            allowHigherOrderFunctions: true,
            allowConciseArrowFunctionExpressionsStartingWithVoid: true,
        }],

        "@typescript-eslint/explicit-member-accessibility": ["error", {
            accessibility: "explicit",

            overrides: {
                accessors: "explicit",
                constructors: "off",
                parameterProperties: "explicit",
            },
        }],

        "jsdoc/no-types": "error",
    },
}, {
    files: ["**/*.js", "**/*.jsx"],
}];