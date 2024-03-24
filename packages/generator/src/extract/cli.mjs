import { Command } from 'commander';
import PACKAGE_VERSION from './package-version.cjs';
import { OPTION_KEYS, CLI_OPTIONS } from './cli-options.mjs';
import { error } from './logger.mjs';
import run from './run.mjs';

const program = new Command();

program
  .name('documente')
  .version(PACKAGE_VERSION)
  .description('Extracts Phrasé tests from your Markdown documentation')
  .option('-c, --config <config>', 'path to the config file to use')
  .option('-y, --yes', 'yes to all prompts')
  .option('-w, --watch', 'activate watch mode')
  .option('--debug', 'activate debug mode');

OPTION_KEYS.forEach((optionKey) => {
  const option = CLI_OPTIONS[optionKey];
  const optionName = optionKey.replace(/([A-Z])/g, '-$1').toLowerCase();
  const optionDescription = option.description;
  const argName = option.required ? `<${optionName}>` : `[${optionName}]`;
  program.option(
    `--${optionName} ${argName}`,
    optionDescription +
      (option.defaultValue ? ` (default: ${option.defaultValue})` : ''),
  );
});

program.action(async (options) => {
  try {
    options = camelizeKeys(options);
    await run(options);
  } catch (e) {
    if (options.debug) {
      throw e;
    }
    error(e.message);
    process.exit(1);
  }
});

program.parse();

function camelizeKeys(options) {
  const result = {};

  for (const key of Object.keys(options)) {
    const camelCase = (str) => {
      return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    };
    result[camelCase(key)] = options[key];
  }

  return result;
}
