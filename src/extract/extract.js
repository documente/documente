import fs from 'fs';
import { parse } from 'yaml';
import { basename, dirname, resolve, relative } from 'path';
import { globSync as glob } from 'glob';
import Mustache from 'mustache';
import { Splitter } from '@documente/phrase';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supportedRunners = ['cypress', 'playwright'];

const defaultOutputDirs = {
  cypress: 'cypress/e2e',
  playwright: 'tests',
};

const defaultExtensions = {
  cypress: '.cy.js',
  playwright: '.spec.js',
};

function importConfigFile(pathToConfigFile) {
  try {
    return parse(
      fs.readFileSync(resolve(process.cwd(), pathToConfigFile), 'utf8'),
    );
  } catch (e) {
    throw new Error(`Error importing config file: ${e.message}`);
  }
}

function extractFromConfig(config) {
  let { selectors, externals, input, outputDir, runner } = config;

  let inputArray;

  if (typeof input === 'string') {
    inputArray = [input];
  } else if (Array.isArray(input)) {
    inputArray = input;
  } else {
    throw new Error('input must be a string or an array of strings');
  }

  if (typeof selectors !== 'string') {
    throw new Error('selectors must be a string path to a YAML file');
  }

  if (externals != null && typeof externals !== 'string') {
    throw new Error('externals must be a string path to a Javascript file');
  }

  if (!supportedRunners.includes(runner)) {
    throw new Error(`runner must be one of ${supportedRunners.join(', ')}`);
  }

  if (outputDir == null) {
    outputDir = defaultOutputDirs[runner];
  } else if (typeof outputDir !== 'string') {
    throw new Error('outputDir must be a string path to a directory');
  }

  return { selectors, externals, outputDir, inputArray, runner };
}

function readSelectorsFile(pathToSelectorsFile) {
  try {
    const resolvedPath = resolve(process.cwd(), pathToSelectorsFile);
    fs.accessSync(resolvedPath, fs.constants.R_OK);
    return fs.readFileSync(resolvedPath, 'utf8');
  } catch (e) {
    throw new Error(`Error reading selectors file: ${e.message}`);
  }
}

function readAndParseSelectorsFile(pathToSelectorsFile) {
  const selectorsFileContent = readSelectorsFile(pathToSelectorsFile);

  try {
    parse(selectorsFileContent);
  } catch (e) {
    throw new Error(`Error parsing selectors file: ${e.message}`);
  }

  return selectorsFileContent;
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

export default function run(pathToConfigFile) {
  const config = importConfigFile(pathToConfigFile);
  const { selectors, externals, outputDir, inputArray, runner } =
    extractFromConfig(config);
  checkExternals(externals);
  const outputPathToExternals =
    externals == null
      ? null
      : relative(outputDir, externals).replace(/\\/g, '/');
  const selectorsFile = readAndParseSelectorsFile(selectors);
  const files = validateInputFiles(inputArray);
  const specTemplate = fs.readFileSync(
    resolve(__dirname, `../templates/${runner}-spec.mustache`),
    'utf8',
  );

  fs.mkdirSync(resolve(process.cwd(), outputDir), { recursive: true });

  function processDocumentationFile(file) {
    const splitter = new Splitter();
    const sourceFileName = basename(file);
    const fileContent = fs.readFileSync(resolve(process.cwd(), file), 'utf8');
    const regex = /```phras[ée][^`]*```/gm;
    fileContent
      .match(regex)
      .map((block) => block.replace(/```phras[ée]([^`]*)```/, '$1').trim())
      .forEach((block) => splitter.add(block));

    const splitResult = splitter.split();
    const blocks = splitResult.blocks.map((block) => ({ block }));
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
      sourceFileName: sourceFileName,
      specs,
      blocks,
    };

    const rendered = Mustache.render(specTemplate, view);
    const outputFileName = `${sourceFileName.replace(/\.md$/, '')}${
      defaultExtensions[runner]
    }`;
    const pathToOutputFile = resolve(process.cwd(), outputDir, outputFileName);
    fs.writeFileSync(pathToOutputFile, rendered, 'utf8');
    console.log(
      chalk.green(`Generated ${specs.length} tests in ${pathToOutputFile}.`),
    );
  }

  files.forEach((file) => processDocumentationFile(file));

  console.log(
    chalk.green(
      `Generated ${files.length} spec files in ${resolve(
        process.cwd(),
        outputDir,
      )}.`,
    ),
  );
}
