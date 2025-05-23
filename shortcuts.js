

// Dados em uma constante
const SHORTCUTS_BLOCOS = [
  {
    titulo: "Cadastrar plano com categoria simples",
    passos: [
      { texto: "Acessar → Categoria (PL020)" },
      { texto: "Acessar Ações e planos (PL001) → Criar um registro" },
      { texto: "No Gantt, inserir algumas ações" }
    ]
  },
  {
    titulo: "Configurar processo com integração ao plano de ação",
    passos: [
      { texto: "Acessar Processo (PM063) → Criar um processo" },
      { texto: "Em automação → Componente: Workflow, Objeto: Problema" },
      { texto: "Salvar e sair" },
      { texto: "Criar um Inicio, uma atividade e um finalizador" },
      { texto: "Nos dados da atividade → Configuração → Execução" },
      { texto: "Marcar a flag 'Plano e ação isolada'" },
      { texto: "Em atributo → Associar o atributo criado anteriormente" },
      { texto: "Salvar e sair, e homologar o processo" }
    ]
  },
    {
    titulo: "Emissão de solicitação",
    passos: [
      { texto: "Acessar → Tipo de solicitação (SR016) → Criar um tipo" },
      { texto: "Em componente: [preencher_componente] e Operação: [preencher_operacao]" },
      { texto: "Acessar Emissão de solicitação (SR003) e emitir uma solicitação com o tipo criado" }
    ]
  },
]
;

// Exportador global
window.getBlocosDePassos = function () {
  return SHORTCUTS_BLOCOS;
};

// Adicionar shortcuts mais usados
const SUGEST_AUTO_COMPLETE = [
  // Geral
  { id: "PL001", name: "Ações e planos", categoria: "Geral" },
  { id: "PL020", name: "Categoria", categoria: "Geral" },

  // Cadastro
  { id: "PL002", name: "Modelo", categoria: "Cadastro" },
  { id: "PL021", name: "Parâmetros gerais", categoria: "Cadastro" },
  { id: "PM063", name: "Processo", categoria: "Processos" },

  // Consulta
  { id: "PL026", name: "Tarefas", categoria: "Consulta" },
  { id: "PL027", name: "Histórico de ações", categoria: "Consulta" },
  { id: "SR008", name: "Solicitação", categoria: "Consulta" },
  { id: "SR019", name: "Tarefas", categoria: "Consulta" },

  // Execução
  { id: "PL009", name: "Execução de ação", categoria: "Execução" },
  { id: "PL010", name: "Acompanhamento de processo", categoria: "Execução" },
  { id: "SR005", name: "Acompanhamento de solicitação", categoria: "Execução" },
  { id: "SR004", name: "Aprovação de solicitação", categoria: "Execução" },
  { id: "SR007", name: "Eliminação de solicitação", categoria: "Execução" },
  { id: "SR003", name: "Emissão de solicitação", categoria: "Execução" },
  { id: "SR006", name: "Encerramento de solicitação", categoria: "Execução" },
];

window.getSugestoesAutoComplete = function () {
  return SUGEST_AUTO_COMPLETE;
};