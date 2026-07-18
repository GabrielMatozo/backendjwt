const express = require("express")
const { check, validationResult } = require("express-validator")
const router = express.Router()
const auth = require("../middleware/auth")
const Produto = require("../model/Produto")

router.get("/", auth, async (req, res) => {
  try {
    // Lista ordenada do mais recente pro mais antigo
    const produtos = await Produto.find().sort({ createdAt: -1 })
    res.json(produtos)
  } catch (e) {
    res.status(500).json({ mensagem: `Erro ao listar produtos: ${e.message}` })
  }
})

router.get("/:id", auth, async (req, res) => {
  try {
    const produto = await Produto.findById(req.params.id)
    if (!produto) return res.status(404).json({ mensagem: "Produto não encontrado" })
    res.json(produto)
  } catch (e) {
    res.status(500).json({ mensagem: `Erro ao buscar produto: ${e.message}` })
  }
})

router.post(
  "/",
  auth,
  [
    check("nome", "Nome é obrigatório").not().isEmpty(),
    check("codigodebarra", "Código de barras é obrigatório").not().isEmpty(),
    check("preco", "Preço deve ser um número").isNumeric()
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { nome, descricao, codigodebarra, preco } = req.body
    try {
      const existente = await Produto.findOne({ codigodebarra })
      if (existente) {
        return res.status(400).json({ mensagem: "Código de barras já cadastrado" })
      }

      const produto = new Produto({ nome, descricao, codigodebarra, preco })
      await produto.save()
      res.status(201).json(produto)
    } catch (e) {
      res.status(500).json({ mensagem: `Erro ao criar produto: ${e.message}` })
    }
  }
)

router.put(
  "/:id",
  auth,
  [
    check("nome", "Nome é obrigatório").optional().not().isEmpty(),
    check("codigodebarra", "Código de barras é obrigatório").optional().not().isEmpty(),
    check("preco", "Preço deve ser um número").optional().isNumeric()
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const allowed = {}
    const campos = ["nome", "descricao", "codigodebarra", "preco"]
    for (const campo of campos) {
      if (req.body[campo] !== undefined) allowed[campo] = req.body[campo]
    }

    try {
      const produto = await Produto.findByIdAndUpdate(req.params.id, allowed, { new: true, runValidators: true })
      if (!produto) return res.status(404).json({ mensagem: "Produto não encontrado" })
      res.json(produto)
    } catch (e) {
      res.status(500).json({ mensagem: `Erro ao atualizar produto: ${e.message}` })
    }
  }
)

router.delete("/:id", auth, async (req, res) => {
  try {
    const produto = await Produto.findByIdAndDelete(req.params.id)
    if (!produto) return res.status(404).json({ mensagem: "Produto não encontrado" })
    res.json({ mensagem: "Produto removido com sucesso" })
  } catch (e) {
    res.status(500).json({ mensagem: `Erro ao remover produto: ${e.message}` })
  }
})

module.exports = router
