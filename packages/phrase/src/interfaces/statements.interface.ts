import { Token } from './token.interface';

export interface ActionStatement {
  kind: 'action';
  tokens: Token[];
  index: number;
  parenthesizedToken: Token | null;
}

export interface AssertionStatement {
  kind: 'assertion';
  target: Token[];
  assertion: Token[];
  firstToken: Token;
  index: number;
  parenthesizedToken: Token | null;
}

export interface SystemLevelStatement {
  kind: 'system-level';
  tokens: Token[];
  args: Token[];
  index: number;
  parenthesizedToken: Token | null;
}

export type Statement =
  | ActionStatement
  | AssertionStatement
  | SystemLevelStatement;

interface BaseBlock {
  kind: string;
  header: Token[];
  fullHeader: Token[];
  body: Statement[];
  source: string;
}

export interface ActionBlock extends BaseBlock {
  kind: 'action-block';
}

export interface AssertionBlock extends BaseBlock {
  kind: 'assertion-block';
}

export type Block = ActionBlock | AssertionBlock;

export interface GivenWhenThenStatements {
  kind: 'given-when-then';
  given: Statement[];
  when: Statement[];
  then: Statement[];
  source: string;
}

export type StatementSection = GivenWhenThenStatements | Block;
