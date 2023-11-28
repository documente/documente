import { Context } from '../interfaces/context.interface';
import { Instruction } from '../interfaces/instructions.interface';
import { Parser } from '../parser';
import {
  Block,
  GivenWhenThenStatements,
  Statement,
} from '../interfaces/statements.interface';
import { BuildContext } from '../interfaces/build-context.interface';
import { extractInstructionsFromStatement } from './generic-instruction-extractor';

export function buildInstructions(
  input: string,
  context: Context,
): Instruction[] {
  const parser = new Parser();
  const sections = parser.parse(input);
  const blocks = sections.filter(
    (section) => section.kind !== 'given-when-then',
  ) as Block[];

  const buildContext: BuildContext = {
    previousPath: [],
    testContext: context,
    blocks,
    input,
  };

  return sections
    .filter((section) => section.kind === 'given-when-then')
    .map((section) => {
      const givenWhenThen = section as GivenWhenThenStatements;
      return [
        ...buildInstructionsFromStatements(givenWhenThen.given, buildContext),
        ...buildInstructionsFromStatements(givenWhenThen.when, buildContext),
        ...buildInstructionsFromStatements(givenWhenThen.then, buildContext),
      ];
    })
    .flat();
}

function buildInstructionsFromStatements(
  statements: Statement[],
  buildContext: BuildContext,
  blockStack: Block[] = [],
): Instruction[] {
  return statements
    .map((statement) =>
      extractInstructionsFromStatement(statement, buildContext, blockStack, {}),
    )
    .flat();
}
