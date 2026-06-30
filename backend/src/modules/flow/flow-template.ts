/** Resolve a dotted path like 'collected.env' against the vars object. */
function lookup(path: string, vars: Record<string, unknown>): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as object)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, vars);
}

/** Replace {{ path }} tokens; unknown tokens render as empty string. */
export function renderTemplate(tpl: string, vars: Record<string, unknown>): string {
  return tpl.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path: string) => {
    const value = lookup(path, vars);
    return value == null ? '' : String(value);
  });
}
