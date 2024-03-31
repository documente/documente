import { OPTION_KEYS, CLI_OPTIONS } from './cli-options.mjs';
import Enquirer from 'enquirer';
import fs from 'fs';
import { resolve } from 'path';
import { warn } from './logger.mjs';

export async function promptConfig(baseConfig, yesToAll, hasConfigFile) {
  let answers = {};

  if (hasConfigFile && baseConfig.sets) {
    answers = { sets: baseConfig.sets };
  }

  for (const optionKey of OPTION_KEYS) {
    const option = CLI_OPTIONS[optionKey];
    const baseValue = baseConfig[optionKey];
    const initial = option.defaultValueFn
      ? option.defaultValueFn(answers)
      : option.defaultValue;
    const message =
      (option.required ? '' : '(Optional) ') + option.promptMessage;

    if (baseValue != null) {
      if (isValidValue(optionKey, baseValue)) {
        answers[optionKey] = baseValue;
        continue;
      } else {
        warn(`Invalid value for ${optionKey} in config file.`);

        if (yesToAll) {
          throw new Error('Invalid config file');
        }
      }
    } else if (yesToAll || hasConfigFile) {
      answers[optionKey] = initial;
      continue;
    }

    if (yesToAll && answers[optionKey] == null && option.required) {
      throw new Error(`Missing required option '${optionKey}' in config file`);
    }

    switch (option.type) {
      case 'choices': {
        const answer = await Enquirer.prompt({
          type: 'select',
          name: optionKey,
          message,
          choices: option.choices,
          required: option.required,
        });
        answers = { ...answers, ...answer };
        break;
      }
      case 'string_array': {
        const answer = await Enquirer.prompt({
          type: 'list',
          name: optionKey,
          message,
          required: option.required,
          initial,
        });
        answers = { ...answers, ...answer };
        break;
      }
      case 'string': {
        const answer = await Enquirer.prompt({
          type: 'input',
          name: optionKey,
          message,
          required: option.required,
          initial,
        });
        answers = { ...answers, ...answer };
        break;
      }
      case 'filepath': {
        for (;;) {
          const answer = await Enquirer.prompt({
            type: 'input',
            name: optionKey,
            message,
            required: option.required,
            initial,
          });

          if (answer[optionKey] === '' && !option.required) {
            answers = { ...answers, ...answer };
            break;
          }

          if (isPathToExistingFile(answer[optionKey])) {
            answers = { ...answers, ...answer };
            break;
          } else {
            warn(`File ${answer[optionKey]} does not exist.`);
          }
        }
      }
    }
  }

  return answers;
}

function isValidValue(optionKey, value) {
  const option = CLI_OPTIONS[optionKey];

  switch (option.type) {
    case 'choices':
      return option.choices.includes(value);
    case 'string_array':
      if (typeof value === 'string') {
        return true;
      }

      return Array.isArray(value) && value.every((v) => typeof v === 'string');
    case 'string':
    case 'filepath':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number';
    default:
      throw new Error(`Invalid option type: ${option.type}`);
  }
}

function isPathToExistingFile(path) {
  if (path == null) {
    return false;
  }

  try {
    fs.accessSync(resolve(process.cwd(), './' + path), fs.constants.R_OK);
    return true;
  } catch (e) {
    return false;
  }
}
