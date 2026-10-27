# Casa 2 Studio — Sistema de Agendamento de Ensaios

Aplicação local para registrar e gerenciar os ensaios das bandas em um estúdio musical. O proprietário do estúdio usa a interface web para cadastrar, consultar, editar e excluir agendamentos, com validações que impedem horários sobrepostos.

> **Status:** CRUD concluído. O sistema roda localmente em um único computador, para uso de uma única pessoa (o proprietário do estúdio). Não possui autenticação e não deve ser exposto à internet.

## Sumário

1. [Funcionalidades](#funcionalidades)
2. [Tecnologias](#tecnologias)
3. [Arquitetura e estrutura de diretórios](#arquitetura-e-estrutura-de-diretórios)
4. [Regras de negócio](#regras-de-negócio)
5. [Documentação da API](#documentação-da-api)
6. [Banco de dados](#banco-de-dados)
7. [Execução em desenvolvimento](#execução-em-desenvolvimento)
8. [Entrega e instalação no estúdio](#entrega-e-instalação-no-estúdio)
9. [Uso diário](#uso-diário)
10. [Dados, backup e atualização](#dados-backup-e-atualização)
11. [Solução de problemas](#solução-de-problemas)
12. [Limitações conhecidas](#limitações-conhecidas)
13. [Melhorias futuras](#melhorias-futuras)

## Funcionalidades

| Funcionalidade | Situação |
|---|---|
| Criar agendamento (banda, início, fim e valor) | Implementada |
| Listar agendamentos ordenados por horário de início | Implementada |
| Detalhes de um agendamento (barra lateral) | Implementada |
| Editar agendamento | Implementada |
| Excluir um ou vários agendamentos, com seleção por checkbox e confirmação | Implementada |
| Impedir sobreposição de horários | Implementada (criação e edição) |
| Ordenação por coluna e filtros | Não implementadas |
| Autenticação | Não existe (uso local) |

## Tecnologias

| Tecnologia | Uso |
|---|---|
| Node.js 24 (LTS) | Execução do back-end |
| Express 5 | Servidor HTTP, rotas e arquivos estáticos |
| Prisma ORM 6 | Acesso ao banco de dados |
| SQLite | Banco de dados local (um arquivo) |
| dotenv | Variáveis de ambiente |
| HTML, CSS e JavaScript | Interface, sem framework |
| VBScript + Edge/Chrome em modo aplicativo | Atalho de uso diário no Windows |

O projeto usa ES Modules (`"type": "module"`).

## Arquitetura e estrutura de diretórios

```
.
├── server.js                  # Inicia o servidor em 127.0.0.1:3000
├── iniciar.vbs         # Atalho de uso diário (servidor oculto + janela)
├── encerrar.bat        # Encerra o servidor em segundo plano
├── prisma/
│   └── schema.prisma          # Modelo de dados
├── src/
│   ├── backend/
│   │   ├── app.js             # Monta o Express (JSON, arquivos estáticos, rotas)
│   │   ├── db.js              # Instância do PrismaClient
│   │   ├── horarioScript.js   # Funções de data e fuso horário
│   │   └── routers/
│   │       └── agendamentoRouter.js
│   ├── database/              # Arquivo do banco (studio.db), não versionado
│   └── frontend/
│       ├── view/              # Páginas HTML
│       ├── styles/
│       ├── scripts/
│       └── image/
├── .env.example               # Modelo de variáveis de ambiente
└── package.json
```

- O `server.js` importa o app e escuta em `127.0.0.1:3000`. Somente o próprio computador consegue acessar.
- O Express serve a pasta `src/frontend` e a API na mesma origem. Por isso o front-end chama a API com caminhos relativos (`/agendamento`), e a página inicial é `http://127.0.0.1:3000` (redireciona para `/view/homeScreen.html`).
- As regras de negócio e as validações ficam no router. Não há camada de repositório nem tratamento centralizado de erros.

## Regras de negócio

- `nomeBanda` deve ser um texto.
- `horaInicio`, `horaFim` e `valor` são obrigatórios.
- As datas devem ser válidas.
- O início deve ser **estritamente anterior** ao término.
- Dois agendamentos não podem ter períodos sobrepostos: há conflito quando **o início de um é anterior ao fim do outro e o fim de um é posterior ao início do outro**. Como as comparações são estritas, ensaios consecutivos são permitidos (um que termina às 16h não conflita com outro que começa às 16h).
- O valor mínimo é **R$ 80,00**.
- O valor é recebido em reais e armazenado em **centavos** (inteiro) no campo `valor`.
- Na edição, o próprio agendamento é ignorado na verificação de conflito.
- Datas recebidas sem indicação de fuso são interpretadas como horário de Brasília (UTC-3).
- A listagem é ordenada por `horaInicio`, em ordem crescente.

## Documentação da API

URL base: `http://127.0.0.1:3000`. As respostas de erro seguem o formato `{ "error": "mensagem" }`.

### POST `/agendamento` — criar

| Campo | Tipo | Observação |
|---|---|---|
| `nomeBanda` | string | Obrigatório |
| `horaInicio` | string | Por exemplo `2026-10-20T19:00` |
| `horaFim` | string | Deve ser posterior a `horaInicio` |
| `valor` | número ou string numérica | Em reais, mínimo 80. O valor `0` é tratado como ausente |

Ordem das validações: campos obrigatórios → tipo do nome → datas válidas → início anterior ao fim → conflito → valor numérico → valor mínimo.

| Status | Significado |
|---|---|
| `201` | Criado. O corpo é um texto JSON: `"Agendamento concluído com sucesso!"` |
| `400` | Campo ausente, tipo inválido, data inválida, intervalo inválido ou valor inválido |
| `409` | Já existe um ensaio nesse horário |
| `500` | Erro interno |

### GET `/agendamento` — listar

Retorna todos os registros ordenados por `horaInicio` crescente.

```json
[
  {
    "id": "6e1f3669-7f67-4ad1-9ff4-example",
    "nomeBanda": "SlipKnot",
    "horaInicio": "2026-10-20T22:00:00.000Z",
    "horaFim": "2026-10-20T23:00:00.000Z",
    "valor": 8000,
    "createdAt": "2026-10-13T17:27:05.000Z"
  }
]
```

`valor` vem em centavos. Em caso de falha, retorna `500`.

### GET `/agendamento/:id` — consultar um

| Status | Significado |
|---|---|
| `200` | Objeto do agendamento, no formato acima |
| `404` | `{ "error": "Agendamento não Encontrado." }` |
| `500` | Erro interno |

### PATCH `/agendamento/:id` — atualizar

Apesar do método PATCH, a implementação **exige todos os campos** (`nomeBanda`, `horaInicio`, `horaFim` e `valor`). Não aceita atualização parcial.

Etapas: verifica se o registro existe (`404`) → valida os campos (`400`) → verifica conflito ignorando o próprio registro (`409`) → valida o valor (`400`) → atualiza.

Resposta (`200`):

```json
{
  "agendamentoUpdated": {
    "id": "6e1f3669-7f67-4ad1-9ff4-example",
    "nomeBanda": "SlipKnot",
    "horaInicio": "2026-10-20T22:00:00.000Z",
    "horaFim": "2026-10-21T00:00:00.000Z",
    "valor": 9000,
    "createdAt": "2026-10-13T17:27:05.000Z"
  }
}
```

### DELETE `/agendamento` — excluir

Os identificadores vão **no corpo** da requisição:

```json
{ "ids": ["id-1", "id-2"] }
```

- `ids` deve ser um array não vazio de strings; senão, `400`.
- A exclusão usa `deleteMany`. Identificadores inexistentes são ignorados, e a resposta informa quantos registros foram removidos. Se nenhum existir, a resposta continua sendo `200`, com `quantidade: 0`.

```json
{ "message": "Agendamentos Deletados com Sucesso.", "quantidade": 2 }
```

A rota não aplica regras adicionais, como impedir a exclusão de ensaios passados.

## Banco de dados

O banco é um arquivo SQLite acessado pelo Prisma ORM. **Cada computador tem o seu próprio arquivo**, com dados independentes: não há sincronização.

Modelo `Agendamento`:

| Campo | Tipo | Observações |
|---|---|---|
| `id` | `String` | Chave primária, UUID |
| `nomeBanda` | `String` | Nome da banda |
| `horaInicio` | `DateTime` | Possui índice |
| `horaFim` | `DateTime` | |
| `valor` | `Int` | Em centavos |
| `createdAt` | `DateTime` | Padrão `now()` |

O caminho do arquivo vem da variável `DATABASE_URL`, definida no `.env` (modelo em `.env.example`). O caminho é relativo à pasta `prisma/`:

```dotenv
DATABASE_URL="file:../src/database/studio.db"
```

Os arquivos `*.db` e o `.env` não são versionados.

## Execução em desenvolvimento

Pré-requisitos: Node.js 24 (LTS) e Git. Em PowerShell:

```powershell
git clone https://github.com/jjoaoSantosp/Estudio-Casa-2.git
cd Estudio-Casa-2

npm install
Copy-Item .env.example .env
New-Item -ItemType Directory -Force src\database | Out-Null
npx prisma db push

npm run dev
```

Abra `http://127.0.0.1:3000` no navegador. Não use o Live Server: a página e a API precisam vir do mesmo servidor.

Scripts: `npm start` (`node server.js`) e `npm run dev` (`nodemon server.js`).

## Entrega e instalação no estúdio

O computador do estúdio roda o sistema por meio do `iniciar.vbs`: ele inicia o servidor sem janela, espera ele responder e abre a Agenda numa janela de aplicativo (Microsoft Edge, ou Chrome se o Edge não abrir), sem barra de endereço e sem terminal.

Há duas formas de instalar.

### Opção A — Pasta portátil (nada para instalar no estúdio)

O Node.js vai dentro da própria pasta (`runtime\node.exe`). O estúdio não precisa instalar Node, npm nem digitar comandos.

**Gerar o pacote** (feito por quem desenvolve, em PowerShell, numa pasta nova):

```powershell
git clone --depth 1 https://github.com/jjoaoSantosp/Estudio-Casa-2.git Casa2Studio
cd Casa2Studio
Remove-Item -Recurse -Force .git, .claude, .agents, .windsurf -ErrorAction SilentlyContinue

Set-Content .env 'DATABASE_URL="file:../src/database/studio.db"'
New-Item -ItemType Directory -Force src\database | Out-Null

npm ci --omit=dev
npx prisma db push
```

Depois:

1. Baixe em nodejs.org o **Windows Binary (.zip)**, 64 bits, da versão 24.x LTS mais recente. Extraia só o `node.exe` para `Casa2Studio\runtime\node.exe`.
2. Copie o ícone do estúdio (`.ico`, de 256 px) para `Casa2Studio\icone.ico`.
3. **Não abra o sistema nessa pasta antes de compactar.** Se abrir, apague `src\database\studio.db` e `servidor.log` e rode `npx prisma db push` de novo, para entregar o banco vazio.
4. Compacte a pasta `Casa2Studio` em um `.zip`.

Não copie o seu `.env` nem o seu `studio.db` de desenvolvimento: o `.env` do pacote é o gerado acima, e o banco de desenvolvimento tem dados de teste.

**Instalar no estúdio:**

1. Leve o `.zip` por pendrive ou link do Google Drive/OneDrive. Por e-mail não funciona bem: provedores bloqueiam scripts e executáveis, e o arquivo é grande.
2. Clique com o botão direito no `.zip`, escolha **Propriedades**, marque **Desbloquear** e confirme.
3. Extraia em `C:\Casa2Studio`. Evite Área de Trabalho e Documentos: costumam ser sincronizados pelo OneDrive, o que pode atrapalhar o arquivo do banco.
4. Clique com o botão direito em `iniciar.vbs`, **Enviar para**, **Área de trabalho (criar atalho)**.
5. Renomeie o atalho para `Agenda Casa 2 Studio`. Em **Propriedades**, **Alterar Ícone**, escolha o `icone.ico` da pasta.
6. Abra o atalho. Na primeira vez pode levar alguns segundos.

### Opção B — Com Node.js instalado

Use esta opção se o computador já tem Node ou se você quer atualizar com `git pull`.

1. Instale o Node.js 24 (LTS) em nodejs.org.
2. Baixe o projeto (Code, Download ZIP, no GitHub) e extraia em `C:\Casa2Studio`.
3. Na pasta, em PowerShell:

```powershell
npm install --omit=dev
Copy-Item .env.example .env
New-Item -ItemType Directory -Force src\database | Out-Null
npx prisma db push
```

4. Crie o atalho do `iniciar.vbs` como nos passos 4 e 5 acima.

## Uso diário

- **Abrir:** pelo atalho. Se o servidor já estiver rodando, abre só a janela.
- **Fechar a janela não encerra o servidor.** Ele continua em segundo plano, sem janela, até o computador ser reiniciado ou até você executar `encerrar.bat`.
- **Registro do servidor:** o arquivo `servidor.log`, na pasta do sistema, guarda as mensagens e os erros.

## Dados, backup e atualização

- Os dados ficam em `src\database\studio.db`. O arquivo é independente do navegador e de cada cópia da pasta: se houver duas pastas do sistema, cada uma tem o seu banco.
- **Backup:** execute `encerrar.bat` e copie o `studio.db` para um pendrive ou serviço de nuvem. Faça isso periodicamente. Para restaurar, encerre o servidor e substitua o arquivo.
- **Atualizar:** substitua os arquivos do sistema pelos da versão nova, mantendo `src\database\studio.db` e `.env`. Se a versão mudar o `schema.prisma`, rode `npx prisma db push`. Se o comando avisar sobre perda de dados, pare e faça backup antes. Nunca use `--force-reset`, que apaga os dados.

## Solução de problemas

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| Nada acontece ao abrir o atalho | VBScript desativado no Windows | Em Configurações, Sistema, Recursos opcionais, confirme se o VBScript está instalado |
| O Windows pergunta com qual programa abrir o `.vbs` | Mesma causa | Idem |
| Aparece "Nao foi possivel iniciar o servidor" | O servidor não subiu | Abra o `servidor.log` |
| `'node' não é reconhecido` no log | Node não instalado (Opção B) ou pasta `runtime` ausente (Opção A) | Instale o Node ou confira `runtime\node.exe` |
| `EADDRINUSE` no log | A porta 3000 está em uso | Execute `encerrar.bat` e abra de novo |
| `unable to open database file` no log | `.env` ausente ou pasta `src\database` ausente | Refaça os passos de instalação |
| Aviso do SmartScreen ou do antivírus | Arquivos sem assinatura | Escolha **Mais informações** e **Executar assim mesmo**, ou desbloqueie o `.zip` antes de extrair |
| A janela abre, mas diz que o site não pode ser acessado | O servidor ainda não terminou de subir | Feche a janela e abra o atalho de novo |
| Os agendamentos "sumiram" | Foi aberta outra cópia da pasta, com outro banco | Use sempre o mesmo atalho |

## Limitações conhecidas

- **Sem autenticação.** O servidor aceita conexões apenas do próprio computador (`127.0.0.1`), mas qualquer programa ou usuário desse computador pode usar a API.
- **Servidor em segundo plano.** Depois de fechar a janela, ele continua rodando até o reinício ou até o `encerrar.bat`.
- **VBScript em descontinuação.** A Microsoft prevê que ele passe a vir desativado por padrão em versões futuras do Windows, a partir de 2027. Hoje funciona.
- **Conflitos e concorrência.** A verificação de conflito e a criação do registro são operações separadas, sem transação. Para uso por uma pessoa o risco é baixo.
- **Fuso horário fixo.** Datas sem fuso são interpretadas como UTC-3, e a interface mostra os horários no fuso do computador.
- **Valores monetários.** A conversão para centavos usa multiplicação por 100 sem arredondamento explícito, o que pode gerar erro com certos valores decimais.
- **Respostas sem padrão único.** O POST devolve um texto; o PATCH, um objeto com `agendamentoUpdated`; o DELETE, `message` e `quantidade`.
- **PATCH não parcial** e **sem testes automatizados.**
- **Backup manual.** O sistema não faz cópia de segurança sozinho.

## Melhorias futuras

- Ordenação por colunas e filtro por data ou período.
- Tornar o PATCH realmente parcial.
- Validação monetária segura.
- Testes automatizados das regras de negócio.
- Backup automático do banco.
- Substituir o VBScript por outra forma de iniciar o sistema sem janela, quando necessário.