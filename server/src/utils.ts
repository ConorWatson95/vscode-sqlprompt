/**
 * Generates a short alias from a table name.
 *
 * Examples:
 *   ORDINI_DETTAGLIO → "od"
 *   ClientiAttivi    → "ca"
 *   ARTICOLI         → "a"
 *   Orders           → "o"
 */
export interface GenerateAliasOptions {
  ignoredPrefixes?: string[];
}

export function generateAlias(
  tableName: string,
  existingAliases?: Set<string>,
  options: GenerateAliasOptions = {},
): string {
  const aliasSource = stripIgnoredAliasPrefix(tableName, options.ignoredPrefixes ?? []);
  const words = splitAliasWords(aliasSource);
  let alias = words.length > 1
    ? words.map((part) => part.charAt(0).toLowerCase()).join('')
    : aliasSource.charAt(0).toLowerCase();

  // If existingAliases is provided and this alias is taken, append a counter
  if (existingAliases) {
    let counter = 2;
    const baseAlias = alias;
    while (existingAliases.has(alias)) {
      alias = baseAlias + counter;
      counter++;
    }
  }

  return alias;
}

function stripIgnoredAliasPrefix(tableName: string, ignoredPrefixes: string[]): string {
  let result = tableName;

  for (const prefix of ignoredPrefixes) {
    if (!prefix) continue;
    if (result.toLowerCase().startsWith(prefix.toLowerCase())) {
      result = result.slice(prefix.length);
    }
  }

  return result || tableName;
}

function splitAliasWords(tableName: string): string[] {
  return tableName
    .split(/[_\s.-]+/)
    .flatMap((part) =>
      part.match(/[A-Z]+(?=[A-Z][a-z]|$)|[A-Z]?[a-z]+|\d+/g) ?? [part],
    )
    .filter((part) => part.length > 0);
}

/**
 * Strips bracket or double-quote delimiters from an identifier.
 *
 * `[My Table]` → `"My Table"`
 * `"dbo"` → `"dbo"`
 */
export function stripIdentifierDelimiters(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed.slice(1, -1);
  }
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}
