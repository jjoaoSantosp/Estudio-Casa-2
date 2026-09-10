const btnAbrirModal = document.getElementById('btn-abrir-modal')
const btnCancelar = document.getElementById('btn-cancelar')

const formAgendamento = document.getElementById('form-agendamento')
const modalAgendamento = document.getElementById('modal-agendamento')

const inputNomeBanda = document.getElementById('input-nome-banda')
const inputHoraInicio = document.getElementById('input-hora-inicio')
const inputHoraFim = document.getElementById('input-hora-fim')

const erroFormulario = document.getElementById('erro-formulario')
const erroNomeBanda = document.getElementById('erro-nome-banda')
const erroHoraInicio = document.getElementById('erro-hora-inicio')
const erroHoraFim = document.getElementById('erro-hora-fim')

const emptyTable = document.getElementById('tabela-vazia')


btnAbrirModal.addEventListener('click', () => {
    formAgendamento.reset()
    
    erroNomeBanda.classList.add('hidden')
    erroHoraInicio.classList.add('hidden')
    erroHoraFim.classList.add('hidden')
    erroFormulario.classList.add('hidden')
    
    modalAgendamento.classList.remove('hidden')
})

btnCancelar.addEventListener('click', ()=>{
    modalAgendamento.classList.add('hidden')
})

formAgendamento.addEventListener('submit', async(event) =>{
    event.preventDefault()
    
    try{

        const nomeBanda = inputNomeBanda.value.trim()
        const horaInicio = inputHoraInicio.value
        const horaFim = inputHoraFim.value

        let existError = false

        if(!nomeBanda || nomeBanda === ""){
            erroNomeBanda.textContent = "Campo Obrigatório, Preencha Corretamente."
            erroNomeBanda.classList.remove('hidden')
            existError = true

        }else{
            erroNomeBanda.textContent = ""
            erroNomeBanda.classList.add('hidden')
        }


        if(!horaInicio){
            erroHoraInicio.textContent = "Preencha o campo de Início do Ensaio."
            erroHoraInicio.classList.remove('hidden')
            existError = true

        }else{
            erroHoraInicio.textContent = ""
            erroHoraInicio.classList.add('hidden')
        }


        if(!horaFim){
            erroHoraFim.textContent = "Preencha o campo de Fim do Ensaio."
            erroHoraFim.classList.remove('hidden')
            existError = true

        }else if(horaFim <= horaInicio){
            erroHoraFim.textContent = "O horário do Fim do Ensaio não pode ser Menor que o Início."
            erroHoraFim.classList.remove('hidden')
            existError = true

        }else{
            erroHoraFim.textContent = ""
            erroHoraFim.classList.add('hidden')
        }
        
        if(existError) return

        const agendamento = {
            nomeBanda,
            horaInicio,
            horaFim
        }

        const response = await fetch('http://localhost:3000/agendamento', {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify(agendamento)
        })

        const data = await response.json()


        if(!response.ok){
            throw new Error(data.error)
        }

        console.log("Agendamento Feito Com Sucesso!", {nomeBanda, horaInicio, horaFim})

        await loadAgendamento()
        
    }catch(error){
        console.error("Ocorreu um erro ao processar o formulário: ", error)
        erroFormulario.textContent = "Ocorreu um erro ao enviar o formulário. "+ error.message
        erroFormulario.classList.remove('hidden')
    }
    
})


async function loadAgendamento() {
    try {

        const response = await fetch('http://localhost:3000/agendamento')
        
        if(!response.ok){
            throw new Error("Erro ao buscar os agendamentos")
        }
        
        console.log(response)
        
        console.log(response.ok)
        
        console.log(response.status)
        
        const agendamentos = await response.json()
        console.log(agendamentos)
        
        const tableBody = document.querySelector('#corpo-tabela')
        const table = document.querySelector('.agenda-table')
        tableBody.innerHTML = ''
        
        const opcoes = {
             
            month: 'numeric', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }

        agendamentos.forEach(element => {
            
            const newLine = document.createElement('tr')
            //CHECKBOX
            const tdCheckBox = document.createElement('td')
            
            const checkbox = document.createElement('input')
            checkbox.type = 'checkbox'
            tdCheckBox.appendChild(checkbox)
            
            //BUTÃO DE DETALHES DO AGENDAMENTO
            const tdDetails = document.createElement('td')
            const btnDetails = document.createElement('button')
            btnDetails.textContent = 'Detalhes'

            //GUARDAR O ID PARA DO AGENDAMENTO DO BUTÃO
            btnDetails.dataset.id = element.id
            tdDetails.appendChild(btnDetails)
            
            //NOME DA BANDA
            const tdnomeBanda = document.createElement('td')
            tdnomeBanda.textContent = element.nomeBanda
            
            //HORÁRIO DE INÍCIO
            const tdhoraInicio = document.createElement('td')
            const dataInicio = new Date(element.horaInicio)
            tdhoraInicio.textContent = dataInicio.toLocaleDateString('pt-BR', opcoes)
            
            //HORÁRIO QUE TERMINA
            const tdhoraFim = document.createElement('td')
            const dataFim = new Date(element.horaFim)
            tdhoraFim.textContent = dataFim.toLocaleDateString('pt-BR', opcoes)
            
            //MONTA A LINHA
            newLine.appendChild(tdCheckBox)
            newLine.appendChild(tdDetails)
            newLine.appendChild(tdnomeBanda)
            newLine.appendChild(tdhoraInicio)
            newLine.appendChild(tdhoraFim)
    
            //COLOCA A LINHA DENTRO DO TBODY
            tableBody.appendChild(newLine)
        });
    
        return agendamentos

    } catch (error) {
        console.error('Erro ao carregar agendamentos:', error)
        erroFormulario.textContent = 'Agendamento salvo, mas houve erro ao atualizar a tabela: ' + error.message
        erroFormulario.classList.remove('hidden')
    }
    
}
loadAgendamento()