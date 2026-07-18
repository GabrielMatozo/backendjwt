// cSpell:ignore Usuario
const express = require("express")
const { check, validationResult } = require("express-validator")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const router = express.Router()
const auth = require("../middleware/auth")
const Usuario = require("../model/Usuario")
const RefreshToken = require("../model/RefreshToken")
const { JWT_SECRET, JWT_REFRESH_SECRET } = require("../config/jwt")

const ACCESS_TOKEN_EXPIRY = "1h" // 1 hora
const REFRESH_TOKEN_EXPIRY_DAYS = 30 // 30 dias

function gerarAccessToken(usuarioId) {
  return jwt.sign(
    { usuario: { id: usuarioId } },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  )
}

async function gerarRefreshToken(usuarioId) {
  const refresh = jwt.sign(
    { usuario: { id: usuarioId } },
    JWT_REFRESH_SECRET,
    { expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d` }
  )
  const expiresEm = new Date()
  expiresEm.setDate(expiresEm.getDate() + REFRESH_TOKEN_EXPIRY_DAYS)
  await new RefreshToken({ token: refresh, usuarioId, expiresEm }).save()
  return refresh
}

router.post(
  "/novo",
  [
    check("nome", "Informe o nome do usuário").not().isEmpty(),
    check("email", "Informe um e-mail válido").isEmail(),
    check("senha", "Senha deve ter no mínimo 6 caracteres").isLength({ min: 6 }),
    check("tipo", "Tipo inválido").isIn(["administrador", "cliente", "profissional"])
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { nome, email, senha, tipo } = req.body
    try {
      let usuario = await Usuario.findOne({ email })
      if (usuario) {
        return res.status(400).json({ mensagem: "E-mail já cadastrado" })
      }

      usuario = new Usuario({ nome, email, senha, tipo })
      const salt = await bcrypt.genSalt(10)
      usuario.senha = await bcrypt.hash(senha, salt)
      const initials = nome.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2)
      usuario.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random`
      await usuario.save()

      const accessToken = gerarAccessToken(usuario.id)
      const refreshToken = await gerarRefreshToken(usuario.id)
      res.status(201).json({ accessToken, refreshToken })
    } catch (err) {
      res.status(500).json({ mensagem: `Erro ao salvar usuário: ${err.message}` })
    }
  }
)

router.post(
  "/login",
  [
    check("email", "Informe um e-mail válido").isEmail(),
    check("senha", "Senha deve ter no mínimo 6 caracteres").isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { email, senha } = req.body
    try {
      const usuario = await Usuario.findOne({ email })
      if (!usuario) {
        return res.status(400).json({ mensagem: "Usuário não encontrado" })
      }

      const isMatch = await bcrypt.compare(senha, usuario.senha)
      if (!isMatch) {
        return res.status(400).json({ mensagem: "Senha incorreta" })
      }

      const accessToken = gerarAccessToken(usuario.id)
      const refreshToken = await gerarRefreshToken(usuario.id)
      res.json({ accessToken, refreshToken })
    } catch (e) {
      // console.error(e)
      res.status(500).json({ mensagem: `Erro no servidor: ${e.message}` })
    }
  }
)

router.post("/refresh-token", async (req, res) => {
  const { refreshToken } = req.body
  if (!refreshToken) {
    return res.status(401).json({ mensagem: "Refresh token é obrigatório" })
  }

  try {
    const stored = await RefreshToken.findOne({ token: refreshToken })
    if (!stored) {
      return res.status(403).json({ mensagem: "Refresh token inválido" })
    }
    if (stored.expiresEm < new Date()) {
      await RefreshToken.deleteOne({ _id: stored._id })
      return res.status(403).json({ mensagem: "Refresh token expirado" })
    }

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET)
    const accessToken = gerarAccessToken(decoded.usuario.id)
    res.json({ accessToken })
  } catch (e) {
    res.status(403).json({ mensagem: `Refresh token inválido: ${e.message}` })
  }
})

router.post("/logout", auth, async (req, res) => {
  await RefreshToken.deleteMany({ usuarioId: req.usuario.id })
  res.json({ mensagem: "Sessão encerrada com sucesso" })
})

router.get("/eu", auth, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id, { senha: 0, __v: 0 })
    res.json(usuario)
  } catch (e) {
    res.status(500).json({ mensagem: `Erro ao obter dados: ${e.message}` })
  }
})

module.exports = router
