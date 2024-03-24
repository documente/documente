import {
  buildInstructions,
  BuiltInActionInstruction,
  BuiltInAssertion,
  Externals,
  normalizeEOL,
  SelectorTree,
  SystemLevelInstruction,
  validateContext,
} from '@documente/phrase';
import YAML from 'yaml';
import { Expect } from 'playwright/test';
import { Page } from 'playwright';

export class PlaywrightRunner {
  selectorTree: SelectorTree;
  externals: Externals;
  env: Record<string, string>;
  fragments: string[];

  constructor(
    selectorTree: string | SelectorTree,
    externals: Externals = {},
    env: string | Record<string, string> = {},
  ) {
    this.selectorTree =
      typeof selectorTree === 'string'
        ? YAML.parse(selectorTree)
        : selectorTree;
    this.externals = externals;
    this.env = typeof env === 'string' ? YAML.parse(env) : env;
    this.fragments = [];
    validateContext(this.selectorTree, this.externals);
  }

  add(str: string) {
    this.fragments.push(normalizeEOL(str));
  }

  async run(str: string, page: Page, expect: Expect) {
    str = normalizeEOL(str) + '\n' + this.fragments.join('\n');

    const instructions = buildInstructions(
      str,
      this.selectorTree,
      this.externals,
      this.env,
    );

    for (const instruction of instructions) {
      if (instruction.kind === 'system-level') {
        await this.runSystemLevel(instruction);
      } else if (instruction.kind === 'builtin-action') {
        await this.runAction(instruction, page);
      } else if (instruction.kind === 'builtin-assertion') {
        await this.runBuiltInAssertion(instruction, page, expect);
      }
    }
  }

  targetIsDefined(target: string[] | null, action: string): target is string[] {
    if (!target) {
      throw new Error(`Target is required for action ${action}.`);
    }

    return true;
  }

  async runAction(actionInstruction: BuiltInActionInstruction, page: Page) {
    const { selectors, action, args } = actionInstruction;

    switch (action) {
      case 'type':
        if (this.targetIsDefined(selectors, action)) {
          await page.locator(selectors.join(' ')).fill(args[0]);
        }
        break;
      case 'click':
        if (this.targetIsDefined(selectors, action)) {
          await page.locator(selectors.join(' ')).click();
        }
        break;
      case 'visit':
        await page.goto(args[0]);
        break;
      case 'check':
        if (this.targetIsDefined(selectors, action)) {
          await page.locator(selectors.join(' ')).check();
        }
        break;
      case 'clear':
        if (this.targetIsDefined(selectors, action)) {
          await page.locator(selectors.join(' ')).clear();
        }
        break;
      case 'double_click':
        if (this.targetIsDefined(selectors, action)) {
          await page.locator(selectors.join(' ')).dblclick();
        }
        break;
      case 'right_click':
        if (this.targetIsDefined(selectors, action)) {
          await page.locator(selectors.join(' ')).click({ button: 'right' });
        }
        break;
      case 'hover':
        if (this.targetIsDefined(selectors, action)) {
          await page.locator(selectors.join(' ')).hover();
        }
        break;
      case 'scroll':
        if (this.targetIsDefined(selectors, action)) {
          await page.locator(selectors.join(' ')).scrollIntoViewIfNeeded();
        }
        break;
      case 'uncheck':
        if (this.targetIsDefined(selectors, action)) {
          await page.locator(selectors.join(' ')).uncheck();
        }
        break;
      case 'select':
        if (this.targetIsDefined(selectors, action)) {
          await page.locator(selectors.join(' ')).selectOption(args[0]);
        }
        break;
      case 'go_back':
        await page.goBack();
        break;
      case 'go_forward':
        await page.goForward();
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  async runBuiltInAssertion(
    assertion: BuiltInAssertion,
    page: Page,
    expect: Expect,
  ) {
    const { selectors, args, code } = assertion;

    if (!selectors) {
      throw new Error('Target selectors are required for built-in assertions.');
    }

    switch (code) {
      case 'exist':
        await expect(page.locator(selectors.join(' '))).toHaveCount(1);
        break;
      case 'not exist':
        await expect(page.locator(selectors.join(' '))).toHaveCount(0);
        break;
      case 'be visible':
        await expect(page.locator(selectors.join(' '))).toBeVisible();
        break;
      case 'be hidden':
        await expect(page.locator(selectors.join(' '))).toBeHidden();
        break;
      case 'have text':
        await expect(page.locator(selectors.join(' '))).toHaveText(args[0]);
        break;
      case 'have occurrences':
        await expect(page.locator(selectors.join(' '))).toHaveCount(
          Number(args[0]),
        );
        break;
      case 'contain text':
        await expect(page.locator(selectors.join(' '))).toContainText(args[0]);
        break;
      case 'have class':
        await expect(page.locator(selectors.join(' '))).toHaveClass(args[0]);
        break;
      case 'have value':
        await expect(page.locator(selectors.join(' '))).toHaveValue(args[0]);
        break;
      case 'be checked':
        await expect(page.locator(selectors.join(' '))).toBeChecked();
        break;
      case 'be unchecked':
        await expect(page.locator(selectors.join(' '))).not.toBeChecked();
        break;
      case 'be disabled':
        await expect(page.locator(selectors.join(' '))).toBeDisabled();
        break;
      case 'be enabled':
        await expect(page.locator(selectors.join(' '))).toBeEnabled();
        break;
      default:
        throw new Error(`Unknown assertion code: ${code}`);
    }
  }

  async runSystemLevel(instruction: SystemLevelInstruction) {
    const systemAction = this.externals[instruction.key];
    systemAction(...instruction.args);
  }
}
