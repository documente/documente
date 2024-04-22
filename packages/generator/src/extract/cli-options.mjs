const DEFAULT_OUTPUT_DIRS = {
  playwright: 'e2e',
  cypress: 'cypress/e2e',
};

const DEFAULT_REGEX = '```phras[ée]([^`]*)```';

export const OPTION_KEYS = [
  'runner',
  'inputFiles',
  'outputFolder',
  'selectors',
  'externals',
  'testRegex',
  'env',
  'waitBeforeScreenshot',
];

export const CLI_OPTIONS = {
  runner: {
    description: 'The test runner to use',
    type: 'choices',
    required: true,
    choices: ['playwright', 'cypress'],
    promptMessage: 'Which test runner would you like to use?',
  },
  inputFiles: {
    description: 'Glob pattern for input files or array of glob patterns',
    type: 'string_array',
    required: true,
    promptMessage: 'What files would you like to extract tests from?',
    defaultValue: '**/*.md',
  },
  outputFolder: {
    description: 'Path to a directory to output the generated tests',
    type: 'string',
    defaultValueFn: (options) => {
      return DEFAULT_OUTPUT_DIRS[options.runner];
    },
    promptMessage: 'Where would you like to output the generated tests?',
  },
  selectors: {
    description: 'Path to a YAML file containing selectors',
    type: 'filepath',
    required: true,
    promptMessage: 'What file contains your selectors?',
    defaultValue: 'selectors.yml',
  },
  externals: {
    description: 'Path to a Javascript file containing external functions',
    type: 'filepath',
    promptMessage: 'What file contains your external functions?',
  },
  testRegex: {
    description:
      'The regex to use to find tests in the input files, or an array of regexes',
    type: 'string',
    defaultValue: DEFAULT_REGEX,
    promptMessage: 'What regex should we use to find your tests?',
  },
  env: {
    description: 'Path to a YAML file containing environment variables',
    type: 'filepath',
    promptMessage: 'What file contains your environment variables?',
  },
  waitBeforeScreenshot: {
    description: 'Number of milliseconds to wait before taking a screenshot',
    type: 'number',
    promptMessage:
      'How long should we wait before taking a screenshot? (milliseconds)',
    defaultValue: 0,
  },
  acceptLanguages: {
    description: 'Valid languages for the accept-language header',
    type: 'string',
    promptMessage:
      'What languages should we use for the accept-language header?',
    defaultValue: '',
  },
};
