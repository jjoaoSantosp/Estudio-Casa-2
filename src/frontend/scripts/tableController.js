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


console.log('tableController carregado');



//VARIÁVEIS ENVOLVENDO MODAL DE EXCLUSÃO
const modalConfirmedDelete = document.getElementById('modal-confirmar-exclusao')
const modalExclusionEmpty = document.getElementById('modal-confirmar-exclusao-empty')

//VARIÁVEIS ENVOLVENDO AS FUNÇÕES DO MODAL DE EXCLUSÃO
const btnCancelDelete = document.getElementById('btn-cancelar-exclusao')
const btnModalDelete = document.getElementById('btn-excluir-selecionados')
const btnDeleteConfirmed = document.getElementById('btn-confirmar-exclusao')
const btnCancelDeleteEmpty = document.getElementById('btn-confirmar-exclusao-empty')

//VARIÁVEIS RELACIONADAS A CHECKBOXES SELECIONADOS
const countSelected = document.querySelector('.count-select')
const checkboxSelectedAll = document.getElementById('checkbox-selecionar-todos')


console.log({
  countSelected,
  checkboxSelectedAll,
  btnModalDelete,
  modalConfirmedDelete,
  modalExclusionEmpty
});


//ATUALIZAR CONTAGEM
function atualizarContagem() {
    
    //Atribui uma NodeList para variávei com todos os checkboxes que estão marcados 
    //Faz a atribuição a partir dos checkboxes da lista
    const checkboxesMarcados = document.querySelectorAll('#corpo-tabela .table-checkbox:checked');
    
    //Atribui o tamanho da NodeList para ser um conteúdo de contagem de selecionados
    countSelected.textContent = checkboxesMarcados.length;
}

//SELEÇÃO DE TODOS OS CHECKBOX
checkboxSelectedAll.addEventListener('change', () => {

    //PEGAR TODOS OS ELEMENTOS COM A CLASSE '.table-checkbox'
    const checkboxes = document.querySelectorAll('#corpo-tabela .table-checkbox');

    //PERCORRE TODAS AS CHECKBOXES E COPIA O ESTADO DA CAIXA PRINCIPAL
    //DEIXANDO MARCADAS OU DESMARCADAS BASEADA NA CHECKBOX DO CABEÇALHO
    checkboxes.forEach((checkbox) => {
        checkbox.checked = checkboxSelectedAll.checked;

    });

    atualizarContagem();
});

// SELEÇÃO INDIVIDUAL DE CHECKBOX
// Funciona mesmo quando as linhas são criadas dinamicamente.
document.getElementById('corpo-tabela').addEventListener('change', (event) => {

    if (!event.target.matches('.table-checkbox')) {
        return;
    }

    const all = document.querySelectorAll('#corpo-tabela .table-checkbox')

    const marked = document.querySelectorAll('#corpo-tabela .table-checkbox:checked')

    checkboxSelectedAll.checked = all.length > 0 && marked.length === all.length

    atualizarContagem()

})

// CORREÇÃO: quando o formAgendamento.js recria as linhas da tabela (loadAgendamento),
// todas nascem desmarcadas. Sem isso, a contagem e o checkbox do cabeçalho
// continuavam mostrando o estado antigo.
document.addEventListener('tabela-atualizada', () => {
    checkboxSelectedAll.checked = false
    atualizarContagem()
})

async function deleteScheduling() {
    
    try {
        const schedulingSelected = Array.from(document.querySelectorAll('.table-checkbox:checked')).
        map(checkbox => checkbox.value)
     
        const responseSchedulingDelete = await fetch('http://localhost:3000/agendamento', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ids: schedulingSelected
            })
        })

        const result = await responseSchedulingDelete.json()

        if(!responseSchedulingDelete.ok){
            throw new Error(result.error || 'Erro ao deletar agendamentos.')
        }

        console.log('Agendamentos deletados com sucesso!', {
            quantidade: schedulingSelected.length,
            resultado: result
        })

        // Fecha o modal após o sucesso
        modalConfirmedDelete.classList.add('hidden');

        // Atualiza a página para refletir as exclusões
        window.location.reload();
    
    } catch (error) {
        console.error('Erro ao deletar os agendamentos: ', error.message)
        
        throw error
    }
}

//EVENTO DE EXIBIR MODAL DE EXCLUSÃO
btnModalDelete.addEventListener('click', ()=>{
    
    if(document.querySelectorAll('#corpo-tabela .table-checkbox:checked').length===0){
        modalExclusionEmpty.classList.remove('hidden')
    }else{
        modalConfirmedDelete.classList.remove('hidden')
    }
})

btnDeleteConfirmed.addEventListener('click', async () => {
    try {
        await deleteScheduling();
    } catch (error) {
        console.error('Não foi possícel confirmar a exclusão. ', error.message)
    }
})

btnCancelDelete.addEventListener('click', ()=>{
    modalConfirmedDelete.classList.add('hidden')
})

btnCancelDeleteEmpty.addEventListener('click', ()=>{
    modalExclusionEmpty.classList.add('hidden')
})

atualizarContagem()