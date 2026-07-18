const fs = require("fs")
const path = require("path")
const mongoose = require("mongoose")
const request = require("supertest")
const { criarApp } = require("./helpers/app")
const usuarioRoutes = require("../routes/usuario")
const produtoRoutes = require("../routes/Produto")

const app = criarApp()
app.use("/usuario", usuarioRoutes)
app.use("/produto", produtoRoutes)

const MONGO_URI = fs.readFileSync(path.join(__dirname, "..", ".mongo-uri"), "utf-8")
let token

beforeAll(async () => {
  await mongoose.connect(MONGO_URI)
  const res = await request(app)
    .post("/usuario/novo")
    .send({ nome: "Admin", email: "admin@teste.com", senha: "123456", tipo: "administrador" })
  token = res.body.accessToken
})

afterAll(async () => {
  await mongoose.disconnect()
})

afterEach(async () => {
  const collections = mongoose.connection.collections
  for (const key in collections) {
    if (key !== "usuarios") {
      await collections[key].deleteMany()
    }
  }
})

describe("Produto Routes", () => {
  test("POST /produto — cria produto", async () => {
    const res = await request(app)
      .post("/produto")
      .set("x-access-token", token)
      .send({ nome: "Produto Teste", codigodebarra: "123456", preco: 99.9 })
    expect(res.status).toBe(201)
    expect(res.body.nome).toBe("Produto Teste")
  })

  test("POST /produto — rejeita código de barras duplicado", async () => {
    await request(app)
      .post("/produto")
      .set("x-access-token", token)
      .send({ nome: "P1", codigodebarra: "dup", preco: 10 })
    const res = await request(app)
      .post("/produto")
      .set("x-access-token", token)
      .send({ nome: "P2", codigodebarra: "dup", preco: 20 })
    expect(res.status).toBe(400)
  })

  test("GET /produto — lista produtos", async () => {
    await request(app)
      .post("/produto")
      .set("x-access-token", token)
      .send({ nome: "P1", codigodebarra: "001", preco: 10 })
    await request(app)
      .post("/produto")
      .set("x-access-token", token)
      .send({ nome: "P2", codigodebarra: "002", preco: 20 })
    const res = await request(app).get("/produto").set("x-access-token", token)
    expect(res.status).toBe(200)
    expect(res.body.length).toBe(2)
  })

  test("GET /produto/:id — busca produto por id", async () => {
    const created = await request(app)
      .post("/produto")
      .set("x-access-token", token)
      .send({ nome: "Busca", codigodebarra: "003", preco: 15 })
    const res = await request(app).get(`/produto/${created.body._id}`).set("x-access-token", token)
    expect(res.status).toBe(200)
    expect(res.body.nome).toBe("Busca")
  })

  test("PUT /produto/:id — atualiza produto", async () => {
    const created = await request(app)
      .post("/produto")
      .set("x-access-token", token)
      .send({ nome: "Antigo", codigodebarra: "004", preco: 10 })
    const res = await request(app)
      .put(`/produto/${created.body._id}`)
      .set("x-access-token", token)
      .send({ nome: "Novo Nome", preco: 25 })
    expect(res.status).toBe(200)
    expect(res.body.nome).toBe("Novo Nome")
  })

  test("DELETE /produto/:id — remove produto", async () => {
    const created = await request(app)
      .post("/produto")
      .set("x-access-token", token)
      .send({ nome: "Deletar", codigodebarra: "005", preco: 5 })
    const res = await request(app).delete(`/produto/${created.body._id}`).set("x-access-token", token)
    expect(res.status).toBe(200)
  })

  test("GET /produto — rejeita sem token", async () => {
    const res = await request(app).get("/produto")
    expect(res.status).toBe(401)
  })
})
