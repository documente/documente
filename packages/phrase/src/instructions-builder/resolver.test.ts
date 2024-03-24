import { expect, test } from '@jest/globals';
import { resolve, resolvePath, resolvePathRecursively } from './resolver';
import { TypedFragment } from '../interfaces/instructions.interface';
import { isQuoted } from '../quoted-text';

function typed(segments: string[]): TypedFragment[] {
  return segments.map((segment) => ({
    type: isQuoted(segment) ? 'arg' : 'text',
    value: segment,
  }));
}

test('resolvePath should resolve a root node', () => {
  const tree = {
    foo: {
      bar: {},
    },
    bar: {},
  };
  const result = resolvePath(tree, typed(['foo']));
  expect(result).toEqual({
    key: 'foo',
    fragments: [
      {
        value: 'foo',
        type: 'text',
      },
    ],
  });
});

test('resolvePath should resolve a root node with composed tokens', () => {
  const tree = {
    welcome: {
      message: {},
    },
    'welcome message': {},
  };
  const result = resolvePath(tree, typed(['welcome', 'message']));
  expect(result).toEqual({
    key: 'welcome message',
    fragments: typed(['welcome', 'message']),
  });
});

test('resolvePath should return undefined when no match is found', () => {
  const tree = {
    foo: {},
    bar: {},
  };

  const result = resolvePath(tree, typed(['baz']));
  expect(result).toEqual(undefined);
});

test('resolvePath should resolve fragments with quoted text', () => {
  const typedFragments = typed(['the', '"welcome message"', 'button']);
  const tree = {
    'the {{label}} button': 'button[label="{{label}}"]',
  };
  const result = resolvePath(tree, typedFragments);
  expect(result).toEqual({
    key: 'the {{label}} button',
    fragments: typedFragments,
  });
});

test('resolvePath should resolve node with quoted text', () => {
  const typedFragments = typed(['the', '"red"', 'button']);
  const tree = {
    'the "red" button': 'button[label="{{label}}"]',
  };
  const result = resolvePath(tree, typedFragments);
  expect(result).toEqual({
    key: 'the "red" button',
    fragments: typedFragments,
  });
});

test('resolvePathRecursively should resolve a nested node', () => {
  const tree = {
    foo: {
      bar: {},
    },
    bar: {},
  };
  const result = resolvePathRecursively(tree, typed(['foo', 'bar']));
  expect(result?.map((r) => r.key)).toEqual(['foo', 'bar']);
});

test('resolvePathRecursively should resolve a nested node with composed tokens', () => {
  const tree = {
    welcome: {
      message: { foo: {} },
    },
    'welcome message': { foo: {} },
  };
  const result = resolvePathRecursively(
    tree,
    typed(['welcome', 'message', 'foo']),
  );
  expect(result?.map((r) => r.key)).toEqual(['welcome message', 'foo']);
});

test('resolvePathRecursively should resolve nested keys with quoted text', () => {
  const typedFragments = typed(['the', '"fruits"', 'list', '"apple"', 'item']);
  const tree = {
    'the {{label}} list': {
      _selector: 'ul[label="{{label}}"]',
      '{{label}} item': 'li[label="{{label}}"]',
    },
  };
  const result = resolvePathRecursively(tree, typedFragments);
  expect(result).toEqual([
    {
      key: 'the {{label}} list',
      fragments: typedFragments.slice(0, 3),
    },
    {
      key: '{{label}} item',
      fragments: typedFragments.slice(3),
    },
  ]);
});

test('resolvePathRecursively should throw error if no match is found', () => {
  const tree = {
    welcome: {
      message: { foo: {} },
    },
    'welcome message': { foo: {} },
  };

  const result = resolvePathRecursively(tree, typed(['foo']));
  expect(result).toBeUndefined();
});

test('resolve should find among previous node descendants', () => {
  const fragments = typed(['foo', 'bar']);
  const tree = {
    welcome: {
      foo: { bar: {} },
      bar: { baz: {} },
    },
    foo: { bar: {} },
    bar: { baz: {} },
  };

  const result = resolve(tree, fragments, [
    {
      key: 'welcome',
      fragments: typed(['welcome']),
    },
  ]);
  expect(result?.map((r) => r.key)).toEqual(['welcome', 'foo', 'bar']);
});

test("resolve should find among previous' parent descendants", () => {
  const tree = {
    welcome: {
      foo: { bar: {} },
      bar: { baz: {} },
    },
    foo: { bar: {} },
    bar: { baz: {} },
  };

  const result = resolve(tree, typed(['foo', 'bar']), [
    {
      key: 'welcome',
      fragments: typed(['welcome']),
    },
    {
      key: 'bar',
      fragments: typed(['bar']),
    },
  ]);
  expect(result?.map((r) => r.key)).toEqual(['welcome', 'foo', 'bar']);
});

test('resolve should ignore previous and find from root', () => {
  const tree = {
    welcome: {
      foo: { bar: {} },
    },
    foo: { bar: {} },
    bar: { baz: {} },
  };

  const result = resolve(tree, typed(['bar', 'baz']), [
    {
      key: 'welcome',
      fragments: typed(['welcome']),
    },
  ]);
  expect(result?.map((r) => r.key)).toEqual(['bar', 'baz']);
});

test('resolve should ignore previous and previous parent and find from root', () => {
  const tree = {
    welcome: {
      message: '.message',
      foo: { bar: {} },
    },
    foo: { bar: {} },
    bar: { baz: {} },
  };

  const result = resolve(tree, typed(['bar', 'baz']), [
    {
      key: 'welcome',
      fragments: typed(['welcome']),
    },
    {
      key: 'message',
      fragments: typed(['message']),
    },
  ]);
  expect(result?.map((r) => r.key)).toEqual(['bar', 'baz']);
});

test('resolve should throw if previous node is not found', () => {
  const tree = {
    'welcome message': { foo: {} },
  };

  expect(() =>
    resolve(tree, typed(['foo']), [
      {
        key: 'welcome',
        fragments: typed(['welcome']),
      },
    ]),
  ).toThrow('Could not find node at path welcome');
});

test('resolve should resolve in child of previous node when path starts with its', () => {
  const tree = {
    'welcome message': { foo: {} },
  };
  const result = resolve(tree, typed(['its', 'foo']), [
    {
      key: 'welcome message',
      fragments: typed(['welcome', 'message']),
    },
  ]);
  expect(result?.map((r) => r.key)).toEqual(['welcome message', 'foo']);
});

test('resolve should throw if using its without child path', () => {
  const tree = {
    'welcome message': { foo: {} },
  };
  expect(() =>
    resolve(tree, typed(['its']), [
      {
        key: 'welcome message',
        fragments: typed(['welcome', 'message']),
      },
    ]),
  ).toThrow('Expected child path after "its" but got nothing');
});

test('resolve should throw if cannot find child node using its', () => {
  const tree = {
    'welcome message': { foo: {} },
  };
  expect(() =>
    resolve(tree, typed(['its', 'bar']), [
      {
        key: 'welcome message',
        fragments: typed(['welcome', 'message']),
      },
    ]),
  ).toThrow('Cannot find child node at path welcome message bar');
});

test('resolve should throw if using its without previous path', () => {
  const tree = {
    'welcome message': { foo: {} },
  };
  expect(() => resolve(tree, typed(['its', 'foo']), [])).toThrow(
    'Cannot use "its" without a previous path',
  );
});
