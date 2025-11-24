import { Langfuse } from "langfuse";

const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
const secretKey = process.env.LANGFUSE_SECRET_KEY;
const baseUrl = process.env.LANGFUSE_BASE_URL || process.env.LANGFUSE_HOST;

if (!publicKey || !secretKey) {
  console.warn("[Langfuse] Missing API keys. Observability will not work.");
} else {
  console.log("[Langfuse] Initializing client with host:", baseUrl);
}

export const langfuse = new Langfuse({
  publicKey,
  secretKey,
  baseUrl,
});
