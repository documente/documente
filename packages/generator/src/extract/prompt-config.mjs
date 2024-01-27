import {optionKeys, options} from './options.mjs';
import Enquirer from 'enquirer';

export async function promptConfig(baseConfig = {}, yesToAll = false) {
  let answers = {};

  for (const optionKey of optionKeys) {
    if (baseConfig[optionKey] != null) {
      if (isValidValue(optionKey, baseConfig[optionKey])) {
        answers[optionKey] = baseConfig[optionKey];
        continue;
      } else {
        console.log('Invalid value for', optionKey, 'in config file.');

        if (yesToAll) {
          throw new Error('Invalid config file');
        }
      }
    }

    const option = options[optionKey];

    if (yesToAll && baseConfig[optionKey] == null && option.required) {
      throw new Error(`Missing required option '${optionKey}' in config file`);
    }

    const initial = option.defaultValueFn ? option.defaultValueFn(answers) : option.defaultValue;
    const message = (option.required ? '' : '(Optional) ') + option.promptMessage;


    switch (option.type) {
      case 'choices': {
        const answer = await Enquirer.prompt({
          type: 'select',
          name: optionKey,
          message,
          choices: option.choices,
          required: option.required,
        });
        answers = {...answers, ...answer};
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
        answers = {...answers, ...answer};
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
        answers = {...answers, ...answer};
        break;
      }
    }
  }

  return answers;
}

function isValidValue(optionKey, value) {
  const option = options[optionKey];

  switch (option.type) {
    case 'choices':
      return option.choices.includes(value);
    case 'string_array':
      if (typeof value === 'string') {
        return true;
      }

      return Array.isArray(value) && value.every((v) => typeof v === 'string');
    case 'string':
      return typeof value === 'string';
    default:
      throw new Error(`Invalid option type: ${option.type}`);
  }
}
