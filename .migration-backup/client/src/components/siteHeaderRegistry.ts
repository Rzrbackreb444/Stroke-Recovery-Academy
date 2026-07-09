// Single source of truth for site-header mounts.
// RecoveryHeader and GlobalHeader both check this — first mount wins,
// all subsequent mounts (including legacy per-page header usage) render null.
export const siteHeaderRegistry = { mounted: false };
