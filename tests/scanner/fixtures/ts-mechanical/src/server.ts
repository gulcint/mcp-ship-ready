export function handleMissingResource(): { code: number; message: string } {
  // Deprecated resource-not-found code (2026-07-28 spec renumbers this to -32602).
  return { code: -32002, message: "resource not found" };
}
