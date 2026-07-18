const JWT_SECRET = process.env.SECRET_KEY || "dev-secret-key"
const JWT_REFRESH_SECRET = process.env.REFRESH_SECRET_KEY || JWT_SECRET

module.exports = { JWT_SECRET, JWT_REFRESH_SECRET }
