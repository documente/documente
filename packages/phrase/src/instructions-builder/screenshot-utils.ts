import { Token } from '../interfaces/token.interface';
import { unquoted } from '../quoted-text';
import { removeParentheses } from '../parenthesized';

export function findScreenshotName(token: Token | null): string | null {
  if (!token) {
    return null;
  }

  let value = removeParentheses(token.value);

  if (value.startsWith('screenshot')) {
    value = value.substring('screenshot'.length).trim();
    value = unquoted(value).trim();

    if (!isValidScreenshotName(value)) {
      throw new Error(
        `Invalid screenshot name: ${value}. Screenshot name should be a valid file name with optional '.png' extension.`,
      );
    }

    return value;
  }

  return null;
}

function isValidScreenshotName(name: string): boolean {
  if (name.includes('.')) {
    return name.endsWith('.png') && name.length > 4;
  } else {
    return name.length > 0;
  }
}
