const backDropSideBar = document.getElementById('fundo-sidebar')
const sideBarDetails = document.getElementById('sidebar-detalhes')
const btnCloseSideBar = document.getElementById('btn-fechar-sidebar')

document.getElementById('corpo-tabela').addEventListener('click', (event)=>{
 
    if(event.target.tagName !== 'BUTTON'){return}

    const idAgendamento = event.target.dataset.id

    console.log('Agendamento clicado: ',idAgendamento)

    backDropSideBar.classList.remove('hidden')
    sideBarDetails.classList.remove('hidden')
    sideBarDetails.setAttribute('aria-hidden', 'false')

    
})

btnCloseSideBar.addEventListener('click', (event)=>{
    backDropSideBar.classList.add('hidden')
    sideBarDetails.classList.add('hidden')
    sideBarDetails.setAttribute('aria-hidden', 'true') 

})

