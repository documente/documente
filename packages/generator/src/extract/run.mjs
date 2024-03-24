import {OPTION_KEYS} from './cli-options.mjs';
import {promptConfig} from './prompt-config.mjs';
import {extractTests} from './extract.mjs';
import {info} from './logger.mjs';
import {globSync as glob} from 'glob';
import {dirname, resolve} from 'path';
import YAML from 'yaml';
import fs from 'fs';

// Starting from the current working directory, look for a config file named "documente.config.yml"
// or "documente.config.yaml". While config file is not found, go up one directory and repeat.
function findConfigFile() {
  info('Looking for config file...');
  let currentDirectory = process.cwd();

  let depth = 0;

  while (currentDirectory !== '/') {
    if (depth > 10) {
      break;
    }

    const configFiles = glob(
        ['documente.config.yml', 'documente.config.yaml'],
        {
          cwd: currentDirectory,
        },
    );

    if (configFiles.length > 0) {
      const found = resolve(currentDirectory, configFiles[0]);
      info('Using config file:', found);
      return found;
    }

    currentDirectory = dirname(currentDirectory);
    depth++;
  }

  info('No config file found.');
}

function importConfigFile(pathToConfigFile) {
  try {
    return YAML.parse(
        fs.readFileSync(resolve(process.cwd(), pathToConfigFile), 'utf8'),
    );
  } catch (e) {
    throw new Error(`Error importing config file: ${e.message}`);
  }
}

export default async function run(cliOptions) {
  const yesToAll = cliOptions.yes;
  let pathToConfigFile = cliOptions.config;

  if (pathToConfigFile == null) {
    pathToConfigFile = findConfigFile();
  }
  const baseConfig = pathToConfigFile ? importConfigFile(pathToConfigFile) : {};

  OPTION_KEYS.forEach((optionKey) => {
    const cliOptionsValue = cliOptions[optionKey];
    if (cliOptionsValue != null && cliOptionsValue !== '') {
      baseConfig[optionKey] = cliOptionsValue;
    }
  });

  const config = await promptConfig(baseConfig, yesToAll, pathToConfigFile != null);

  const watchMode = cliOptions.watch;
  await extractTests(config, watchMode);
}
