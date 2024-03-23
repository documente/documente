import { getNode } from '../get-node';
import { SelectorTree } from '../interfaces/selector-tree.interface';
import {
  ResolvedTarget,
  TypedFragment,
} from '../interfaces/instructions.interface';
import { equalsCaseInsensitive } from '../equalsCaseInsensitive';

export function resolve(
  tree: SelectorTree,
  fragments: TypedFragment[],
  previous: ResolvedTarget[],
): ResolvedTarget[] | undefined {
  if (fragments[0]?.value === 'its') {
    if (fragments.length === 1) {
      throw new Error(`Expected child path after "its" but got nothing.`);
    }

    if (previous.length === 0) {
      throw new Error('Cannot use "its" without a previous path.');
    }
  }

  // Search relative to previous path
  if (previous?.length > 0) {
    const match = resolveRelativeToPrevious(tree, previous, fragments);

    if (match) {
      return [...previous, ...match];
    }
  }

  // If first segment is "its" we can stop here
  if (fragments[0]?.value === 'its') {
    const fullPath = [
      ...previous.map((p) => p.fragments).flat(),
      ...fragments.slice(1),
    ];
    throw new Error(
      `Cannot find child node at path ${fullPath.map((f) => f.value).join(' ')}`,
    );
  }

  // Search relative to previous parent
  if (previous?.length > 1) {
    const pathToParent = previous.slice(0, -1);
    const parentNode = getNode(
      tree,
      pathToParent.map((p) => p.key),
    );

    const match = resolvePathRecursively(parentNode, fragments);

    if (match) {
      return [...pathToParent, ...match];
    }
  }

  // Search from root
  return resolvePathRecursively(tree, fragments);
}

function resolveRelativeToPrevious(
  tree: SelectorTree,
  previous: ResolvedTarget[],
  fragments: TypedFragment[],
): ResolvedTarget[] | undefined {
  const previousNode = getNode(
    tree,
    previous.map((p) => p.key),
  );

  if (!previousNode) {
    throw new Error(
      `Could not find node at path ${previous
        .map((p) => p.fragments.map((f) => f.value))
        .flat()
        .join(' ')}`,
    );
  }

  const pathSegmentsWithoutIts =
    fragments[0]?.value === 'its' ? fragments.slice(1) : fragments;

  return resolvePathRecursively(previousNode, pathSegmentsWithoutIts);
}

/**
 * Resolves a path in a tree recursively. This allows for construction such as "login form login field" where
 * "login form" is a node and "login field" is a child of "login form".
 * @param node - The node to start from.
 * @param typedFragments - The path segments to resolve.
 * @param resolvedSoFar - The resolved path segments so far.
 */
export function resolvePathRecursively(
  node: SelectorTree,
  typedFragments: TypedFragment[],
  resolvedSoFar: ResolvedTarget[] = [],
): ResolvedTarget[] | undefined {
  const match = resolvePath(node, typedFragments);

  if (!match) {
    return undefined;
  }

  if (typedFragments.length === match.fragments.length) {
    return [...resolvedSoFar, match];
  }

  return resolvePathRecursively(
    node[match.key] as SelectorTree,
    typedFragments.slice(match.fragments.length),
    [...resolvedSoFar, match],
  );
}

export function resolvePath(
  tree: SelectorTree,
  typedFragments: TypedFragment[],
): ResolvedTarget | undefined {
  const keys = Object.keys(tree);

  for (let j = typedFragments.length; j > 0; j--) {
    const slicedFragments = typedFragments.slice(0, j);
    const assembledToken = slicedFragments
      .map((segment) => (segment.type === 'text' ? segment.value : '_'))
      .join(' ');
    const matchingKey = keys.find((key) => {
      const keyWithoutNamedArguments = withNamedArgumentsReplaced(key).trim();
      return equalsCaseInsensitive(keyWithoutNamedArguments, assembledToken);
    });

    if (matchingKey) {
      return {
        key: matchingKey,
        fragments: slicedFragments,
      };
    }
  }

  return undefined;
}

function withNamedArgumentsReplaced(str: string): string {
  return str.replace(/{{(.*?)}}/g, '_');
}
