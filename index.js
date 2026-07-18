require('dotenv').config()
const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const InicializaMongoServer = require("./config/db")

const usuario = require("./routes/usuario")
const produto = require("./routes/Produto")

const app = express()
const PORT = process.env.PORT || 4000

app.use(helmet())
app.use(cors())
app.use(express.json())

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { mensagem: "Muitas requisições. Tente novamente em 15 minutos." }
})
app.use(limiter)

app.get("/", (req, res) => {
  res.json({ mensagem: "API funcional!", versao: "2.0.0" })
})

app.use("/usuario", usuario)
app.use("/produto", produto)

InicializaMongoServer()
  .then(() => app.listen(PORT, () => console.log(`Servidor iniciado na porta ${PORT}`)))
  .catch(e => {
    console.error("Falha ao conectar no MongoDB:", e.message)
    process.exit(1)
  })


