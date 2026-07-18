/**
 * audit.js — records every meaningful action to the audit_logs table.
 */
const db = require('./db');

const insert = db.prepare(`
  INSERT INTO audit_logs (user_id, user_name, user_role, action, entity_type, entity_id, details, ip)
  VALUES (@user_id, @user_name, @user_role, @action, @entity_type, @entity_id, @details, @ip)
`);

/**
 * log(req, action, opts)
 *   action      short verb string, e.g. 'user.create', 'order.status'
 *   opts.entityType / entityId / details  optional context
 * Falls back to an anonymous actor when no authenticated user is on the request.
 */
function log(req, action, { entityType = null, entityId = null, details = null } = {}) {
  const actor = req && req.user ? req.user : {};
  try {
    insert.run({
      user_id: actor.id || null,
      user_name: actor.name || 'anonymous',
      user_role: actor.role || 'guest',
      action,
      entity_type: entityType,
      entity_id: entityId != null ? String(entityId) : null,
      details: details ? (typeof details === 'string' ? details : JSON.stringify(details)) : null,
      ip: req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress || null) : null
    });
  } catch (err) {
    // Never let audit failures break the main request.
    console.error('[audit] failed to record', action, err.message);
  }
}

module.exports = { log };
