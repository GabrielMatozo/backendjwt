const mongoose = require("mongoose")

const MONGOURI = process.env.MONGODB_URL

const InicializaMongoServer = async () => {
  try {
    await mongoose.connect(MONGOURI)
    console.log("Conectado ao MongoDB")
  } catch (e) {
    console.log(e)
    throw e
  }
}

module.exports = InicializaMongoServer

