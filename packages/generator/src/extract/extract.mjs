import fs from 'fs';
import YAML from 'yaml';
import { basename, dirname, resolve, relative, parse } from 'path';
import { globSync as glob } from 'glob';
import Mustache from 'mustache';
import { Splitter } from '@documente/phrase';
import { fileURLToPath } from 'node:url';
import { success, warn } from './logger.mjs';
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
    throw new Error('No input files found');
  }

  return files;
}

export async function extractTests(config, watchMode) {
  const {
    selectors,
    externals,
    outputDir,
    inputFiles,
    runner,
    testRegex,
    env,
  } = config;

  const outputPathToExternals =
    externals == null || externals === ''
      ? null
      : relative(outputDir, externals).replace(/\\/g, '/');
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

  fs.mkdirSync(resolve(process.cwd(), outputDir), { recursive: true });

  let generatedFileCount = 0;

  files.forEach((file) => {
    const splitter = new Splitter();
    const sourceFileName = basename(file);
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
      specs,
      blocks,
    };

    const rendered = Mustache.render(specTemplate, view);
    const withoutExt = parse(sourceFileName).name;
    const outputFileName = `${withoutExt}${defaultSuffix[runner]}.js`;
    const pathToOutputFile = resolve(process.cwd(), outputDir, outputFileName);
    fs.writeFileSync(pathToOutputFile, rendered, 'utf8');
    success(`Generated ${specs.length} tests in ${pathToOutputFile}.`);
    generatedFileCount++;
  });

  const outputDirName = resolve(process.cwd(), outputDir);
  success(`Generated ${generatedFileCount} spec files in ${outputDirName}.`);
}
