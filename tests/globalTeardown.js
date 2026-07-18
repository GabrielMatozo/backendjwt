const fs = require("fs")
const path = require("path")

module.exports = async () => {
  try {
    fs.unlinkSync(path.join(__dirname, "..", ".mongo-uri"))
  } catch {
    // ignore
  }
}
