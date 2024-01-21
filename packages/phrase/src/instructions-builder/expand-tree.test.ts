import { expect, test } from '@jest/globals';
import { expandTree } from './expand-tree';

test('should expand a root node with a template node', () => {
  const expandedTree = expandTree({
    foo: {
      _extends: 'baz*',
    },
    'baz*': {
      qux: 'qux',
    },
  });

  expect(expandedTree).toEqual({
    foo: {
      _extends: 'baz*',
      qux: 'qux',
    },
  });
});

test('should expand a root node with a template selector', () => {
  const expandedTree = expandTree({
    foo: {
      _extends: 'baz*',
    },
    'baz*': 'baz',
  });

  expect(expandedTree).toEqual({
    foo: {
      _extends: 'baz*',
      _selector: 'baz',
    },
  });
});

test('should expand a nested node', () => {
  const expandedTree = expandTree({
    foo: {
      bar: {
        _extends: 'baz*',
      },
    },
    'baz*': {
      qux: 'qux',
    },
  });

  expect(expandedTree).toEqual({
    foo: {
      bar: {
        _extends: 'baz*',
        qux: 'qux',
      },
    },
  });
});

test('should reject nested template nodes', () => {
  expect(() => {
    expandTree({
      foo: {
        'bar*': 'bar',
      },
    });
  }).toThrow(`Template node "bar*" cannot be nested`);
});

test('should reject nested template nodes in templates', () => {
  expect(() => {
    expandTree({
      '*foo': {
        'bar*': 'bar',
      },
    });
  }).toThrow(`Template node "bar*" cannot be nested`);
});

test('should expand template nodes', () => {
  const expandedTree = expandTree({
    foo: {
      _extends: 'bar*',
    },
    'bar*': {
      baz: {
        _extends: 'qux*',
      },
    },
    'qux*': 'qux',
  });

  expect(expandedTree).toEqual({
    foo: {
      _extends: 'bar*',
      baz: {
        _extends: 'qux*',
        _selector: 'qux',
      },
    },
  });
});

test('should reject missing template nodes', () => {
  expect(() => {
    expandTree({
      foo: {
        _extends: 'bar*',
      },
    });
  }).toThrow(`Could not find template node "bar*"`);
});

test('should reject recursive template nodes', () => {
  expect(() => {
    expandTree({
      foo: {
        _extends: 'bar*',
      },
      'bar*': {
        _extends: 'bar*',
      },
    });
  }).toThrow(`Circular reference in template node "bar*": bar* -> bar*`);
});

test('should reject nested template recursion', () => {
  expect(() => {
    expandTree({
      foo: {
        bar: {
          _extends: 'baz*',
        },
      },
      'baz*': {
        _extends: 'baz*',
      },
    });
  }).toThrow(`Circular reference in template node "baz*": baz* -> baz*`);
});

test('should reject cross-recursion in templates', () => {
  expect(() => {
    expandTree({
      foo: {
        _extends: 'bar*',
      },
      'bar*': {
        _extends: 'baz*',
      },
      'baz*': {
        _extends: 'bar*',
      },
    });
  }).toThrow(
    `Circular reference in template node "bar*": bar* -> baz* -> bar*`,
  );
});

test('should reject deep cross-recursion in templates', () => {
  expect(() => {
    expandTree({
      foo: {
        _extends: 'bar*',
      },
      'bar*': {
        _extends: 'baz*',
      },
      'baz*': {
        _extends: 'qux*',
      },
      'qux*': {
        _extends: 'bar*',
      },
    });
  }).toThrow(
    `Circular reference in template node "bar*": bar* -> baz* -> qux* -> bar*`,
  );
});

test('should reject nested cross-recursion in templates', () => {
  expect(() => {
    expandTree({
      foo: {
        _extends: 'bar*',
      },
      'bar*': {
        baz: {
          _extends: 'qux*',
        },
      },
      'qux*': {
        _extends: 'bar*',
      },
    });
  }).toThrow(`Circular reference in template node "baz": bar* -> qux* -> bar*`);
});

test('should reject nested deep cross-recursion in templates', () => {
  expect(() => {
    expandTree({
      foo: {
        _extends: 'bar*',
      },
      'bar*': {
        baz: {
          _extends: 'qux*',
        },
      },
      'qux*': {
        quux: {
          _extends: 'bar*',
        },
      },
    });
  }).toThrow(
    `Circular reference in template node "quux": bar* -> qux* -> bar*`,
  );
});
