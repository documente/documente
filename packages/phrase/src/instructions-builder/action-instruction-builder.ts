import { ActionStatement, Block } from '../interfaces/statements.interface';
import {
  ActionInstruction,
  BlockActionInstruction,
} from '../interfaces/instructions.interface';
import {
  asQualifiedPart,
  BuiltinActionQualifiedPatterns,
  getMatchResult,
  MatchResult,
  QualifiedPatternPart,
} from './builtin-actions';
import { prettyPrintError } from '../error';
import { BuildContext } from '../interfaces/build-context.interface';
import { interpolate } from './named-arguments';
import { unquoted } from '../quoted-text';
import { extractTargetSelector } from './target-selector-builder';
import { extractNamedArguments } from './named-arguments-builder';
import { findScreenshotName } from './screenshot-utils';

export function extractActionInstruction(
  actionStatement: ActionStatement,
  buildContext: BuildContext,
  namedArguments: Record<string, string>,
): ActionInstruction {
  const block = findActionBlock(
    actionStatement,
    buildContext.blocks,
    buildContext,
    namedArguments,
  );

  if (block) {
    return block;
  }

  for (const parts of BuiltinActionQualifiedPatterns.keys()) {
    const matchResult = getMatchResult(actionStatement.tokens, parts);

    if (matchResult) {
      const { interpolatedArgs, selectors } = buildArgsAndSelectors(
        matchResult,
        buildContext,
        namedArguments,
      );

      return {
        kind: 'builtin-action',
        selectors,
        action: BuiltinActionQualifiedPatterns.get(parts)!,
        args: interpolatedArgs,
        screenshotName: findScreenshotName(actionStatement.parenthesizedToken),
      };
    }
  }

  throw new Error(
    prettyPrintError(
      `Unknown action "${actionStatement.tokens
        .map((a) => a.value)
        .join(' ')}"`,
      buildContext.input,
      actionStatement.tokens[0],
    ),
  );
}

function findActionBlock(
  actionStatement: ActionStatement,
  blocks: Block[],
  buildContext: BuildContext,
  namedArguments: Record<string, string>,
): BlockActionInstruction | null {
  for (const block of blocks) {
    if (block.kind === 'action-block') {
      const headerQualifiedParts: QualifiedPatternPart[] = block.header.map(
        (token) => asQualifiedPart(token.value),
      );

      const matchResult = getMatchResult(
        actionStatement.tokens,
        headerQualifiedParts,
      );

      if (matchResult) {
        const { interpolatedArgs, selectors } = buildArgsAndSelectors(
          matchResult,
          buildContext,
          namedArguments,
        );

        return {
          kind: 'block-action',
          selectors,
          block,
          args: interpolatedArgs,
          namedArguments: extractNamedArguments(
            block.header.map((token) => token.value),
            interpolatedArgs,
          ),
          location: actionStatement.tokens[0],
          screenshotName: findScreenshotName(
            actionStatement.parenthesizedToken,
          ),
        };
      }
    }
  }

  return null;
}

interface ArgsAndSelectors {
  interpolatedArgs: string[];
  selectors: string[] | null;
}

function buildArgsAndSelectors(
  matchResult: MatchResult,
  buildContext: BuildContext,
  namedArguments: Record<string, string>,
): ArgsAndSelectors {
  const { target, args } = matchResult;

  const resolved = extractTargetSelector(
    target,
    buildContext,
    namedArguments,
    true,
  );
  const selectors = resolved?.selectors ?? null;

  const interpolatedArgs = args.map((arg) =>
    interpolate(unquoted(arg.value), namedArguments, arg, buildContext),
  );

  return { interpolatedArgs, selectors };
}
