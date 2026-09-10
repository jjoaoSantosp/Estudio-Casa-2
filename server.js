import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { prisma } from './src/backend/db.js'
import userRouterAgendamento from './src/backend/routers/agendamentoRouter.js'

const app = express()

app.use(cors())
app.use(express.json())

app.use(userRouterAgendamento)

app.listen(3000, () => {
    console.log("Servidor rodando! <3")
    
})