export function isParenthesized(str: string): boolean {
  return str.startsWith('(') && str.endsWith(')');
}

export function removeParentheses(str: string): string {
  if (!isParenthesized(str)) {
    throw new Error(`"${str}" is not parenthesized.`);
  }

  return str.slice(1, -1);
}
