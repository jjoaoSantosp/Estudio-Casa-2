import app from './src/backend/app.js'

app.listen(3000, '127.0.0.1',() => {
    console.log("Servidor rodando! <3")
    console.log("Servidor rodando em http://127.0.0.1:3000")
})