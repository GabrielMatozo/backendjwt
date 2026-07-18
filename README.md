# Backend JWT

API REST com Express, MongoDB, autenticação JWT, refresh token, CRUD de usuários e produtos.

## Stack

- Node.js 18+
- Express 4
- MongoDB + Mongoose 8
- JWT (jsonwebtoken)
- express-validator, helmet, rate-limit
- Docker + docker-compose

## Como Rodar

```bash
# Instalar dependências
npm i

# Renomear .env-exemplo para .env e configurar
cp .env-exemplo .env

# Desenvolvimento (com hot-reload)
npm run dev

# Produção
npm start
```

## Docker

```bash
docker compose up --build
```

## Testes

```bash
npm test
```

## Rotas

### Usuário
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/usuario/novo` | Não | Cadastro (retorna access + refresh token) |
| POST | `/usuario/login` | Não | Login (retorna access + refresh token) |
| POST | `/usuario/refresh-token` | Não | Renova access token |
| POST | `/usuario/logout` | Sim | Invalida refresh tokens |
| GET | `/usuario/eu` | Sim | Dados do usuário logado |

### Produto
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/produto` | Sim | Listar produtos |
| GET | `/produto/:id` | Sim | Buscar produto |
| POST | `/produto` | Sim | Criar produto |
| PUT | `/produto/:id` | Sim | Atualizar produto |
| DELETE | `/produto/:id` | Sim | Remover produto |

## Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `MONGODB_URL` | String de conexão do MongoDB |
| `PORT` | Porta do servidor (default 4000) |
| `SECRET_KEY` | Chave para assinar JWT |
| `REFRESH_SECRET_KEY` | Chave para assinar refresh token |
