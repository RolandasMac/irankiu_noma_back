// middleware/checkRole.js
export function checkRole(allowedRoles = []) {
  return (req, res, next) => {
    console.log("checkRole");
    try {
      const rolesHeader = req.headers["x-user-roles"];
      if (!rolesHeader) {
        // console.log("roles", rolesHeader);
        return res
          .status(403)
          .json({ success: false, message: "Jūs neturite reikiamų teisių" });
      }

      const userRoles = JSON.parse(rolesHeader);

      // Ar bent viena rolė sutampa
      const hasRole = allowedRoles.some((role) => userRoles.includes(role));
      if (!hasRole) {
        // console.log("Nesutampa roles");
        return res.status(403).json({
          success: false,
          message: "Jūs neturite teisės atlikti šitą veiksmą",
        });
      }

      next();
    } catch (err) {
      return res.status(403).json({
        success: false,
        message: "Jūs neturite teisės atlikti šitą veiksmą",
      });
    }
  };
}
// module.exports = checkRole;
