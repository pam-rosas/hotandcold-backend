// backend/middlewares/verifyToken.js
const admin = require("../config/firebaseAdmin");


async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No autorizado" });

  const token = authHeader.split(" ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token inválido" });
  }
}

module.exports = verifyToken;
