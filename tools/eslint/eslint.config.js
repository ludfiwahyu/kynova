import js from '@eslint/js'
import react from '@eslint-react/eslint-plugin'
import stylistic from '@stylistic/eslint-plugin'
import prettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'
import tseslint from 'typescript-eslint'

// ===================================================================
//
//   Local rules (see CODE_STYLE.md)
//
// ===================================================================

const SRC_ALIAS = /^@\//
const NODE_SIDE = /^(#server\/|#shared\/|\.\/)/

const local = {
    rules: {
        'no-file-header': {
            meta: {
                type: 'suggestion',
                schema: [],
                messages: { header: 'A file starts with its imports, not a multi-line comment.' },
            },
            create(context) {
                return {
                    Program() {
                        const [first] = context.sourceCode.getAllComments()

                        if (!first || first.type !== 'Block' || first.loc.start.line !== 1) {
                            return
                        }

                        if (first.loc.end.line > first.loc.start.line) {
                            context.report({
                                loc: first.loc,
                                messageId: 'header',
                            })
                        }
                    },
                }
            },
        },

        'import-extension': {
            meta: {
                type: 'problem',
                schema: [{ enum: ['without', 'with'] }],
                messages: {
                    without: 'Imports in src/ have no .ts or .tsx extension.',
                    with: 'Imports outside src/ keep the .ts extension, Node runs them directly.',
                },
            },
            create(context) {
                const mode = context.options[0]

                return {
                    ImportDeclaration(node) {
                        const source = node.source.value
                        const hasExtension = /\.tsx?$/.test(source)

                        if (mode === 'without') {
                            const ownCode = SRC_ALIAS.test(source) || source.startsWith('./')

                            if (ownCode && hasExtension) {
                                context.report({
                                    node: node.source,
                                    messageId: 'without',
                                })
                            }

                            return
                        }

                        if (NODE_SIDE.test(source) && !hasExtension) {
                            context.report({
                                node: node.source,
                                messageId: 'with',
                            })
                        }
                    },
                }
            },
        },
    },
}

// ===================================================================
//
//   Shared rule sets
//
// ===================================================================

const RAW_FORM_ELEMENT = 'JSXOpeningElement[name.name=/^(button|input|select|textarea)$/]'

const CONSTANTS = [
    {
        selector: 'Program > VariableDeclaration',
        message: 'A .tsx file declares no top-level constants: move them to logic/config.ts.',
    },
    {
        selector: 'Program > ExportNamedDeclaration > VariableDeclaration',
        message: 'A .tsx file declares no top-level constants: move them to logic/config.ts.',
    },
]

const TSX_SYNTAX = [
    {
        selector: 'Program > VariableDeclaration',
        message: 'A .tsx file declares no top-level constants: move them to logic/config.ts.',
    },
    {
        selector: 'Program > ExportNamedDeclaration > VariableDeclaration',
        message: 'A .tsx file declares no top-level constants: move them to logic/config.ts.',
    },
    {
        selector: 'ReturnStatement > JSXFragment',
        message:
            'Give the component a real root element, or wrap siblings in <span className="contents">.',
    },
    {
        selector: 'ReturnStatement > ConditionalExpression',
        message: 'Return one root element and put the ternary inside it.',
    },
    {
        selector:
            'JSXElement > JSXExpressionContainer > LogicalExpression[operator=/^(\\|\\||\\?\\?)$/]',
        message: 'Decide || and ?? in a hook or mapper, not in JSX.',
    },
    {
        selector: 'JSXElement > JSXExpressionContainer > TemplateLiteral',
        message: 'Build text labels in a hook or mapper, not in JSX.',
    },
]

const formatting = {
    curly: ['error', 'all'],
    eqeqeq: ['error', 'always'],
    'no-var': 'error',
    'prefer-const': 'error',
    'no-nested-ternary': 'error',
    'local/no-file-header': 'error',

    'no-restricted-imports': [
        'error',
        {
            patterns: [
                {
                    group: ['../*', '../**'],
                    message: 'Use an alias (@/, #server/, #shared/) instead of ../',
                },
            ],
        },
    ],

    '@stylistic/object-curly-newline': [
        'error',
        {
            ObjectExpression: {
                minProperties: 2,
                consistent: true,
            },
        },
    ],
    '@stylistic/object-property-newline': ['error', { allowAllPropertiesOnSameLine: false }],

    '@stylistic/padding-line-between-statements': [
        'error',
        {
            blankLine: 'always',
            prev: '*',
            next: 'return',
        },
        {
            blankLine: 'always',
            prev: ['const', 'let'],
            next: '*',
        },
        {
            blankLine: 'any',
            prev: ['const', 'let'],
            next: ['const', 'let'],
        },
        {
            blankLine: 'always',
            prev: '*',
            next: ['if', 'for', 'while', 'switch', 'try', 'function', 'class'],
        },
        {
            blankLine: 'always',
            prev: ['if', 'for', 'while', 'switch', 'try', 'function', 'class'],
            next: '*',
        },
    ],

    'simple-import-sort/imports': [
        'error',
        { groups: [['^node:'], ['^@?\\w'], ['^@/', '^#'], ['^\\./'], ['^\\u0000']] },
    ],
    'simple-import-sort/exports': 'error',
}

// ===================================================================
//
//   Config
//
// ===================================================================

export default tseslint.config(
    {
        ignores: [
            '**/node_modules/**',
            'dist/**',
            'dist-desktop/**',
            'release/**',
            'build/**',
            'data/**',
            'public/**',
        ],
    },

    js.configs.recommended,
    ...tseslint.configs.recommended,
    prettier,

    {
        files: ['**/*.{ts,tsx,js}'],
        plugins: {
            '@stylistic': stylistic,
            'simple-import-sort': simpleImportSort,
            local,
        },
        rules: formatting,
    },

    {
        files: ['**/*.{ts,tsx}'],
        rules: {
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/consistent-type-imports': 'error',
            '@typescript-eslint/naming-convention': [
                'error',
                {
                    selector: 'typeLike',
                    format: ['PascalCase'],
                },
                {
                    selector: 'function',
                    format: ['camelCase', 'PascalCase'],
                },
            ],
        },
    },

    {
        files: ['src/**/*.{ts,tsx}'],
        languageOptions: { globals: globals.browser },
        rules: { 'local/import-extension': ['error', 'without'] },
    },

    {
        files: ['server/**', 'shared/**', 'scripts/**', 'electron/**', 'vite.config.ts'],
        languageOptions: { globals: globals.node },
        rules: { 'local/import-extension': ['error', 'with'] },
    },

    {
        files: ['src/**/*.{ts,tsx}'],
        plugins: { 'react-hooks': reactHooks },
        rules: {
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
        },
    },

    {
        files: ['src/**/*.tsx'],
        plugins: { '@eslint-react': react },
        rules: {
            '@eslint-react/jsx-no-useless-fragment': 'error',
            '@stylistic/jsx-self-closing-comp': 'error',
            'no-restricted-syntax': ['error', ...TSX_SYNTAX],
        },
    },

    {
        files: ['src/pages/**/*.tsx', 'src/layouts/**/*.tsx'],
        rules: {
            'no-restricted-syntax': [
                'error',
                ...TSX_SYNTAX,
                {
                    selector: RAW_FORM_ELEMENT,
                    message: 'Use Button, Input, TextArea, Select or Switch from @/components.',
                },
            ],
        },
    },

    {
        files: ['src/**/*MenuItems.tsx'],
        rules: {
            '@eslint-react/jsx-no-useless-fragment': 'off',
            'no-restricted-syntax': ['error', ...CONSTANTS],
        },
    },

    {
        files: ['src/main.tsx'],
        rules: { 'no-restricted-syntax': ['error', ...TSX_SYNTAX.slice(2)] },
    },

    {
        files: ['**/*.test.ts'],
        rules: { '@stylistic/padding-line-between-statements': 'off' },
    },
)
