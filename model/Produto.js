const mongoose= require('mongoose')

const ProdutoSchema = mongoose.Schema({
nome: {
    type: String, required: true
},
descricao:{
    type: String, required: false
},
codigodebarra:{
    type: String, unique:true, required: true
},
preco:{
    type: Number, required: true
},
 {
    timestamps: true
    }
})

module.exports = mongoose.model('Produtos', ProdutoSchema)