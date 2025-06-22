import { parse } from 'mathjs';

/**
 * Parses a formula string to extract unique single-letter variables (a-z).
 * @param formula The mathematical formula string.
 * @returns An array of unique variable names.
 */
export function extractVariables(formula: string): string[] {
  try {
    const node = parse(formula);
    const variables = new Set<string>();

    node.traverse((node: any) => {
      // Check for SymbolNode and if its name is a single lowercase letter
      if (node.isSymbolNode && /^[a-z]$/.test(node.name)) {
        variables.add(node.name);
      }
    });

    return Array.from(variables).sort();
  } catch (error) {
    return [];
  }
} 