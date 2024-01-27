import fs from 'fs';
import YAML from 'yaml';
import { basename, dirname, resolve, relative, parse } from 'path';
import { globSync as glob } from 'glob';
import Mustache from 'mustache';
import { Splitter } from '@documente/phrase';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import {promptConfig} from './prompt-config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const defaultRegex = '```phras[ée]([^`]*)```';

const supportedRunners = ['cypress', 'playwright'];

const defaultOutputDirs = {
  cypress: 'cypress/e2e',
  playwright: 'tests',
};

const defaultExtensions = {
  cypress: '.cy.js',
  playwright: '.spec.js',
};

// Starting from the current working directory, look for a config file named "documente.config.yml"
// or "documente.config.yaml". While config file is not found, go up one directory and repeat.
function findConfigFile() {
  console.log('Looking for config file...');
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
      console.log('Using config file:', found);
      return found;
    }

    currentDirectory = dirname(currentDirectory);
    depth++;
  }

  console.log('No config file found.');
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

function readYamlFile(pathToYamlFile) {
  try {
    const resolvedPath = resolve(process.cwd(), pathToYamlFile);
    fs.accessSync(resolvedPath, fs.constants.R_OK);
    return fs.readFileSync(resolvedPath, 'utf8');
  } catch (e) {
    throw new Error(`Error reading file "${pathToYamlFile}":\n${e.message}`);
  }
}

function readAndParseYamlFile(pathToYamlFile) {
  const fileContent = readYamlFile(pathToYamlFile);

  try {
    YAML.parse(fileContent);
  } catch (e) {
    throw new Error(
      `Error parsing YAML file "${pathToYamlFile}":\n${e.message}`,
    );
  }

  return fileContent;
}

function getInputFiles(inputGlobArray) {
  return glob(inputGlobArray, {
    cwd: process.cwd(),
  });
}

function validateInputFiles(inputGlobArray) {
  const files = getInputFiles(inputGlobArray);

  if (files.length === 0) {
    throw new Error('No input files found');
  }

  return files;
}

function checkExternals(pathToExternals) {
  if (pathToExternals == null) {
    return;
  }

  try {
    fs.accessSync(resolve(process.cwd(), pathToExternals), fs.constants.R_OK);
  } catch (e) {
    throw new Error(`Error reading externals file: ${e.message}`);
  }
}

export default async function run(pathToConfigFile, yesToAll) {
  if (pathToConfigFile == null) {
    pathToConfigFile = findConfigFile();
  }
  const config = pathToConfigFile ? importConfigFile(pathToConfigFile) : {};
  const {
    selectors,
    externals,
    outputDir,
    inputArray,
    runner,
    testRegex,
    env,
  } = await promptConfig(config, yesToAll);
  checkExternals(externals);
  const outputPathToExternals =
      externals == null
          ? null
          : relative(outputDir, externals).replace(/\\/g, '/');
  const selectorsFile = readAndParseYamlFile(selectors);
  const envFile = env ? readAndParseYamlFile(env) : null;
  const files = validateInputFiles(inputArray);
  const specTemplate = fs.readFileSync(
      resolve(__dirname, `../templates/${runner}-spec.mustache`),
      'utf8',
  );

  fs.mkdirSync(resolve(process.cwd(), outputDir), {recursive: true});

  let generatedFileCount = 0;

  files.forEach((file) => {
    const splitter = new Splitter();
    const sourceFileName = basename(file);
    const fileContent = fs.readFileSync(resolve(process.cwd(), file), 'utf8');
    const regex = new RegExp(testRegex, 'gm');
    const matches = fileContent.match(regex);

    if (matches == null || matches.length === 0) {
      console.log(chalk.yellow(`No test found in ${file}`));
      return;
    }

    matches
        .map((block) => block.replace(new RegExp(testRegex), '$1').trim())
        .forEach((block) => splitter.add(block));

    const splitResult = splitter.split();
    const blocks = splitResult.blocks.map((block) => ({block}));
    const specs = splitResult.tests.map((spec, index) => ({
      spec,
      specNumber: index + 1,
    }));

    if (specs.length === 0) {
      throw new Error(`No test found in ${file}`);
    }

    const view = {
      pathToExternals: outputPathToExternals,
      selectorTree: selectorsFile,
      env: envFile,
      sourceFileName: sourceFileName,
      specs,
      blocks,
    };

    const rendered = Mustache.render(specTemplate, view);
    const withoutExt = parse(sourceFileName).name;
    const outputFileName = `${withoutExt}${defaultExtensions[runner]}`;
    const pathToOutputFile = resolve(process.cwd(), outputDir, outputFileName);
    fs.writeFileSync(pathToOutputFile, rendered, 'utf8');
    console.log(
        chalk.green(`Generated ${specs.length} tests in ${pathToOutputFile}.`),
    );
    generatedFileCount++;
  });

  console.log(
      chalk.green(
          `Generated ${generatedFileCount} spec files in ${resolve(
              process.cwd(),
              outputDir,
          )}.`,
      ),
  );
}
