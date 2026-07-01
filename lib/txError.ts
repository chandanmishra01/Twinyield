// Shared classification for transaction errors so every tx surface can show a
// neutral "cancelled" notice when the user declines signing, instead of a raw
// (and often empty) wallet error string.

function collectText(e: unknown): { text: string; code: number | undefined; name: string } {
  const parts: string[] = [];
  let code: number | undefined;
  let name = "";
  const visit = (x: unknown, depth: number) => {
    if (!x || depth > 3) return;
    if (typeof x === "string") {
      parts.push(x);
      return;
    }
    if (typeof x === "object") {
      const o = x as Record<string, unknown>;
      if (typeof o.message === "string") parts.push(o.message);
      if (typeof o.name === "string") {
        parts.push(o.name);
        if (!name) name = o.name;
      }
      if (typeof o.code === "number" && code === undefined) code = o.code;
      // Wallet adapters nest the provider error under `.error` / `.cause`.
      visit(o.error, depth + 1);
      visit(o.cause, depth + 1);
    }
  };
  visit(e, 0);
  return { text: parts.join(" ").toLowerCase(), code, name };
}

export function isUserRejection(e: unknown): boolean {
  const { text, code, name } = collectText(e);
  if (code === 4001) return true;
  if (/reject|denied|declined|cancel/.test(text)) return true;
  // These are thrown when the user dismisses the wallet's signing prompt.
  // The underlying message is frequently empty, so match on the error name.
  if (name === "WalletSignTransactionError" || name === "WalletSendTransactionError") return true;
  return false;
}

// Returns `{ cancelled, message }`. When cancelled, `message` is a friendly
// notice; otherwise it's the (truncated) underlying error text, never empty.
export function classifyTxError(e: unknown, maxLen = 220): { cancelled: boolean; message: string } {
  if (isUserRejection(e)) return { cancelled: true, message: "Transaction cancelled." };
  const raw = e instanceof Error ? e.message : typeof e === "string" ? e : "";
  const message = raw && raw.trim() ? raw.trim().slice(0, maxLen) : "Transaction failed. Please try again.";
  return { cancelled: false, message };
}
