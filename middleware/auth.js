const jwt = require("jsonwebtoken")
const { JWT_SECRET } = require("../config/jwt")

module.exports = function(req, res, next) {
  const token = req.header("token") || req.headers["x-access-token"]
  if (!token) return res.status(401).json({ mensagem: "Token é obrigatório" })

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.usuario = decoded.usuario
    next()
  } catch (e) {
    res.status(403).json({ mensagem: `Token inválido: ${e.message}` })
  }
}
