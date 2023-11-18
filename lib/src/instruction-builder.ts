import { resolve } from './resolver';
import { prettyPrintError } from './error';
import { isBuiltinAction } from './builtin-actions';
import { unquoted } from './quoted-text';
import { KnownChainer } from './known-chainers';
import { getNode } from './get-node';
import { Context } from './interfaces/context.interface';
import {
  ActionInstruction,
  AssertionInstruction,
  Instruction,
  Instructions,
  ResolvedAssertion,
  ResolvedTarget,
  SystemLevelInstruction,
} from './interfaces/instructions.interface';
import { Parser } from './parser';
import {
  ActionStatement,
  AssertionStatement,
  ParsedSentence,
  Statement,
  SystemLevelStatement,
} from './interfaces/statements.interface';
import {
  PageObjectTree,
  Selector,
} from './interfaces/page-object-tree.interface';
import { Token } from './interfaces/token.interface';

interface BuildContext {
  previousPath: ResolvedTarget[];
  testContext: Context;
  input: string;
}

export function buildInstructions(
  input: string,
  context: Context,
): Instructions {
  const parser = new Parser();
  const sentenceTree: ParsedSentence = parser.parse(input);

  const buildContext: BuildContext = {
    previousPath: [],
    testContext: context,
    input,
  };

  return {
    given: buildInstructionsFromStatements(sentenceTree.given, buildContext),
    when: buildInstructionsFromStatements(sentenceTree.when, buildContext),
    then: buildInstructionsFromStatements(sentenceTree.then, buildContext),
  };
}

function buildInstructionsFromStatements(
  statements: Statement[],
  buildContext: BuildContext,
): Instruction[] {
  const instructions: Instruction[] = [];

  statements.forEach((statement) => {
    if (statement.kind === 'system-level') {
      instructions.push(extractSystemLevelInstruction(statement, buildContext));
    } else if (statement.kind === 'action') {
      instructions.push(extractAction(statement, buildContext));
    } else if (statement.kind === 'assertion') {
      instructions.push(extractAssertionInstruction(statement, buildContext));
    }
  });

  return instructions;
}

function extractAction(
  actionStatement: ActionStatement,
  buildContext: BuildContext,
): ActionInstruction {
  const resolved = extractTargetSelector(actionStatement.target, buildContext);
  const target = resolved?.selectors ?? null;
  if (resolved?.path) {
    buildContext.previousPath = resolved.path;
  }
  const actionName = extractActionName(actionStatement, buildContext.input);
  const args = actionStatement.args.map((arg) => unquoted(arg.value));

  return {
    kind: 'action',
    target,
    action: actionName,
    args,
  };
}

function extractActionName(action: ActionStatement, input: string) {
  const actionName = action.action.map((a) => a.value).join(' ');

  if (!isBuiltinAction(actionName)) {
    throw new Error(
      prettyPrintError(
        `Unknown action "${actionName}"`,
        input,
        action.action[0],
      ),
    );
  }
  return actionName;
}

interface TargetSelector {
  selectors: string[];
  path: ResolvedTarget[];
}

function extractTargetSelector(
  target: Token[],
  buildContext: BuildContext,
): TargetSelector | null {
  if (target.length === 0) {
    return null;
  }

  const { testContext, previousPath, input } = buildContext;
  const tree = testContext.pageObjectTree;

  if (target.length === 1 && target[0].value === 'it') {
    return {
      selectors: buildSelectors(tree, previousPath, target, input),
      path: previousPath,
    };
  }

  const targetFragments = target.map((t) => t.value);

  const targetPath = resolve(tree, targetFragments, previousPath);

  if (!targetPath) {
    throw new Error(
      prettyPrintError(
        `Could not resolve target path for "${target
          .map((t) => t.value)
          .join(' ')}"`,
        input,
        target[0],
      ),
    );
  }

  return {
    selectors: buildSelectors(tree, targetPath, target, input),
    path: targetPath,
  };
}

