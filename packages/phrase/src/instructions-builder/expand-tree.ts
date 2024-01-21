import {Selector, SelectorTree} from '../interfaces/selector-tree.interface';

export function expandTree(tree: SelectorTree): SelectorTree {
  const templateNodes = Object.fromEntries(
      Object.entries(tree)
          .filter(([key]) => isTemplateNodeKey(key))
  );

  Object.keys(templateNodes).forEach((key) => {
    const node = templateNodes[key];

    if (typeof node === 'object') {
      templateNodes[key] = expandNode(node, templateNodes, [key]);
    }
  });

  return expandTreeWithTemplates(tree, templateNodes);
}

function expandTreeWithTemplates(tree: SelectorTree, templateNodes: SelectorTree): SelectorTree {
  const expandedTree: SelectorTree = {};

  Object.keys(tree).forEach((key) => {
    if (!isTemplateNodeKey(key)) {
      expandedTree[key] = expandNode(tree[key]!, templateNodes);
    }
  });

  return expandedTree;
}

function expandNode(node: Selector | SelectorTree,
                    templateNodes: SelectorTree,
                    expandedKeys: string[] = []): SelectorTree | Selector {
  if (typeof node === 'string' || typeof node === 'function') {
    return node;
  }

  let expandedNode: SelectorTree | Selector = {...node};

  if (node._extends) {
    if (expandedKeys.includes(node._extends)) {
      const path = [...expandedKeys, node._extends];
      throw new Error(`Circular reference in template node "${node._extends}": ${path.join(' -> ')}`);
    }

    expandedKeys.push(node._extends);

    const template = templateNodes[node._extends];

    if (!template) {
      throw new Error(`Could not find template node "${node._extends}"`);
    }

    if (typeof template === 'object') {
      expandedNode = {...template, ...node};
      if (template._extends) {
        expandedNode._extends = template._extends;
        expandedNode = expandNode(expandedNode, templateNodes, expandedKeys);
      }
    } else {
      expandedNode = {_selector: template, ...node};
    }
  }

  Object.keys(expandedNode).forEach((key) => {
    if (isTemplateNodeKey(key)) {
      throw new Error(`Template node "${key}" cannot be nested`);
    }

    expandedNode[key] = expandNode(expandedNode[key]!, templateNodes, expandedKeys);
  });

  return expandedNode;
}

function isTemplateNodeKey(key: string): boolean {
  return key.endsWith('*');
}