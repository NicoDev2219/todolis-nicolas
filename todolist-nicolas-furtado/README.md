# TodoList API

Projeto de backend para gerenciamento de tarefas, desenvolvido com **Node.js, Fastify e MySQL**.

**Aluno:** Nicolas Furtado

## Funcionalidades

- cadastrar tarefas;
- listar e pesquisar tarefas;
- filtrar tarefas pendentes ou concluídas;
- alterar título, prazo e situação;
- remover tarefas;
- consultar um resumo com total, concluídas e pendentes.

## Como executar

1. Entre na pasta `backend`.
2. Execute `npm install`.
3. Configure o MySQL, se necessário, usando as variáveis de ambiente esperadas em `src/db.js`.
4. Execute `npm run dev` ou `npm start`.
5. A API ficará disponível, por padrão, em `http://localhost:3333`.

Os exemplos de requisição estão no arquivo `backend/rotas.http`.
