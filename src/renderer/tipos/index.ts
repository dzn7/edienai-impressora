/**
 * Tipos compartilhados da aplicação Edienai Printer
 */

// Configurações da aplicação
export interface ConfiguracoesApp {
  nomeImpressora: string
  larguraPapel: '58mm' | '72mm' | '80mm'
  tamanhoTexto: 'pequeno' | 'normal' | 'grande' | 'extra'
  imprimirClienteAutomatico: boolean
  imprimirCozinhaAutomatico: boolean
  espacamentoLinhas: number
}

// Opção de entrega do pedido
export interface OpcaoEntrega {
  type: 'Entrega' | 'Retirada' | 'No Local'
  address?: string
  location?: string
  tableNumber?: string | number
  localEstabelecimento?: string
  fee?: number
}

// Complemento de item
export interface Complemento {
  name: string
  price?: number
}

// Item do pedido
export interface ItemPedido {
  name: string
  nome?: string
  quantity: number
  quantidade?: number
  basePrice: number
  preco?: number
  totalItemPrice: number
  unitPriceWithComplements: number
  complements?: Complemento[]
  complementos?: Complemento[]
  notes?: string
  observations?: string
  observacao?: string
  productId?: string
  adicionado_em?: string
  adicionado_por?: string
}

// Pedido completo
export interface Pedido {
  id: string
  orderId?: string
  firebase_id?: string
  customer_name?: string
  customerName?: string
  customer_phone?: string
  customerPhone?: string
  items: ItemPedido[]
  total: number | string
  status: string
  delivery_option?: OpcaoEntrega
  deliveryOption?: OpcaoEntrega
  payment_method?: string
  paymentMethod?: string
  troco_para?: number
  trocoPara?: number
  notes?: string
  created_at?: string
  createdAt?: string
  sent_at?: string
  sentAt?: string
  created_by_waiter?: string
  table_id?: string
}

// Comando de impressão
export interface ComandoImpressao {
  id: string
  order_id: string
  print_type: 'client' | 'kitchen'
  order_data: Pedido
  status: 'pending' | 'printed' | 'error'
  created_at: string
  processed_at?: string
  error_message?: string
}

// Tipo de impressão
export type TipoImpressao = 'cliente' | 'cozinha'

// Status da conexão
export type StatusConexao = 'conectando' | 'conectado' | 'desconectado' | 'erro'

// Entrada no log
export interface EntradaLog {
  id: string
  timestamp: Date
  mensagem: string
  tipo: 'info' | 'sucesso' | 'aviso' | 'erro'
}

// Resultado da impressão
export interface ResultadoImpressao {
  sucesso: boolean
  erro?: string
}

// Informação da impressora
export interface InfoImpressora {
  name: string
  displayName: string
  description: string
  status: number
  isDefault: boolean
}

// Dados para impressão de edição (apenas itens novos)
export interface DadosEdicao {
  pedidoOriginalId: string
  itensAdicionados: ItemPedido[]
  totalAdicional: number
  editadoPor?: string
}

// API do Electron exposta via preload
export interface ElectronAPI {
  obterImpressoras: () => Promise<InfoImpressora[]>
  imprimirSilencioso: (conteudoHtml: string, nomeImpressora?: string) => Promise<ResultadoImpressao>
  obterConfiguracoes: () => Promise<ConfiguracoesApp>
  salvarConfiguracoes: (config: Partial<ConfiguracoesApp>) => Promise<boolean>
  obterVersao: () => Promise<string>
  plataforma: string
}

// Declaração global para o window
declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
