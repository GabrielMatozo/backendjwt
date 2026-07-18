const fs = require("fs")
const path = require("path")
const mongoose = require("mongoose")
const request = require("supertest")
const { criarApp } = require("./helpers/app")
const usuarioRoutes = require("../routes/usuario")

const app = criarApp()
app.use("/usuario", usuarioRoutes)

const MONGO_URI = fs.readFileSync(path.join(__dirname, "..", ".mongo-uri"), "utf-8")

beforeAll(async () => {
  await mongoose.connect(MONGO_URI)
})

afterAll(async () => {
  await mongoose.disconnect()
})

afterEach(async () => {
  const collections = mongoose.connection.collections
  for (const key in collections) {
    await collections[key].deleteMany()
  }
})

describe("Usuário Routes", () => {
  test("POST /usuario/novo — cria usuário e retorna tokens", async () => {
    const res = await request(app)
      .post("/usuario/novo")
      .send({ nome: "Teste", email: "teste@teste.com", senha: "123456", tipo: "cliente" })
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty("accessToken")
    expect(res.body).toHaveProperty("refreshToken")
  })

  test("POST /usuario/novo — rejeita e-mail duplicado", async () => {
    await request(app)
      .post("/usuario/novo")
      .send({ nome: "Teste", email: "dup@teste.com", senha: "123456", tipo: "cliente" })
    const res = await request(app)
      .post("/usuario/novo")
      .send({ nome: "Teste2", email: "dup@teste.com", senha: "123456", tipo: "cliente" })
    expect(res.status).toBe(400)
    expect(res.body.mensagem).toMatch(/já cadastrado/)
  })

  test("POST /usuario/login — retorna tokens com credenciais válidas", async () => {
    await request(app)
      .post("/usuario/novo")
      .send({ nome: "Login", email: "login@teste.com", senha: "123456", tipo: "cliente" })
    const res = await request(app)
      .post("/usuario/login")
      .send({ email: "login@teste.com", senha: "123456" })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty("accessToken")
    expect(res.body).toHaveProperty("refreshToken")
  })

  test("POST /usuario/login — rejeita senha incorreta", async () => {
    await request(app)
      .post("/usuario/novo")
      .send({ nome: "Fail", email: "fail@teste.com", senha: "123456", tipo: "cliente" })
    const res = await request(app)
      .post("/usuario/login")
      .send({ email: "fail@teste.com", senha: "wrong" })
    expect(res.status).toBe(400)
  })

  test("POST /usuario/refresh-token — renova access token", async () => {
    const created = await request(app)
      .post("/usuario/novo")
      .send({ nome: "Refresh", email: "refresh@teste.com", senha: "123456", tipo: "cliente" })
    const res = await request(app)
      .post("/usuario/refresh-token")
      .send({ refreshToken: created.body.refreshToken })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty("accessToken")
  })

  test("POST /usuario/refresh-token — rejeita token inválido", async () => {
    const res = await request(app)
      .post("/usuario/refresh-token")
      .send({ refreshToken: "invalid" })
    expect(res.status).toBe(403)
  })

  test("GET /usuario/eu — retorna dados do usuário autenticado", async () => {
    const created = await request(app)
      .post("/usuario/novo")
      .send({ nome: "Me", email: "me@teste.com", senha: "123456", tipo: "cliente" })
    const res = await request(app)
      .get("/usuario/eu")
      .set("x-access-token", created.body.accessToken)
    expect(res.status).toBe(200)
    expect(res.body.nome).toBe("Me")
  })

  test("GET /usuario/eu — rejeita sem token", async () => {
    const res = await request(app).get("/usuario/eu")
    expect(res.status).toBe(401)
  })

  test("POST /usuario/logout — invalida refresh tokens", async () => {
    const created = await request(app)
      .post("/usuario/novo")
      .send({ nome: "Logout", email: "logout@teste.com", senha: "123456", tipo: "cliente" })
    const res = await request(app)
      .post("/usuario/logout")
      .set("x-access-token", created.body.accessToken)
    expect(res.status).toBe(200)
    expect(res.body.mensagem).toMatch(/Sessão encerrada/)
  })
})
