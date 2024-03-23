import { Command } from 'commander';
import PACKAGE_VERSION from './package-version.cjs';
import run from './extract.mjs';
import chalk from 'chalk';
import { optionKeys, options } from './options.mjs';

const program = new Command();

program
  .name('documente')
  .version(PACKAGE_VERSION)
  .description('Extracts Phrasé tests from your Markdown documentation')
  .option('-c, --config <config>', 'path to the config file to use')
  .option('-y, --yes', 'yes to all prompts')
  .option('-w, --watch', 'activate watch mode')
  .option('--debug', 'activate debug mode');

optionKeys.forEach((optionKey) => {
  const option = options[optionKey];
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
    console.error(chalk.red(e.message));
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
