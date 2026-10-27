import {app, BrowserWindow, Menu, dialog} from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Guardam a janela e o servidor para poder usá-los em outras funções
// (restaurar a janela, encerrar o servidor ao sair).
let janela = null
let servidor = null

// O banco fica na pasta de dados do usuário (gravável).
// Na primeira execução, é copiado do modelo.
function prepararBanco(){
    
    const pastaDados = app.getPath('userData')
    const caminhoBanco = path.join(pastaDados, 'studio.db')
    
    // Primeira execução: o banco ainda não existe, então copia o modelo.
    if(!fs.existsSync(caminhoBanco)){
        const modelo = app.isPackaged
            ? path.join(process.resourcesPath, 'studio.template.db')
            : path.join(__dirname, '..', 'build-resources',
        'studio.template.db')

        fs.mkdirSync(pastaDados, { recursive: true })
        fs.copyFileSync(modelo, caminhoBanco)   
    }       

    // Precisa ser definido ANTES de carregar o backend (o Prisma lê ao iniciar).
    // Roda sempre, com o banco recém-copiado ou já existente.
    process.env.DATABASE_URL = 'file:' + caminhoBanco.split(path.sep).join('/')
}

async function iniciarServidor() {
    // import dinâmico: só carrega o backend depois que DATABASE_URL existe
    const { default: expressApp } = await import('../src/backend/app.js')
    
    return new Promise((resolve, reject) => {
        // porta 0 = o sistema escolhe uma porta livre
        servidor = expressApp.listen(0, '127.0.0.1', () => resolve(servidor.address().port))
        servidor.on('error', reject)
    })
}

async function criarJanela(porta) {
    // Remove a barra de menu (File, Edit, View...)
    Menu.setApplicationMenu(null)

    janela = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        title: 'Agenda Casa 2 Studio',
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false
        }
    })

    await janela.loadURL(`http://127.0.0.1:${porta}/view/homeScreen.html`)

    // DevTools só no desenvolvimento (no instalado, app.isPackaged é true)
    if (!app.isPackaged) janela.webContents.openDevTools({ mode: 'detach' })

    
}


// Pede a "trava" de instância única. Devolve false se já existe
// outro processo deste app em execução.
const unicaInstancia = app.requestSingleInstanceLock()
 
if (!unicaInstancia) {
    // Já há um app aberto: este processo se encerra.
    app.quit()
} else {
    // Se o usuário tentar abrir de novo, traz a janela existente para a frente.
    app.on('second-instance', () => {
        if (janela) {
            if (janela.isMinimized()) janela.restore()
            janela.focus()
        }
    })
 
    // Sequência de inicialização: banco -> servidor -> janela.
    app.whenReady().then(async () => {
        try {
            prepararBanco()
            const porta = await iniciarServidor()
            await criarJanela(porta)
        } catch (erro) {
            dialog.showErrorBox('Erro ao iniciar a Agenda', erro?.stack || String(erro))
            app.quit()
        }
    })
 
    // Ao fechar a janela: encerra o servidor e o app.
    app.on('window-all-closed', () => {
        if (servidor) servidor.close()
        app.quit()
    })
}