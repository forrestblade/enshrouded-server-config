/**
 * shared/config/keys — localStorage keys shared across the editor + social flows.
 *
 * The editor autosaves the working config under DRAFT_KEY. "Fork" loads a shared
 * config into that draft and stamps FORKED_FROM_KEY with the source slug so the
 * next publish records lineage (server_config.forkedFromId).
 */
export const DRAFT_KEY = 'esc:draft:v1'
export const FORKED_FROM_KEY = 'esc:forkedFrom:v1'