function buildSelectors(
  tree: PageObjectTree,
  targetPath: ResolvedTarget[],
  target: Token[],
  input: string,
) {
  const selectors: string[] = [];
  let currentNode: PageObjectTree | Selector = tree;

  targetPath.forEach((pathSegment) => {
    if (
      !currentNode ||
      typeof currentNode === 'string' ||
      typeof currentNode === 'function'
    ) {
      throw new Error('Invalid tree');
    }

    const child = currentNode[pathSegment.key];

    if (!child || typeof child === 'function') {
      throw new Error('Invalid tree');
    }

    currentNode = child;

    if (!currentNode) {
      throw new Error(
        prettyPrintError(
          `Could not resolve node for "${target
            .map((t) => t.value)
            .join(' ')}"`,
          input,
          target[0],
        ),
      );
    }

    let selector: Selector | undefined;

    if (typeof currentNode === 'object') {
      selector = currentNode._selector;
    } else {
      selector = currentNode;
    }

    if (typeof selector === 'string') {
      selectors.push(selector);
    } else if (typeof selector === 'function') {
      const arg = pathSegment.arg;

      if (arg) {
        selectors.push(selector(unquoted(arg)));
      } else {
        selectors.push(selector());
      }
    }
  });

  return selectors;
}

function resolveAssertion(
  target: ResolvedTarget[] | undefined,
  tree: PageObjectTree,
  assertion: string,
  input: string,
  firstToken: Token,
): ResolvedAssertion {
  const builtinAssertion = findBuiltinAssertion(assertion);

  if (builtinAssertion) {
    return {
      kind: 'builtin',
      chainer: builtinAssertion,
    };
  }

  if (target) {
    const customAssertion = findCustomAssertion(assertion, target, tree);

    if (customAssertion) {
      return {
        kind: 'custom',
        method: customAssertion,
      };
    }
  }

  throw new Error(
    prettyPrintError(`Unknown assertion "${assertion}"`, input, firstToken),
  );
}

function findBuiltinAssertion(assertion: string): string | null {
  const isNegated = assertion.startsWith('not ');

  if (isNegated) {
    assertion = assertion.slice(4);
  }

  const isKnown = Object.keys(KnownChainer).includes(assertion);

  if (isKnown) {
    const resolved = KnownChainer[assertion as keyof typeof KnownChainer];
    return isNegated ? 'not.' + resolved : resolved;
  }

  return null;
}

function findCustomAssertion(
  assertion: string,
  target: ResolvedTarget[] | null,
  tree: PageObjectTree,
): string | null {
  if (!target) {
    return null;
  }

  const node = getNode(
    tree,
    target.map((t) => t.key),
  );
  const assertionTestValue = assertion.split(' ').join('').toLowerCase();

  for (const key in node) {
    const keyWithoutShould = key
      .toLowerCase()
      .split('_')
      .join('')
      .replace('should', '');
    const candidate = node[key];

    if (
      keyWithoutShould === assertionTestValue &&
      typeof candidate === 'function'
    ) {
      return key;
    }
  }

  return null;
}

function extractSystemLevelInstruction(
  statement: SystemLevelStatement,
  context: BuildContext,
): SystemLevelInstruction {
  const actionName = statement.tokens
    .map((a) => a.value)
    .map((a) => a.toLowerCase())
    .join('');

  for (let systemActionsKey in context.testContext.systemActions) {
    if (systemActionsKey.toLowerCase() == actionName) {
      const args = statement.args.map((arg) => unquoted(arg.value));
      return {
        kind: 'system-level',
        key: systemActionsKey,
        args,
      };
    }
  }

  const prettyActionName = statement.tokens.map((a) => a.value).join(' ');

  throw new Error(
    prettyPrintError(
      `Unknown system-level action "${prettyActionName}"`,
      context.input,
      statement.tokens[0],
    ),
  );
}

function extractAssertionInstruction(
  statement: AssertionStatement,
  buildContext: BuildContext,
): AssertionInstruction {
  const resolved = extractTargetSelector(statement.target, buildContext);

  if (resolved?.path) {
    buildContext.previousPath = resolved.path;
  }

  const selectors = resolved?.selectors ?? null;
  const assertionName = statement.assertion.map((a) => a.value).join(' ');
  const resolvedAssertion = resolveAssertion(
    resolved?.path,
    buildContext.testContext.pageObjectTree,
    assertionName,
    buildContext.input,
    statement.firstToken,
  );
  const args = statement.args.map((arg) => unquoted(arg.value));

  return {
    kind: 'assertion',
    target: resolved?.path ?? null,
    selectors,
    assertion: resolvedAssertion,
    args,
  };
}
