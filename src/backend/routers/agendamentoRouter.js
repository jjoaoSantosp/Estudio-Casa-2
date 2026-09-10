import 'dotenv/config'
import express from 'express'
import { prisma } from '../db.js'
import { aplicarFusoHorario, obterDataHoraLocalISO } from '../../frontend/scripts/fusoHorarioController.js'

const app = express()
app.use(express.json())
const router = express.Router()

router.post('/agendamento', async(req, res) => {
    try{
        const bandaAgendamento = req.body

        //Para identificar espaços vazios.
        if(!bandaAgendamento.nomeBanda||!bandaAgendamento.horaInicio||!bandaAgendamento.horaFim){
            return res.status(400).json({
                error: "Preencha todos os campos obrigatórios."
            })
        }

        // VALIDAÇÃO DO TIPO
        // Por meio do 'typeof' para verificar se o tipo de dado inserido é o esperado.
        if (typeof bandaAgendamento.nomeBanda !== 'string') {
            return res.status(400).json({
                error: "Nome da banda deve ser texto."
            })
        }

        //FORMATAÇÃO DE DATE
        const dateStart = bandaAgendamento.horaInicio instanceof Date 
            ? bandaAgendamento.horaInicio 
            : new Date(aplicarFusoHorario(bandaAgendamento.horaInicio))

        const dateEnd = bandaAgendamento.horaFim instanceof Date 
            ? bandaAgendamento.horaFim 
            : new Date(aplicarFusoHorario(bandaAgendamento.horaFim))   

        //VALIDAÇÃO DE FORMATO DE DATA VÁLIDA
        if(isNaN(dateStart.getTime()) || isNaN(dateEnd.getTime())){
            return res.status(400).json({
                error: "Formato de Data Inválida."
            })
        }

        if(dateStart >= dateEnd){
            return res.status(400).json({
                error: "A hora de início deve ser anterior à hora de término."
            })
        }
        

        //VERIFICAÇÃO DE HORÁRIOS EM CONFLITO NO BANCO
        const dateConflited = await prisma.agendamento.findFirst({
            where: {
            AND: [
                { horaInicio: { lt: dateEnd } },
                { horaFim: { gt: dateStart } }
            ]}
        })

        if(dateConflited){
           return res.status(409).json({
                error:"Já existe um ensaio marcado nesse horário."
           })

        }

        //CRIAÇÃO DO AGENDAMENTO NO BANCO DE DADOS
        const agendamentoDB = await prisma.agendamento.create({
            data: {
                nomeBanda: bandaAgendamento.nomeBanda,
                horaInicio: dateStart,
                horaFim: dateEnd,
                createdAt: new Date(aplicarFusoHorario(obterDataHoraLocalISO()))
               
            }
        })
        return res.status(201).json("Agendamento concluído com sucesso!")
    
        
    
    }catch(error){

        console.error(error)
        return res.status(500).json({
            error: "Erro interno do servidor. Tente novamente mais tarde."
        })
    }
})

router.get('/agendamento', async(req, res)=>{
    try {
        const agendamentos = await prisma.agendamento.findMany({
            orderBy: {
                horaInicio: 'asc'
            }
        })

        return res.status(200).json(agendamentos)
    
    } catch (error) {
        return res.status(500).json({
            error: "Ocorreu um erro inesperado ao buscar os Agendamentos."
        })
    }
})

export default router