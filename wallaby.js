module.exports = function (w) {
    return {
        files: [
            'src/**/*.ts',
            'grammar/**/*.sbnf'
        ],

        tests: [
            'spec/**/*'
        ],

        env: {
            type: 'node'
        },

        // or any other supported testing framework:
        // https://wallabyjs.com/docs/integration/overview.html#supported-testing-frameworks
        testFramework: 'jasmine'
    };
};