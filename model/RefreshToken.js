const mongoose = require("mongoose")

const RefreshTokenSchema = mongoose.Schema({
  token: { type: String, required: true, index: true },
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "usuario", required: true },
  expiresEm: { type: Date, required: true }
}, {
  timestamps: true
})

module.exports = mongoose.model("RefreshToken", RefreshTokenSchema)
