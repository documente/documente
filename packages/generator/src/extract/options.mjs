

const defaultOutputDirs = {
  playwright: 'e2e',
  cypress: 'cypress/e2e',
};

const defaultRegex = '```phras[ée]([^`]*)```';

export const optionKeys = [
  'runner',
  'inputFiles',
  'outputDir',
  'selectors',
  'externals',
  'testRegex',
  'env',
];

export const options = {
  runner: {
    description: 'The test runner to use',
    type: 'choices',
    required: true,
    choices: ['playwright', 'cypress'],
    promptMessage: 'Which test runner would you like to use?'
  },
  inputFiles: {
    description: 'Glob pattern for input files or array of glob patterns',
    type: 'string_array',
    required: true,
    promptMessage: 'What files would you like to extract tests from?',
    defaultValue: '**/*.md',
  },
  outputDir: {
    description: 'Path to a directory to output the generated tests',
    type: 'string',
    defaultValueFn: (options) => {
      return defaultOutputDirs[options.runner];
    },
    promptMessage: 'Where would you like to output the generated tests?',
  },
  selectors: {
    description: 'Path to a YAML file containing selectors',
    type: 'string',
    required: true,
    promptMessage: 'What file contains your selectors?',
    defaultValue: 'selectors.yml',
  },
  externals : {
    description: 'Path to a Javascript file containing external functions',
    type: 'string',
    promptMessage: 'What file contains your external functions?',
  },
  testRegex: {
    description: 'The regex to use to find tests in the input files, or an array of regexes',
    type: 'string',
    defaultValue: defaultRegex,
    promptMessage: 'What regex should we use to find your tests?',
  },
  env: {
    description: 'Path to a YAML file containing environment variables',
    type: 'string',
    promptMessage: 'What file contains your environment variables?',
  },
};
