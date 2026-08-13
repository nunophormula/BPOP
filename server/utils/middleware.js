const { verifyToken } = require("./token");

const middleware = async (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }

  try {
    const result = await verifyToken(token);
    if (!result.token_valid) {
      return res.status(401).send("Invalid Token");
    }
    req.user = result.token_decoded;
    return next();
  } catch (err) {
    return res.status(401).send("Invalid Token");
  }
};

module.exports = middleware;
