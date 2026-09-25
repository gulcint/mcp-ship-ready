export function notTheDeprecatedCode(): number[] {
  // None of these contain the deprecated error code as an isolated token.
  const a = -320021;
  const b = 1-32002;
  const c = -32002.5;
  return [a, b, c];
}

export function theDeprecatedCode(): { code: number } {
  return { code: -32002 };
}
