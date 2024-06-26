import {
  buildInstructions,
  BuiltInActionInstruction,
  BuiltInAssertion,
  BuiltinAssertionCode,
  Externals,
  Instruction,
  normalizeEOL,
  SelectorTree,
  SystemLevelInstruction,
  validateContext,
} from '@documente/phrase';
import YAML from 'yaml';

// TODO: include actual types from cypress without importing the whole package
declare const cy: {
  visit: (url: string) => void;
  go: (direction: 'back' | 'forward') => void;
  get: (selector: string) => {
    type: (text: string) => void;
    click: () => void;
    check: () => void;
    clear: () => void;
    dblclick: () => void;
    rightclick: () => void;
    scrollIntoView: () => void;
    uncheck: () => void;
    select: (text: string) => void;
    should: (chainer: string, ...args: string[]) => void;
    trigger: (event: string) => void;
  };
  screenshot: (name: string, options: object) => void;
  wait: (milliseconds: number) => void;
  exec: (command: string) => void;
};

interface Options {
  selectorTree: string | SelectorTree;
  externals: Externals;
  env: string | Record<string, string>;
  waitBeforeScreenshot: number;
}

interface ScreenshotInfo {
  path: string;
  name: string;
}

export class CypressRunner {
  readonly selectorTree: SelectorTree;
  readonly externals: Externals;
  readonly fragments: string[];
  readonly env: Record<string, string>;
  readonly waitBeforeScreenshot: number;

  screenshotInfos: ScreenshotInfo[] = [];

  constructor(options: Options) {
    this.selectorTree =
      typeof options.selectorTree === 'string'
        ? YAML.parse(options.selectorTree)
        : options.selectorTree;
    this.externals = options.externals;
    this.env =
      typeof options.env === 'string' ? YAML.parse(options.env) : options.env;
    this.fragments = [];
    this.waitBeforeScreenshot = options.waitBeforeScreenshot;

    validateContext(this.selectorTree, this.externals);
  }

  add(str: string) {
    this.fragments.push(normalizeEOL(str));
  }

  run(str: string) {
    str = normalizeEOL(str) + '\n' + this.fragments.join('\n');

    const instructions = buildInstructions(
      str,
      this.selectorTree,
      this.externals,
      this.env,
    );
    instructions.forEach((instruction: Instruction) => {
      if (instruction.kind === 'system-level') {
        this.runSystemLevel(instruction);
      } else if (instruction.kind === 'builtin-action') {
        this.runAction(instruction);
      } else if (instruction.kind === 'builtin-assertion') {
        this.runBuiltInAssertion(instruction);
      }
    });
  }

  /**
   * Checks if the target is defined.
   * @param {Array | null} target - The target.
   * @param {string} action - The action.
   * @returns {boolean} True if the target is defined, false otherwise.
   * @throws {Error} If the target is not defined.
   */
  private targetIsDefined(
    target: string[] | null,
    action: string,
  ): target is string[] {
    if (!target) {
      throw new Error(`Target is required for action ${action}.`);
    }

    return true;
  }

  /**
   * Runs an action.
   * @param {Object} actionInstruction - The action instruction.
   */
  private runAction(actionInstruction: BuiltInActionInstruction) {
    const { selectors, action, args } = actionInstruction;

    switch (action) {
      case 'type':
        if (this.targetIsDefined(selectors, action)) {
          cy.get(selectors.join(' ')).type(args[0]);
        }
        break;
      case 'click':
        if (this.targetIsDefined(selectors, action)) {
          cy.get(selectors.join(' ')).click();
        }
        break;
      case 'visit':
        cy.visit(args[0]);
        break;
      case 'check':
        if (this.targetIsDefined(selectors, action)) {
          cy.get(selectors.join(' ')).check();
        }
        break;
      case 'clear':
        if (this.targetIsDefined(selectors, action)) {
          cy.get(selectors.join(' ')).clear();
        }
        break;
      case 'double_click':
        if (this.targetIsDefined(selectors, action)) {
          cy.get(selectors.join(' ')).dblclick();
        }
        break;
      case 'hover':
        if (this.targetIsDefined(selectors, action)) {
          cy.get(selectors.join(' ')).trigger('mouseenter');
          cy.get(selectors.join(' ')).trigger('mouseover');
        }
        break;
      case 'right_click':
        if (this.targetIsDefined(selectors, action)) {
          cy.get(selectors.join(' ')).rightclick();
        }
        break;
      case 'scroll':
        if (this.targetIsDefined(selectors, action)) {
          cy.get(selectors.join(' ')).scrollIntoView();
        }
        break;
      case 'uncheck':
        if (this.targetIsDefined(selectors, action)) {
          cy.get(selectors.join(' ')).uncheck();
        }
        break;
      case 'select':
        if (this.targetIsDefined(selectors, action)) {
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

    if (actionInstruction.screenshotName) {
      this.saveScreenshot(actionInstruction.screenshotName);
    }
  }

  /**
   * Runs a built-in assertion.
   * @param {Object} assertion - The assertion.
   * @throws {Error} If the target selectors are not defined or the assertion is unknown.
   */
  private runBuiltInAssertion(assertion: BuiltInAssertion) {
    const { selectors, args, code } = assertion;

    if (!selectors) {
      throw new Error('Target selectors are required for built-in assertions.');
    }

    const chainer = knownChainer[code];
    if (chainer == null) {
      throw new Error(`Unknown assertion code: ${code}`);
    }

    cy.get(selectors.join(' ')).should(chainer, ...args);

    if (assertion.screenshotName) {
      this.saveScreenshot(assertion.screenshotName);
    }
  }

  private runSystemLevel(instruction: SystemLevelInstruction) {
    const systemAction = this.externals[instruction.key];
    systemAction(...instruction.args);

    if (instruction.screenshotName) {
      this.saveScreenshot(instruction.screenshotName);
    }
  }

  private saveScreenshot(name: string) {
    if (name.endsWith('.png')) {
      name = name.slice(0, -4);
    }

    if (this.waitBeforeScreenshot) {
      cy.wait(this.waitBeforeScreenshot);
    }

    cy.screenshot(name, {
      overwrite: true,
    });
  }
}

const knownChainer: Record<BuiltinAssertionCode, string> = {
  'have text': 'have.text',
  'be visible': 'be.visible',
  'be hidden': 'be.hidden',
  'contain text': 'contain.text',
  'have value': 'have.value',
  'have class': 'have.class',
  exist: 'exist',
  'not exist': 'not.exist',
  'be checked': 'be.checked',
  'be unchecked': 'not.be.checked',
  'be disabled': 'be.disabled',
  'be enabled': 'be.enabled',
  'have occurrences': 'have.length',
};
