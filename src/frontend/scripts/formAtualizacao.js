const modalAtualizarAgendamento = document.getElementById('modal-atualizar-agendamento')

const formAgendamentoUp = document.getElementById('form-agendamento-up')
const inputNomeBandaUp = document.getElementById('input-nome-banda-up')
const inputHoraInicioUp = document.getElementById('input-hora-inicio-up')
const inputHoraFimUp = document.getElementById('input-hora-fim-up')
const inputValorEnsaioUp = document.getElementById('input-valor-ensaio-up')
const btnCancelarUp = document.getElementById('btn-cancelar-up')

let idAgendamentoEditando = null

const erroNomeBanda = document.getElementById('erro-nome-banda-up')
const erroHoraInicio = document.getElementById('erro-hora-inicio-up')
const erroHoraFim = document.getElementById('erro-hora-fim-up')
const erroValorEnsaio = document.getElementById('erro-valor-ensaio-up')
const erroFormulario = document.getElementById('erro-formulario-up')

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
        const response = await fetch(`/agendamento/${idAgendamentoSelecionado}`)

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

    // Captura os valores do formulário de atualização
    const nomeBanda = inputNomeBandaUp.value.trim()
    const horaInicio = inputHoraInicioUp.value
    const horaFim = inputHoraFimUp.value
    const valorEnsaio = inputValorEnsaioUp.value.trim()

    const agendamentoAtualizado = {
        nomeBanda,
        horaInicio,
        horaFim,
        valor: Number(valorEnsaio)
    }

    let existError = false

    if(!nomeBanda || nomeBanda.trim() === ""){
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

    }else if(!horaFim || new Date(horaFim).getTime() <= new Date(horaInicio).getTime()){
        erroHoraFim.textContent = "O horário do fim do ensaio não pode ser menor ou igual que o Início."
        erroHoraFim.classList.remove('hidden')
        existError = true

    }else{
        erroHoraFim.textContent = ""
        erroHoraFim.classList.add('hidden')
    }

    const valorNumerico = Number(valorEnsaio)

    if(!valorEnsaio.trim()){
        erroValorEnsaio.textContent = "Preencha o Campo de Valor do Ensaio."
        erroValorEnsaio.classList.remove('hidden')
        existError = true

    }else if(!Number.isFinite(valorNumerico)|| valorNumerico < 80){
        erroValorEnsaio.textContent = "O valor mínimo permitido para a contratação do ensaio é de R$ 80,00."
        erroValorEnsaio.classList.remove('hidden')
        existError = true

    }else{
        erroValorEnsaio.textContent = ""
        erroValorEnsaio.classList.add('hidden')
    }

    if(existError) return
    
    try {

        erroFormulario.textContent = ""
        erroFormulario.classList.add('hidden')

        const response = await fetch(`/agendamento/${idAgendamentoEditando}`,{
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

        //Atualiza a página para refletir a atulização do agendamento
        window.location.reload()

    } catch (error) {
        console.error('Erro ao atualizar agendamento:', error)  
    }
})

btnCancelarUp.addEventListener('click', ()=>{
    modalAtualizarAgendamento.classList.add('hidden')
})