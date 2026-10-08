import { abrirModalEdicao } from "./formAtualizacao.js"

const backDropSideBar = document.getElementById('fundo-sidebar')
const sideBarDetails = document.getElementById('sidebar-detalhes')
const btnCloseSideBar = document.getElementById('btn-fechar-sidebar')
const btnEditAgendamento = document.getElementById('btn-open-modal-edition')
 
let idAgendamentoSelecionado = null

//EVENTO DE EXIBIR OS DETALHES DO AGENDAMENTO
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

//FECHAR A SIDEBAR DE DETALHER 
btnCloseSideBar.addEventListener('click', (event)=>{
    backDropSideBar.classList.add('hidden')
    sideBarDetails.classList.add('hidden')
    sideBarDetails.setAttribute('aria-hidden', 'true') 

})

//BOTÃO [EDITAR] OS ATRIBUTOS DO AGENDAMENTO
btnEditAgendamento.addEventListener('click', ()=>{

    if(!idAgendamentoSelecionado){
        return
    }
    abrirModalEdicao(idAgendamentoSelecionado)
})

const countSelected = document.querySelector('.count-select')
const btnDeleteSelected = document.getElementById('btn-excluir-selecionados')

const modalConfirmedDelete = document.getElementById('modal-confirmar-exclusao')
const btnCancelDelete = document.getElementById('btn-cancelar-exclusao')

const checkboxSelectedAll = document.getElementById('checkbox-selecionar-todos')
let idsSelecionados = document.querySelectorAll('.table-checkbox')

//SELEÇÃO DE TODOS OS CHECKBOX
checkboxSelectedAll.addEventListener('click', ()=>{
    idsSelecionados = document.querySelectorAll('.table-checkbox')
    let count = 0
    idsSelecionados.forEach(checkbox => {
        if(checkboxSelectedAll.checked == true){
            checkbox.checked = checkboxSelectedAll.checked
            count++
        }else{
            checkbox.checked = checkboxSelectedAll.checked
            count=0
        }
    });
        
    countSelected.textContent = count
})

//SELEÇÃO INDIVIDUAL DE CHECKBOX
const corpoTabela = document.getElementById('corpo-tabela')
corpoTabela.addEventListener('click', (event) => {

    if (!event.target.classList.contains('table-checkbox')) {
        return
    }

    let count = 0

    const checkboxIndividual = document.querySelectorAll('.table-checkbox')

    checkboxIndividual.forEach(checkbox => {

        if (checkbox.checked == true) {
            count++
        }

    })

    countSelected.textContent = count

})

//EVENTO DE EXIBIR MODAL DE EXCLUSÃO
btnDeleteSelected.addEventListener('click', ()=>{
    modalConfirmedDelete.classList.remove('hidden')
})

//EVENTO DE CANCELAR EXCLUSÃO
btnCancelDelete.addEventListener('click', ()=>{
    modalConfirmedDelete.classList.add('hidden')
})