
export enum StatusCliente {
  EM_PROJETO = 'Em Projeto',
  EM_HOMOLOGACAO = 'Em Homologação',
  AGUARDANDO_VISTORIA = 'Aguardando Vistoria',
  CONCLUIDO = 'Concluído'
}

export enum StatusServico {
  ORCAMENTO = 'orcamento',
  APROVADO = 'aprovado',
  EM_ANDAMENTO = 'em_andamento',
  CONCLUIDO = 'concluido',
  PAGO = 'pago',
  CANCELADO = 'cancelado'
}

export interface Anexo {
  id: string;
  nome: string;
  tipo: string;
  tamanho: number;
  dataUpload: string;
  dados: string; // Base64
}

export interface Cliente {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  ponto_referencia?: string;
  
  // Dados Técnicos / Instalação
  unidade_consumidora: string;
  concessionaria: string;
  disjuntor_padrao: string;
  tipo_sistema: string;
  // Novos campos UTM
  utm_norte: string;   // Latitude UTM (Northing)
  utm_leste: string;   // Longitude UTM (Easting)
  utm_zona: string;    // Zona UTM (ex: 22J)

  tempo_projeto: number;
  data_entrada_homologacao: string;
  data_resposta_concessionaria: string;
  data_vistoria: string;
  status: string;
  data_cadastro: string;
  
  // Histórico de datas para cada etapa do fluxo
  datas_etapas?: Record<string, string>;
  
  // Documentação
  doc_identificacao_status: string;
  conta_energia_status: string;
  procuracao_status: string;
  outras_imagens_status: string;
  
  // Anexos
  anexos_identificacao: Anexo[];
  anexos_conta: Anexo[];
  anexos_procuracao: Anexo[];
  anexos_outras_imagens: Anexo[];
}

export interface Servico {
  id: string;
  cliente_id: string;
  cliente_nome: string;
  tipo_servico: string;
  descricao: string;
  valor: number;
  status: StatusServico;
  forma_pagamento: string;
  data_servico: string;
  data_vencimento: string;
  data_pagamento: string;
  data_cadastro: string;
}

export interface Despesa {
  id: string;
  data_despesa: string;
  categoria: string;
  descricao: string;
  valor: number;
  forma_pagamento: string;
  observacoes: string;
  data_cadastro: string;
}

export interface FinanceSummary {
  recebido: number;
  pendente: number;
  atrasado: number;
  vencendo: number;
  faturado: number;
  despesas: number;
  lucro: number;
  ativos: number;
  qtdAtraso: number;
  qtdVencendo: number;
}