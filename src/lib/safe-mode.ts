/**
 * Build-time switch for a stricter, App Review-safe presentation: neutral
 * wording in place of piracy-adjacent copy, and the player screen dropped
 * from the showcase. Off unless VITE_SAFE_MODE=true is set at build time.
 */
export const safeMode = import.meta.env.VITE_SAFE_MODE === 'true';
