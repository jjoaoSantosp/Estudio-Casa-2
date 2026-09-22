import 'dotenv/config'
import express from 'express'
import { prisma } from '../db.js'
import { aplicarFusoHorario, obterDataHoraLocalISO } from '../../frontend/scripts/horarioScript.js'

const app = express()
app.use(express.json())
const router = express.Router()

router.post('/agendamento', async(req, res) => {
    try{
        const bandaAgendamento = req.body

        //Para identificar espaços vazios.
        if(!bandaAgendamento.nomeBanda||!bandaAgendamento.horaInicio
            ||!bandaAgendamento.horaFim||!bandaAgendamento.valor){

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

        //EVITAR CONFLITO DE AGENDAMENTO DENTRO DO PRÓPRIO ENSAIO
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

        // CONVERTE O VALOR RECEBIDO PARA NÚMERO
        const valor = Number(bandaAgendamento.valor)
        
        //CONFERE VALOR INSERIO É UM NÚMERO
        if(isNaN(valor)){
            return res.status(400).json({
                error: "O valor informado deve ser um dado numérico válido."
            })
        }

        //REGRA DE NEGÓCIO: AGENDAMENTO NÃO PODE TER VALOR INFERIOR A R$80
        if(valor < 80){
            return res.status(400).json({
                error: "O valor mínimo permitido para a contratação do ensaio é de R$ 80,00."
            })
        }

        //TRANSFORMAR O VALOR EM CENTAVOS
        const valorCentavos = (valor*100)

        //CRIAÇÃO DO AGENDAMENTO NO BANCO DE DADOS
        const agendamentoDB = await prisma.agendamento.create({
            data: {
                nomeBanda: bandaAgendamento.nomeBanda,
                horaInicio: dateStart,
                horaFim: dateEnd,
                valor: valorCentavos,
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

router.get('/agendamento/:id', async (req, res) => {
    try {
        
        const {id} = req.params

        const agendamento = await prisma.agendamento.findUnique({
            where: {
                id: id
            }
        })

        if(!agendamento){
            return res.status(404).json({
                error: "Agendamento não Encontrado."
            })
        }

        return res.status(200).json(agendamento)
    } catch (error) {
        console.error(error)

        return res.status(500).json({
            error: "Erro ao buscar os detalhes do agendamento."
        })
    }
})

router.patch('/agendamento/:id', async (req, res) => {
    try {
        const {id} = req.params

        const {
            nomeBanda,
            horaInicio,
            horaFim,
            valor
        } = req.body

        const agendamentoExist = 
            await prisma.agendamento.findUnique({
                where: {
                    id: id
                }
            })

            if(!agendamentoExist){
                return res.status(404).json({
                    error: "Agendamento não encontrado."
                })
            }

            //VALIDAÇÕES
            if(!nomeBanda||!horaInicio
            ||!horaFim||valor===undefined){
                return res.status(400).json({
                    error: "Preencha todos os campos obrigatórios."
                })
            }

            if(typeof nomeBanda !== 'string'){
                return res.status(400).json({
                    error:"Nome da banda deve ser texto."
                })
            }
            const dateStart =new Date(aplicarFusoHorario(horaInicio))
            const dateEnd= new Date(aplicarFusoHorario(horaFim))

            if(isNaN(dateStart.getTime())||isNaN(dateEnd.getTime())){
                return res.status(400).json({
                    error: "Formato de Data Inválida."
                })
            }

            if(dateStart >= dateEnd){
                return res.status(400).json({
                    error: "A hora de início deve ser anterior a hora do término."
                })
            }

            //VERIFICAR CONFLITO IGNORANDO O PRÓPRIO AGENDAMENTO
            const dateConflited = await prisma.agendamento.findFirst({
                where:{
                    AND: [
                        { id: {not: id}},
                        { horaInicio: {lt: dateEnd}},
                        { horaFim: {gt: dateStart}}
                    ]
                }
            })

            if(dateConflited){
                return res.status(409).json({
                    error: 'Já existe um ensaio marcado nesse horário.'
                })
            }

            if(isNaN(Number(valor))){
                return res.status(400).json({
                    error: "O valor Informado deve ser numérico."
                })
            }

            if(Number(valor)<80){
                return res.status(400).json({
                    error: "O valor mínimo aceito é R$ 80,00."
                })
            }

            const valorCentavos = Number(valor)*100

            const agendamentoUpdated = await prisma.agendamento.update({
                where:{
                    id: id
                },
                
                data:{
                    nomeBanda: nomeBanda,
                    horaInicio: dateStart,
                    horaFim: dateEnd,
                    valor: valorCentavos
                }
            })

            return res.status(200).json({
                agendamentoUpdated
            })

    } catch (error) {

        console.error('Erro ao atualizar agendamento:', error)

        return res.status(500).json({
            error: "Erro interno do servidor ao atualizar o agendamento."
        })

    }
})

router.delete('/agendamento/:id', async (req, res) => {
    try {
        const {id} = req.params

        const agendamentoDelete = await prisma.agendamento.delete({
            where:{
                id: id
            }
        })

        if(!agendamentoDelete){
            return res.status(404).json({
                message: "Agendamento deletado com sucesso.",
                agendamento: agendamentoDelete
            })
        }

        return res.status(200).json(agendamentoDelete)
    } catch (error) {

        console.error('Erro ao deletar agendamento:', error)

        if (error.code === 'P2025') {
            return res.status(404).json({
                error: "Agendamento não encontrado."
        })

        }

        return res.status(500).json({
            error: "Erro interno do servidor ao deletar o agendamento."
        })
    }
})

router.delete('/agendamento', async (req, res) => {
    try {
        const agendamentosDeleteAll = await prisma.agendamento.deleteMany()

        return res.status(200).json({
            message: "Todos os Agendamentos Foram Deletados com Sucesso. ",
            quantidade: agendamentosDeleteAll.count
        })
    } catch (error) {
        console.error("Erro ao deletar os agendamentos", error)

        return res.status(500).json({
            error: "Erro Interno do Servidor ao Deletar os Agendamentos."
        })
    }
})
export default router