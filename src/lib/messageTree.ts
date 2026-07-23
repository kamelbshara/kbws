export type MessageTree = { [key: string]: string | MessageTree };

/** Flattens a nested message tree into dot-path -> string pairs, e.g. {"nav":{"home":"Home"}} -> {"nav.home":"Home"}. */
export function flattenMessages(tree: MessageTree, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      result[path] = value;
    } else {
      Object.assign(result, flattenMessages(value, path));
    }
  }
  return result;
}

/** Applies dot-path overrides onto a deep-cloned copy of a nested message tree. Unknown paths are ignored. */
export function applyOverrides(tree: MessageTree, overrides: Record<string, string>): MessageTree {
  const clone: MessageTree = JSON.parse(JSON.stringify(tree));
  for (const [path, value] of Object.entries(overrides)) {
    const parts = path.split(".");
    let node: MessageTree = clone;
    for (let i = 0; i < parts.length - 1; i++) {
      const next = node[parts[i]];
      if (typeof next !== "object" || next === null) break;
      node = next;
    }
    const lastKey = parts[parts.length - 1];
    if (typeof node[lastKey] === "string") {
      node[lastKey] = value;
    }
  }
  return clone;
}
