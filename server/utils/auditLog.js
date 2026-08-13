// Fire-and-forget audit log writer. A broken insert must never block the
// action being logged (login, submission creation, ...), so this never throws.
async function logEvent(query, { user, action, entityType, entityId, details }) {
  try {
    await query("INSERT INTO logs SET ?", {
      user_id: user?.id ?? null,
      user_name: user?.nome ?? null,
      user_email: user?.email ?? null,
      role: user?.role ?? null,
      hospital_id: user?.hospital_id ?? null,
      action,
      entity_type: entityType ?? null,
      entity_id: entityId ?? null,
      details: details ? JSON.stringify(details) : null,
    });
  } catch (e) {
    console.log("Failed to write audit log:", e);
  }
}

module.exports = { logEvent };
