module.exports = {
    root: true,
    env: {
        es6: true,
        node: true,
    },
    extends: [
        'eslint:recommended',
        'google',
    ],
    parserOptions: {
        'ecmaVersion': 8,
    },
    rules: {
        'quotes': ['error', 'single'],
        'semi': ['error', 'never'],
        'indent': ['error', 4],
        'max-len': ['error', {'code': 120}],
        'no-unused-vars': 'off',
        'require-jsdoc': 0,
    },
}
