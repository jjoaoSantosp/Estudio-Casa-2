const countSelected = document.getElementById('contador-selecionados')
const btnDeleteSelected = document.getElementById('btn-excluir-selecionados')
const checkboxSelectedAll = document.getElementById('checkbox-selecionar-todos')
const modalConfirmedDelete = document.getElementById('modal-confirmar-exclusao')
const btnCancelDelete = document.getElementById('btn-cancelar-exclusao')
let idsSelecionados = []

btnDeleteSelected.addEventListener('click', ()=>{
    modalConfirmedDelete.classList.remove('hidden')
})

btnCancelDelete.addEventListener('click', ()=>{
    modalConfirmedDelete.classList.add('hidden')
})
