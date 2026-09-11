const backDropSideBar = document.getElementById('fundo-sidebar')
const sideBarDetails = document.getElementById('sidebar-detalhes')
const btnCloseSideBar = document.getElementById('btn-fechar-sidebar')

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
    
        const ddBanda = document.getElementById('detalhe-banda')
        const ddHoraInicio = document.getElementById('detalhe-hora-inicio')
        const ddHoraFim = document.getElementById('detalhe-hora-fim')
        const ddID = document.getElementById('detalhe-id')
        const ddCreatedAt = document.getElementById('detalhe-criado-em')
        
        const opcoes = {
            weekday: 'long',
            day: 'numeric',  
            month: 'long',   
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'  
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

