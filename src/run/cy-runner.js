import {buildInstructions, normalizeEOL, validateContext,} from '@documente/phrase';
import YAML from 'yaml';

/**
 * @callback TemplateStringsOrStringConsumer
 * @param {TemplateStringsArray | string} strings - The template strings or a string.
 * @param {...unknown} values - The values to be used in the template strings.
 * @returns {void}
 */

/**
 * @typedef {Object} TestRunner
 * @property {TemplateStringsOrStringConsumer} add - A function that accepts template strings or a string.
 * @property {TemplateStringsOrStringConsumer} test - A function that accepts template strings or a string.
 */
/**
 * Processes template strings.
 * @param {TemplateStringsArray | string} strings - The template strings or a string.
 * @param {Array} values - The values to be used in the template strings.
 * @returns {string} The processed string.
 * @throws {Error} If the input is invalid.
 */
function processTemplateStrings(strings, values) {
  if (Array.isArray(strings)) {
    return normalizeEOL(
        strings.reduce((acc, curr, i) => {
          return acc + curr + (values[i] ?? '');
        }, ''),
    );
  } else if (typeof strings === 'string') {
    return normalizeEOL(strings);
  } else {
    throw new Error('Invalid input');
  }
}

/**
 * Returns a TestRunner with the given context.
 * @param {Object | string} selectorTree - The selector tree or a string.
 * @param {Object} externals - The externals.
 * @returns {Object} The TestRunner.
 */
function withContext(selectorTree, externals) {
  const tree =
      typeof selectorTree === 'string' ? YAML.parse(selectorTree) : selectorTree;

  const fragments = [];

  validateContext(tree, externals);

  function runInstruction(instruction) {
    if (instruction.kind === 'system-level') {
      runSystemLevel(instruction, externals);
    } else if (instruction.kind === 'builtin-action') {
      runAction(instruction);
    } else if (instruction.kind === 'builtin-assertion') {
      runBuiltInAssertion(instruction);
    }
  }

  return {
    add(strings, ...values) {
      fragments.push(processTemplateStrings(strings, values));
    },
    test(strings, ...values) {
      let str = processTemplateStrings(strings, values);

      str += '\n' + fragments.join('\n');

      const instructions = buildInstructions(str, tree, externals);
      instructions.forEach(runInstruction);
    },
  };
}

/**
 * Checks if the target is defined.
 * @param {Array | null} target - The target.
 * @param {string} action - The action.
 * @returns {boolean} True if the target is defined, false otherwise.
 * @throws {Error} If the target is not defined.
 */
function targetIsDefined(target, action) {
  if (!target) {
    throw new Error(`Target is required for action ${action}.`);
  }

  return true;
}

/**
 * Runs an action.
 * @param {Object} actionInstruction - The action instruction.
 */
function runAction(actionInstruction) {
  const {selectors, action, args} = actionInstruction;

  switch (action) {
    case 'type':
      if (targetIsDefined(selectors, action)) {
        cy.get(selectors.join(' ')).type(args[0]);
      }
      break;
    case 'click':
      if (targetIsDefined(selectors, action)) {
        cy.get(selectors.join(' ')).click();
      }
      break;
    case 'visit':
      cy.visit(args[0]);
      break;
    case 'check':
      if (targetIsDefined(selectors, action)) {
        cy.get(selectors.join(' ')).check();
      }
      break;
    case 'clear':
      if (targetIsDefined(selectors, action)) {
        cy.get(selectors.join(' ')).clear();
      }
      break;
    case 'double_click':
      if (targetIsDefined(selectors, action)) {
        cy.get(selectors.join(' ')).dblclick();
      }
      break;
    case 'right_click':
      if (targetIsDefined(selectors, action)) {
        cy.get(selectors.join(' ')).rightclick();
      }
      break;
    case 'scroll':
      if (targetIsDefined(selectors, action)) {
        cy.get(selectors.join(' ')).scrollIntoView();
      }
      break;
    case 'uncheck':
      if (targetIsDefined(selectors, action)) {
        cy.get(selectors.join(' ')).uncheck();
      }
      break;
    case 'select':
      if (targetIsDefined(selectors, action)) {
        cy.get(selectors.join(' ')).select(args[0]);
      }
      break;
    case 'go_back':
      cy.go('back');
      break;
    case 'go_forward':
      cy.go('forward');
      break;
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

const knownChainer = {
  'have text': 'have.text',
  'be visible': 'be.visible',
  'contain text': 'contain.text',
  'have value': 'have.value',
  'have class': 'have.class',
  exist: 'exist',
  'not exist': 'not.exist',
  'be checked': 'be.checked',
  'be unchecked': 'be.unchecked',
  'be disabled': 'be.disabled',
  'be enabled': 'be.enabled',
  'have occurrences': 'have.length',
};

/**
 * Runs a built-in assertion.
 * @param {Object} assertion - The assertion.
 * @throws {Error} If the target selectors are not defined or the assertion is unknown.
 */
function runBuiltInAssertion(assertion) {
  const {selectors, args} = assertion;

  if (!selectors) {
    throw new Error('Target selectors are required for built-in assertions.');
  }

  const chainer = knownChainer[assertion.code];

  if (chainer == null) {
    throw new Error(`Unknown assertion: ${assertion.code}`);
  }

  cy.get(selectors.join(' ')).should(chainer, ...args);
}

/**
 * Runs a system level instruction.
 * @param {Object} instruction - The instruction.
 * @param {Object} externals - The externals.
 */
function runSystemLevel(instruction, externals) {
  const systemAction = externals[instruction.key];
  systemAction(...instruction.args);
}