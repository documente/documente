import fs from 'fs';
import YAML from 'yaml';
import { basename, dirname, parse, relative, resolve } from 'path';
import { globSync as glob } from 'glob';
import Mustache from 'mustache';
import { Splitter } from '@documente/phrase';
import { fileURLToPath } from 'node:url';
import { info, success, warn } from './logger.mjs';
import { watchFiles } from './watch.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const defaultSuffix = {
  cypress: '.cy',
  playwright: '.spec',
};

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
  if (pathToYamlFile == null || pathToYamlFile === '') {
    return null;
  }

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
    throw new Error(`No input files found matching "${inputGlobArray}".`);
  }

  return files;
}

function validateSetNames(sets) {
  const setNames = new Set();

  for (const set of sets) {
    if (set.name == null) {
      continue;
    }

    if (typeof set.name !== 'string') {
      throw new Error(`Set name "${set.name}" must be a string.`);
    }

    if (set.name === '') {
      throw new Error('Set name cannot be an empty string.');
    }

    if (startsWithADigit(set.name)) {
      throw new Error(`Set name "${set.name}" cannot start with a digit.`);
    }

    if (setNames.has(set.name)) {
      throw new Error(`Set name "${set.name}" is not unique.`);
    }

    setNames.add(set.name);
  }
}

function startsWithADigit(name) {
  return /^\d/.test(name);
}

export async function extractTests(config, watchMode) {
  if (config.sets) {
    if (!Array.isArray(config.sets)) {
      throw new Error('sets must be an Array.');
    }

    validateSetNames(config.sets);

    let setIndex = 0;

    for (const set of config.sets) {
      info(`Extracting tests from set ${setIndex}.`);
      await extractTestsFromSet(config, watchMode, set, setIndex);
      setIndex++;
    }
  } else {
    await extractTestsFromSet(config, watchMode, null);
  }
}

async function extractTestsFromSet(config, watchMode, setConfig, setIndex) {
  setConfig = setConfig ?? {};

  const {
    selectors,
    externals,
    outputFolder,
    inputFiles,
    runner,
    testRegex,
    env,
    waitBeforeScreenshot,
    name,
    acceptLanguages,
  } = { ...config, ...setConfig };

  const outputPathToExternals =
    externals == null || externals === ''
      ? null
      : relative(outputFolder, externals).replace(/\\/g, '/');
  const selectorsFile = readAndParseYamlFile(selectors);
  const envFile = env ? readAndParseYamlFile(env) : null;
  const files = validateInputFiles(inputFiles);
  const specTemplate = fs.readFileSync(
    resolve(__dirname, `../templates/${runner}-spec.mustache`),
    'utf8',
  );

  if (watchMode) {
    watchFiles(files, selectors, externals, env, () => {
      extractTests(config, watchMode);
    });
  }

  let generatedFileCount = 0;

  const buildPathToOutputFile = (dirName, outputFileName) => {
    return setIndex == null
      ? resolve(process.cwd(), outputFolder, dirName, outputFileName)
      : resolve(
          process.cwd(),
          outputFolder,
          name ?? setIndex.toString(),
          dirName,
          outputFileName,
        );
  };

  files.forEach((file) => {
    const splitter = new Splitter();
    const sourceFileName = basename(file);
    const dirName = dirname(file);

    const fileContent = fs.readFileSync(resolve(process.cwd(), file), 'utf8');
    const regex = new RegExp(testRegex, 'gm');
    const matches = fileContent.match(regex);

    if (matches == null || matches.length === 0) {
      warn(`No test found in ${file}`);
      return;
    }

    matches
      .map((block) => block.replace(new RegExp(testRegex), '$1').trim())
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
      env: envFile,
      sourceFileName: sourceFileName,
      acceptLanguages,
      specs,
      blocks,
      waitBeforeScreenshot,
    };

    const rendered = Mustache.render(specTemplate, view);
    const withoutExt = parse(sourceFileName).name;
    const outputFileName = `${withoutExt}${defaultSuffix[runner]}.js`;
    const pathToOutputFile = buildPathToOutputFile(dirName, outputFileName);

    const directory = dirname(pathToOutputFile);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    fs.writeFileSync(pathToOutputFile, rendered, 'utf8');
    success(`Generated ${specs.length} tests in ${pathToOutputFile}.`);
    generatedFileCount++;
  });

  const outputFolderName = resolve(process.cwd(), outputFolder);
  success(`Generated ${generatedFileCount} spec files in ${outputFolderName}.`);
}
