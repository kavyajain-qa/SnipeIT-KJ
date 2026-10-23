/** Escapes text so it can be used literally inside a RegExp. */
export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Matches the whole (trimmed) text exactly, e.g. a cell or option that is exactly "Ready to Deploy". */
export function exactText(text: string, flags = ''): RegExp {
  return new RegExp(`^\\s*${escapeRegExp(text)}\\s*$`, flags);
}
