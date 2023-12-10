import { Command } from 'commander';
import PACKAGE_VERSION from './package-version.cjs';
import run from './extract.js';
import chalk from 'chalk';

const program = new Command();

program
  .name('documente')
  .version(PACKAGE_VERSION)
  .description('Extracts Phrasé tests from your Markdown documentation')
  .option('-c, --config <config>', 'path to the config file to use')
  .action(async (options) => {
    try {
      run(options.config);
    } catch (e) {
      console.error(chalk.red(e.message));
      process.exit(1);
    }
  });

program.parse();
