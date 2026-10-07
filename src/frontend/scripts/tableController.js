import { abrirModalEdicao } from "./formAtualizacao.js"

const backDropSideBar = document.getElementById('fundo-sidebar')
const sideBarDetails = document.getElementById('sidebar-detalhes')
const btnCloseSideBar = document.getElementById('btn-fechar-sidebar')
const btnEditAgendamento = document.getElementById('btn-open-modal-edition')
 
let idAgendamentoSelecionado = null

document.getElementById('corpo-tabela').addEventListener('click', async(event)=>{
    
    try {

        if(event.target.tagName !== 'BUTTON'){return}
        
        const idAgendamento = event.target.dataset.id
        
        console.log('Agendamento clicado: ',idAgendamento)
    

        const responseDetails = await fetch(`http://localhost:3000/agendamento/${idAgendamento}`)
    
        if(!responseDetails.ok){
            throw new Error("Erro ao mostrar os detalhes do Agendamento")
        }
    
        console.log(responseDetails)
        
        console.log(responseDetails.ok)
        
        console.log(responseDetails.status)
        
        const agendamentoDetails = await responseDetails.json()
        console.log(agendamentoDetails)
        idAgendamentoSelecionado = agendamentoDetails.id

        const ddBanda = document.getElementById('detalhe-banda')
        const ddHoraInicio = document.getElementById('detalhe-hora-inicio')
        const ddHoraFim = document.getElementById('detalhe-hora-fim')
        const ddID = document.getElementById('detalhe-id')
        const ddValorEnsaio = document.getElementById('detalhe-valor-ensaio')
        const ddCreatedAt = document.getElementById('detalhe-criado-em')
        
        const opcoes = {
            day: 'numeric',  
            month: 'numeric',   
            year: 'numeric',
            weekday: 'long',
            hour: '2-digit',
            minute: '2-digit'  
        }

        const opcoesValue = {
            style: 'currency',
            currency:'BRL'
        }
    
        ddBanda.textContent = agendamentoDetails.nomeBanda
        
        const horaInicio = new Date(agendamentoDetails.horaInicio)
        ddHoraInicio.textContent = horaInicio.toLocaleDateString('pt-BR',opcoes)
        
        const horaFim = new Date(agendamentoDetails.horaFim)
        ddHoraFim.textContent = horaFim.toLocaleDateString('pt-BR',opcoes)
    
        ddID.textContent = agendamentoDetails.id
    
        const criadoEm = new Date(agendamentoDetails.createdAt)
        ddCreatedAt.textContent = "Agendamento Criado em: "+ 
        criadoEm.toLocaleDateString('pt-BR', opcoes)
        
        const valorReais = agendamentoDetails.valor/100
        ddValorEnsaio.textContent = valorReais.toLocaleString('pt-BR', opcoesValue)

        backDropSideBar.classList.remove('hidden')
        sideBarDetails.classList.remove('hidden')
    
        sideBarDetails.setAttribute('aria-hidden', 'false')  

    } catch (error) {
        
        console.error(
            'Erro ao carregar detalhes:',
            error
        )
        
    }
})

btnCloseSideBar.addEventListener('click', (event)=>{
    backDropSideBar.classList.add('hidden')
    sideBarDetails.classList.add('hidden')
    sideBarDetails.setAttribute('aria-hidden', 'true') 

})

btnEditAgendamento.addEventListener('click', ()=>{

    if(!idAgendamentoSelecionado){
        return
    }
    abrirModalEdicao(idAgendamentoSelecionado)
})

const countSelected = document.getElementById('contador-selecionados')
const btnDeleteSelected = document.getElementById('btn-excluir-selecionados')

const modalConfirmedDelete = document.getElementById('modal-confirmar-exclusao')
const btnCancelDelete = document.getElementById('btn-cancelar-exclusao')

const checkboxSelectedAll = document.getElementById('checkbox-selecionar-todos')

btnDeleteSelected.addEventListener('click', ()=>{
    modalConfirmedDelete.classList.remove('hidden')
})

btnCancelDelete.addEventListener('click', ()=>{
    modalConfirmedDelete.classList.add('hidden')
})

checkboxSelectedAll.addEventListener('click', ()=>{
    let idsSelecionados = document.querySelectorAll('.table-checkbox')

    idsSelecionados.forEach(checkbox => {
        checkbox.checked = checkboxSelectedAll.checked
    });
})
