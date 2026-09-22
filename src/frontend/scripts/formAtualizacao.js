const modalAtualizarAgendamento = document.getElementById('modal-atualizar-agendamento')

const formAgendamentoUp = document.getElementById('form-agendamento-up')
const inputNomeBandaUp = document.getElementById('input-nome-banda-up')
const inputHoraInicioUp = document.getElementById('input-hora-inicio-up')
const inputHoraFimUp = document.getElementById('input-hora-fim-up')
const inputValorEnsaioUp = document.getElementById('input-valor-ensaio-up')
const btnCancelarUp = document.getElementById('btn-cancelar-up')

let idAgendamentoEditando = null

function formatarParaDatetimeLocal(dataISO) {
    const data = new Date(dataISO)

    const ano = data.getFullYear()
    const mes = String(data.getMonth() + 1).padStart(2, '0')
    const dia = String(data.getDate()).padStart(2, '0')
    const hora = String(data.getHours()).padStart(2, '0')
    const minuto = String(data.getMinutes()).padStart(2, '0')

    return `${ano}-${mes}-${dia}T${hora}:${minuto}`
}

export async function abrirModalEdicao(idAgendamentoSelecionado) {
    try {
        const response = await fetch(`http://localhost:3000/agendamento/${idAgendamentoSelecionado}`)

        if(!response.ok){
            throw new Error('Erro ao Carregar a Edição.')
        }

        const agendamento = await response.json()

        idAgendamentoEditando = agendamento.id
        inputNomeBandaUp.value = agendamento.nomeBanda
        inputHoraInicioUp.value = formatarParaDatetimeLocal(agendamento.horaInicio)
        inputHoraFimUp.value = formatarParaDatetimeLocal(agendamento.horaFim)
        inputValorEnsaioUp.value = agendamento.valor/100

        modalAtualizarAgendamento.classList.remove('hidden')
    } catch (error) {

        console.error(
            'Erro ao abrir agendamento para edição:',
            error
        )
    }
}

formAgendamentoUp.addEventListener('submit',async (event) =>{
    event.preventDefault()

    const agendamentoAtualizado = {
        nomeBanda: inputNomeBandaUp.value,
        horaInicio: inputHoraInicioUp.value,
        horaFim: inputHoraFimUp.value,
        valor: Number(inputValorEnsaioUp.value)
    }

    
    try {

        const response = await fetch(`http://localhost:3000/agendamento/${idAgendamentoEditando}`,{
            method:'PATCH',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify(agendamentoAtualizado)
        })

        const dataUp = await response.json()

        if(!response.ok){
            throw new Error(dataUp.error)
        }


    } catch (error) {
        console.error('Erro ao atualizar agendamento:', error)  
    }
})

btnCancelarUp.addEventListener('click', ()=>{
    modalAtualizarAgendamento.classList.add('hidden')
})