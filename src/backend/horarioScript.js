import 'dotenv/config'
import express from 'express'

const app = express()
app.use(express.json())

// Função auxiliar simples para pegar o horário local formatado em ISO
function obterDataHoraLocalISO() {
    const agora = new Date()
    // Ajusta o deslocamento de minutos do fuso local para obter a hora exata da sua máquina
    const dataLocal = new Date(agora.getTime() - (agora.getTimezoneOffset() * 60000))
    return dataLocal.toISOString().slice(0, 19) // Retorna ex: "2026-08-20T13:20:25"
}

function aplicarFusoHorario(dateString) {
    if (typeof dateString !== 'string') {
        return dateString
    }

    const temFuso =
        dateString.includes('Z') ||
        /[+-]\d{2}:\d{2}$/.test(dateString)

    return temFuso ? dateString : `${dateString}-03:00`
}

export { aplicarFusoHorario, obterDataHoraLocalISO }