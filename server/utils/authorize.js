// Requires `middleware` to have run first (needs req.user).

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).send({ message: "Acesso negado." });
    }
    next();
  };
}

// Reject-style guard for single-resource endpoints. `resolveHospitalId` may be
// async since some routes key off a row id (template id, login id) and need a
// lookup before the owning hospital_id is known.
function requireOwnHospital(resolveHospitalId) {
  return async (req, res, next) => {
    try {
      if (req.user.role === "admin") return next();

      const hospitalId = await resolveHospitalId(req);
      if (!hospitalId || String(hospitalId) !== String(req.user.hospital_id)) {
        return res.status(403).send({ message: "Acesso negado." });
      }
      next();
    } catch (e) {
      console.log(e);
      res.status(500).send({ message: "Some error on server.", error: e });
    }
  };
}

// Scope-style guard for list/aggregate endpoints where the hospital filter is
// optional. For non-admin, force-overwrites the query param instead of
// rejecting - omitting it must never mean "everything".
function scopeToOwnHospital(paramName) {
  return (req, res, next) => {
    if (req.user.role !== "admin") {
      req.query[paramName] = req.user.hospital_id;
    }
    next();
  };
}

module.exports = { requireRole, requireOwnHospital, scopeToOwnHospital };
