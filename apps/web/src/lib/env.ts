/**
 * Environment configuration for the SVG Spawn web app.
 * Reads from process.env with sensible defaults.
 */
export function getEnvConfig() {
  return {
    geminiApiKey: process.env.GEMINI_API_KEY ?? '',
    geminiModelId: process.env.GEMINI_MODEL_ID ?? 'gemini-2.5-pro',
    maxCreditsFree: parseInt(process.env.MAX_CREDITS_FREE ?? '50', 10),
  };
}
