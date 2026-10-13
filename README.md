# Casa 2 Studio — Sistema de Agendamento de Ensaios

Aplicação local para registrar e gerenciar os ensaios das bandas em um estúdio musical. O proprietário do estúdio usa a interface web para cadastrar, consultar, editar e excluir agendamentos, com validações que impedem horários sobrepostos.

> **Status:** em desenvolvimento. O sistema foi pensado para uso local por uma única pessoa (o proprietário do estúdio). Não possui autenticação e não deve ser exposto à internet.

## Sumário

1. [Funcionalidades](#funcionalidades)
2. [Tecnologias](#tecnologias)
3. [Arquitetura e estrutura de diretórios](#arquitetura-e-estrutura-de-diretórios)
4. [Regras de negócio](#regras-de-negócio)
5. [Documentação da API](#documentação-da-api)
6. [Banco de dados](#banco-de-dados)
7. [Instalação e execução local](#instalação-e-execução-local)
8. [Exemplos de uso da API](#exemplos-de-uso-da-api)
9. [Códigos HTTP e tratamento de erros](#códigos-http-e-tratamento-de-erros)
10. [Limitações conhecidas](#limitações-conhecidas)
11. [Melhorias futuras](#melhorias-futuras)

## Funcionalidades

| Funcionalidade | Situação |
|---|---|
| Criar agendamento (nome da banda, início, fim e valor) | Implementada (API e interface) |
| Listar agendamentos ordenados por horário de início | Implementada (API e interface) |
| Consultar detalhes de um agendamento (barra lateral) | Implementada (API e interface) |
| Atualizar agendamento | API implementada; interface parcial |
| Excluir um ou vários agendamentos | API implementada; interface em desenvolvimento |
| Impedir sobreposição de horários | Implementada na API (criação e atualização) |
| Validação de formulário com mensagens por campo | Implementada na criação |
| Ordenação configurável pelo usuário e filtros | Não implementadas |
| Empacotamento como aplicativo desktop (Electron) | Planejado; não presente no código |

## Tecnologias

| Tecnologia | Uso |
|---|---|
| Node.js | Ambiente de execução do back-end |
| Express 5 | Servidor HTTP e rotas |
| Prisma ORM 6 | Acesso ao banco de dados |
| SQLite | Banco de dados relacional local (arquivo) |
| dotenv | Carregamento de variáveis de ambiente |
| cors | Liberação de requisições do front-end ao servidor |
| HTML, CSS e JavaScript | Interface web, sem framework |
| nodemon | Reinício automático do servidor em desenvolvimento |

O projeto usa ES Modules (`"type": "module"` no `package.json`).

## Arquitetura e estrutura de diretórios

```
.
├── prisma/
│   └── schema.prisma            # Modelo de dados
├── src/
│   ├── backend/
│   │   ├── db.js                # Instância única do PrismaClient
│   │   ├── controllers/         # Funções auxiliares (fuso horário)
│   │   └── routers/
│   │       └── agendamentoRouter.js   # Rotas e regras de negócio
│   ├── database/                # Arquivo SQLite (não versionado)
│   └── frontend/
│       ├── view/                # Páginas HTML
│       ├── styles/              # CSS
│       ├── scripts/             # JavaScript do navegador
│       └── image/
├── .env.example                 # Modelo de variáveis de ambiente
├── server.js                    # Ponto de entrada do servidor
└── package.json
```

- O `server.js` registra o `cors`, o `express.json()` e o router de agendamentos **na raiz** (sem prefixo de rota) e escuta na porta **3000**.
- O Express **não serve** os arquivos do front-end. As páginas HTML precisam ser abertas por um servidor estático local, e o front-end chama a API em `http://localhost:3000`.
- As regras de negócio e a validação ficam no próprio router. Não há camada separada de repositório nem tratamento centralizado de erros.

## Regras de negócio

- `nomeBanda` deve ser um texto.
- `horaInicio`, `horaFim` e `valor` são obrigatórios.
- As datas devem ser válidas.
- O início deve ser **estritamente anterior** ao término.
- Dois agendamentos não podem ter períodos sobrepostos. Dois intervalos se sobrepõem quando **o início de um é anterior ao fim do outro e o fim de um é posterior ao início do outro**. Como as comparações são estritas, agendamentos consecutivos são permitidos: um ensaio que termina às 16h não conflita com outro que começa às 16h.
- O valor mínimo é **R$ 80,00**.
- O valor é recebido em reais e armazenado em **centavos** (inteiro) no campo `valor`.
- Na atualização, o próprio agendamento é ignorado na verificação de conflito.
- A listagem é ordenada por `horaInicio` em ordem crescente.
- Datas recebidas sem indicação de fuso são interpretadas como horário de Brasília (UTC-3).

## Documentação da API

URL base: `http://localhost:3000`. O recurso é `agendamento`. As respostas de erro seguem o formato `{ "error": "mensagem" }`.

### POST `/agendamento` — criar agendamento

Corpo (JSON):

| Campo | Tipo | Observação |
|---|---|---|
| `nomeBanda` | string | Obrigatório |
| `horaInicio` | string | Data e hora, por exemplo `2026-10-20T19:00` |
| `horaFim` | string | Deve ser posterior a `horaInicio` |
| `valor` | número ou string numérica | Em reais, mínimo 80. O valor `0` é tratado como ausente |

Ordem das validações: campos obrigatórios → tipo do nome → datas válidas → início anterior ao fim → conflito de horário → valor numérico → valor mínimo.

| Status | Significado |
|---|---|
| `201` | Agendamento criado. O corpo é um texto JSON: `"Agendamento concluído com sucesso!"` |
| `400` | Campo ausente, tipo inválido, data inválida, intervalo inválido ou valor inválido |
| `409` | Já existe um ensaio nesse horário |
| `500` | Erro interno |

### GET `/agendamento` — listar agendamentos

Retorna todos os registros, ordenados por `horaInicio` crescente, usando `findMany` do Prisma. A interface usa essa resposta para montar a tabela.

```json
[
  {
    "id": "6e1f3669-7f67-4ad1-9ff4-example",
    "nomeBanda": "Slip Knot",
    "horaInicio": "2026-10-20T22:00:00.000Z",
    "horaFim": "2026-10-20T23:00:00.000Z",
    "valor": 8000,
    "createdAt": "2026-10-13T17:27:05.000Z"
  }
]
```

`valor` vem em centavos. Em caso de falha na consulta, retorna `500`.

### GET `/agendamento/:id` — consultar um agendamento

Busca um registro por `id` (`findUnique`). A interface usa essa rota para preencher a barra lateral de detalhes e o formulário de edição.

| Status | Significado |
|---|---|
| `200` | Objeto do agendamento, no mesmo formato do exemplo acima |
| `404` | `{ "error": "Agendamento não Encontrado." }` |
| `500` | Erro interno |

### PATCH `/agendamento/:id` — atualizar agendamento

Edita um agendamento existente. Apesar do método PATCH, a implementação atual **exige todos os campos** (`nomeBanda`, `horaInicio`, `horaFim` e `valor`). Ela não aceita atualização parcial.

Etapas: verifica se o registro existe (`404`) → valida os campos (`400`) → verifica conflito ignorando o próprio registro (`409`) → valida e converte o valor (`400`) → atualiza.

Resposta de sucesso (`200`):

```json
{
  "agendamentoUpdated": {
    "id": "6e1f3669-7f67-4ad1-9ff4-example",
    "nomeBanda": "Slip Knot",
    "horaInicio": "2026-10-20T22:00:00.000Z",
    "horaFim": "2026-10-21T00:00:00.000Z",
    "valor": 9000,
    "createdAt": "2026-10-13T17:27:05.000Z"
  }
}
```

### DELETE `/agendamento` — excluir agendamentos

Remove um ou vários registros. Os identificadores vão **no corpo** da requisição, não na URL:

```json
{ "ids": ["id-1", "id-2"] }
```

- `ids` deve ser um array não vazio de strings; caso contrário, retorna `400`.
- A exclusão usa `deleteMany`. Identificadores inexistentes são ignorados, e a resposta informa quantos registros foram realmente removidos.

```json
{ "message": "Agendamentos Deletados com Sucesso.", "quantidade": 2 }
```

Se nenhum identificador existir, a resposta continua sendo `200`, com `quantidade: 0`. A rota não aplica nenhuma regra adicional, como impedir a exclusão de ensaios passados.

## Banco de dados

O banco é um arquivo SQLite, acessado pelo Prisma ORM. O Prisma gera um cliente tipado a partir do `schema.prisma` e traduz as operações da API (`create`, `findMany`, `findUnique`, `update`, `deleteMany`) em consultas SQL.

Modelo `Agendamento`:

| Campo | Tipo | Finalidade | Observações |
|---|---|---|---|
| `id` | `String` | Identificador | Chave primária, gerada com UUID |
| `nomeBanda` | `String` | Nome da banda | |
| `horaInicio` | `DateTime` | Início do ensaio | Possui índice |
| `horaFim` | `DateTime` | Término do ensaio | |
| `valor` | `Int` | Valor do ensaio | Em centavos |
| `createdAt` | `DateTime` | Data de criação | Padrão `now()` definido no schema |

O caminho do arquivo é definido pela variável `DATABASE_URL`. O modelo de configuração está em `.env.example`. O caminho é relativo à pasta `prisma/`.

## Instalação e execução local

**Pré-requisitos:** Node.js (versão LTS recomendada), npm e Git.

```bash
# 1. Clonar o repositório
git clone https://github.com/jjoaoSantosp/Estudio-Casa-2.git
cd Estudio-Casa-2

# 2. Instalar as dependências
npm install

# 3. Criar o arquivo de variáveis de ambiente
cp .env.example .env

# 4. Garantir que a pasta do banco exista
mkdir -p src/database

# 5. Criar o banco e gerar o Prisma Client
npx prisma db push

# 6. Iniciar o servidor
npm start          # ou: npm run dev (com nodemon)
```

O servidor ficará disponível em `http://localhost:3000`. A mensagem `Servidor rodando!` aparece no terminal.

**Interface:** abra `src/frontend/view/homeScreen.html` por meio de um servidor estático local (por exemplo, a extensão Live Server do VS Code), com o servidor da API em execução.

O arquivo `.env` não é versionado. O banco (`*.db`) também não.

## Exemplos de uso da API

Criar um agendamento:

```bash
curl -X POST http://localhost:3000/agendamento \
  -H "Content-Type: application/json" \
  -d '{"nomeBanda":"Slip Knot","horaInicio":"2026-10-20T19:00","horaFim":"2026-10-20T20:00","valor":80}'
```

Resposta (`201`): `"Agendamento concluído com sucesso!"`

Conflito de horário (`409`):

```json
{ "error": "Já existe um ensaio marcado nesse horário." }
```

Listar, consultar, atualizar e excluir:

```bash
curl http://localhost:3000/agendamento

curl http://localhost:3000/agendamento/ID_DO_AGENDAMENTO

curl -X PATCH http://localhost:3000/agendamento/ID_DO_AGENDAMENTO \
  -H "Content-Type: application/json" \
  -d '{"nomeBanda":"Slip Knot","horaInicio":"2026-10-20T20:00","horaFim":"2026-10-20T21:00","valor":90}'

curl -X DELETE http://localhost:3000/agendamento \
  -H "Content-Type: application/json" \
  -d '{"ids":["ID_DO_AGENDAMENTO"]}'
```

## Códigos HTTP e tratamento de erros

| Código | Quando ocorre |
|---|---|
| `200` | Consulta, atualização ou exclusão concluída |
| `201` | Agendamento criado |
| `400` | Dados ausentes ou inválidos |
| `404` | Agendamento não encontrado (consulta individual e PATCH) |
| `409` | Conflito de horário |
| `500` | Erro interno; o detalhe é registrado no console do servidor |

Cada rota trata seus erros com `try/catch`. Não há middleware global de erros.

## Limitações conhecidas

- **Sem autenticação.** Qualquer cliente que alcance a API pode ler, alterar e excluir dados.
- **Exposição na rede local.** O servidor escuta na porta 3000 sem restringir o endereço, e o CORS está liberado para qualquer origem. Outros dispositivos na mesma rede podem acessar a API.
- **Conflitos e concorrência.** A verificação de conflito e a criação do registro são duas operações separadas, sem transação. Para uso por uma única pessoa o risco é baixo, mas a ausência de conflitos não é garantida em requisições simultâneas.
- **Fuso horário fixo.** Datas sem fuso são interpretadas como UTC-3, e a interface exibe os horários no fuso do navegador.
- **Respostas sem padrão único.** O POST retorna um texto; o PATCH, um objeto com a chave `agendamentoUpdated`; o DELETE, `message` e `quantidade`.
- **PATCH não parcial.** Todos os campos precisam ser enviados.
- **Interface incompleta.** A exclusão pela tela e a atualização da tabela após a edição ainda estão em desenvolvimento.
- **Sem testes automatizados.**

## Melhorias futuras

- Concluir a exclusão em lote pela interface, com confirmação.
- Atualizar a tabela e exibir erros após a edição.
- Ordenação por colunas e filtro por data ou período.
- Tornar o PATCH realmente parcial.
- Validação monetária segura, sem multiplicação direta de decimais.
- Restringir o servidor a `127.0.0.1`.
- Testes automatizados das regras de negócio.
- Empacotamento como aplicativo desktop com Electron.
