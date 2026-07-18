const { MongoMemoryServer } = require("mongodb-memory-server")
const fs = require("fs")
const path = require("path")

module.exports = async () => {
  const mongoServer = await MongoMemoryServer.create()
  fs.writeFileSync(path.join(__dirname, "..", ".mongo-uri"), mongoServer.getUri())
}
