import 'dotenv/config'
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import agendamentoRouter from './routers/agendamentoRouter.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()

app.use(express.json())
app.use(express.static(path.join(__dirname, '../frontend')))
app.use(agendamentoRouter)

app.get('/', (req, res) => res.redirect('/view/homeScreen.html'))

export default app