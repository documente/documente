export type SelectorFn = (...args: unknown[]) => string;

export type Selector = string | SelectorFn;

export interface SelectorTree {
  _selector?: Selector;
  _extends?: string;
  [key: string]: SelectorTree | Selector | undefined;
}
