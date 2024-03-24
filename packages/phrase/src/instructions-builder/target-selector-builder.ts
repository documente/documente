import { Token } from '../interfaces/token.interface';
import { BuildContext } from '../interfaces/build-context.interface';
import { resolve } from './resolver';
import { prettyPrintError } from '../error';
import { SelectorTree, Selector } from '../interfaces/selector-tree.interface';
import {
  ResolvedTarget,
  TypedFragment,
} from '../interfaces/instructions.interface';
import { isQuoted, unquoted } from '../quoted-text';
import { interpolate } from './named-arguments';
import { TargetSelector } from '../interfaces/target-selector.interface';
import { extractNamedArguments } from './named-arguments-builder';

export function extractTargetSelector(
  target: Token[],
  buildContext: BuildContext,
  namedArguments: Record<string, string>,
  requireTarget: boolean,
): TargetSelector | null {
  if (target.length === 0) {
    return null;
  }

  const { selectorTree, previousPath, input } = buildContext;

  if (target.length === 1 && target[0].value === 'it') {
    return {
      selectors: buildSelectors(
        selectorTree,
        previousPath,
        target,
        buildContext,
        namedArguments,
      ),
      path: previousPath,
    };
  }

  const typedFragments: TypedFragment[] = target.map((token) => {
    if (isQuoted(token.value)) {
      return { type: 'arg', value: token.value };
    } else {
      return { type: 'text', value: token.value };
    }
  });

  const targetPath = resolve(selectorTree, typedFragments, previousPath);

  if (!targetPath) {
    if (requireTarget) {
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

    // buildContext.previousPath = [];
    return null;
  }

  buildContext.previousPath = targetPath;

  return {
    selectors: buildSelectors(
      selectorTree,
      targetPath,
      target,
      buildContext,
      namedArguments,
    ),
    path: targetPath,
  };
}

function buildSelectors(
  tree: SelectorTree,
  targetPath: ResolvedTarget[],
  target: Token[],
  buildContext: BuildContext,
  namedArguments: Record<string, string>,
) {
  const selectors: string[] = [];
  let currentNode: SelectorTree | Selector = tree;

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

    if (currentNode == null) {
      throw new Error(
        prettyPrintError(
          `Could not resolve node for "${target.join(' ')}"`,
          buildContext.input,
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

    const unquotedArgs = pathSegment.fragments
      .filter((fragment) => fragment.type === 'arg')
      .map((fragment) => {
        return unquoted(
          interpolate(fragment.value, namedArguments, target[0], buildContext),
        );
      });

    const newNamedArguments = {
      ...extractNamedArguments(pathSegment.key.split(' '), unquotedArgs),
    };

    if (typeof selector === 'string') {
      const interpolatedSelector = interpolate(
        selector,
        newNamedArguments,
        target[0],
        buildContext,
      );
      selectors.push(interpolatedSelector);
    } else if (typeof selector === 'function') {
      const args = pathSegment.fragments
        .filter((fragment) => fragment.type === 'arg')
        .map((fragment) => unquoted(fragment.value));
      selectors.push(selector(...args));
    }
  });

  return selectors;
}
