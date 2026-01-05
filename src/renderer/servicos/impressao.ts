/**
 * Serviço de Impressão
 * Gerencia a fila de impressão e geração de recibos HTML
 */

import { Pedido, ItemPedido, TipoImpressao, ConfiguracoesApp, DadosEdicao } from '../tipos'
import { gerarHtmlRecibo, gerarHtmlReciboEdicao } from '../utils/geradorRecibo'

// Callback para log
export type CallbackLog = (mensagem: string, tipo: 'info' | 'sucesso' | 'aviso' | 'erro') => void

// Item na fila de impressão
interface ItemFila {
  id: string
  pedido: Pedido
  tipo: TipoImpressao
  dadosEdicao?: DadosEdicao
  tentativas: number
  timestamp: number
}

class ServicoImpressao {
  private fila: ItemFila[] = []
  private processando: boolean = false
  private configuracoes: ConfiguracoesApp | null = null
  private callbackLog: CallbackLog | null = null
  private itensImpressos: Map<string, ItemPedido[]> = new Map()

  /**
   * Inicializa o serviço com as configurações
   */
  inicializar(configuracoes: ConfiguracoesApp, callbackLog: CallbackLog): void {
    this.configuracoes = configuracoes
    this.callbackLog = callbackLog
    console.log('[IMPRESSAO] Serviço inicializado')
  }

  /**
   * Atualiza as configurações
   */
  atualizarConfiguracoes(configuracoes: ConfiguracoesApp): void {
    this.configuracoes = configuracoes
  }

  /**
   * Adiciona um pedido à fila para impressão automática
   */
  adicionarPedidoAutomatico(pedido: Pedido): void {
    if (!this.configuracoes) {
      console.warn('[IMPRESSAO] Configurações não carregadas')
      return
    }

    const pedidoId = pedido.id || pedido.orderId || 'desconhecido'
    const pedidoIdCurto = pedidoId.slice(-6)

    // Verifica se já foi impresso antes (edição)
    const itensAnteriores = this.itensImpressos.get(pedidoId)
    
    if (itensAnteriores) {
      // É uma edição - identifica itens novos
      const itensNovos = this.identificarItensNovos(itensAnteriores, pedido.items)
      
      if (itensNovos.length === 0) {
        this.log(`⚠️ Pedido #${pedidoIdCurto} sem itens novos para imprimir`, 'aviso')
        return
      }

      const dadosEdicao: DadosEdicao = {
        pedidoOriginalId: pedidoId,
        itensAdicionados: itensNovos,
        totalAdicional: itensNovos.reduce((acc, item) => acc + (item.totalItemPrice || 0), 0),
        editadoPor: this.obterUltimoEditor(itensNovos),
      }

      this.log(`📝 Pedido #${pedidoIdCurto} EDITADO - ${itensNovos.length} item(ns) novo(s)`, 'info')

      // Imprime apenas cozinha para edições
      if (this.configuracoes.imprimirCozinhaAutomatico) {
        this.adicionarNaFila(pedido, 'cozinha', dadosEdicao)
      }
    } else {
      // Pedido novo - impressão completa
      this.log(`📦 Novo pedido #${pedidoIdCurto} - ${pedido.customerName || 'Cliente'}`, 'info')

      if (this.configuracoes.imprimirClienteAutomatico) {
        this.adicionarNaFila(pedido, 'cliente')
      }

      if (this.configuracoes.imprimirCozinhaAutomatico) {
        this.adicionarNaFila(pedido, 'cozinha')
      }
    }

    // Armazena os itens atuais para detectar edições futuras
    this.itensImpressos.set(pedidoId, [...pedido.items])
    this.limitarCacheItens()
  }

  /**
   * Adiciona um comando manual de impressão à fila
   */
  adicionarComandoManual(pedido: Pedido, tipo: 'client' | 'kitchen', comandoId: string): void {
    const tipoImpressao: TipoImpressao = tipo === 'kitchen' ? 'cozinha' : 'cliente'
    const pedidoId = pedido.id || pedido.orderId || 'desconhecido'
    const pedidoIdCurto = pedidoId.slice(-6)

    this.log(`🖨️ Impressão manual (${tipoImpressao}) - Pedido #${pedidoIdCurto}`, 'info')
    this.adicionarNaFila(pedido, tipoImpressao, undefined, comandoId)
  }

  /**
   * Adiciona item na fila de impressão
   */
  private adicionarNaFila(
    pedido: Pedido,
    tipo: TipoImpressao,
    dadosEdicao?: DadosEdicao,
    comandoId?: string
  ): void {
    const id = comandoId || `${pedido.id}_${tipo}_${Date.now()}`

    this.fila.push({
      id,
      pedido,
      tipo,
      dadosEdicao,
      tentativas: 0,
      timestamp: Date.now(),
    })

    console.log(`[IMPRESSAO] Adicionado à fila: ${id} (tamanho: ${this.fila.length})`)
    this.processarFila()
  }

  /**
   * Processa a fila de impressão
   */
  private async processarFila(): Promise<void> {
    if (this.processando || this.fila.length === 0) {
      return
    }

    this.processando = true

    while (this.fila.length > 0) {
      const item = this.fila.shift()
      if (!item) continue

      try {
        await this.imprimirItem(item)
      } catch (erro) {
        console.error('[IMPRESSAO] Erro ao imprimir:', erro)
        
        // Retentar até 3 vezes
        if (item.tentativas < 3) {
          item.tentativas++
          this.fila.unshift(item)
          await this.aguardar(1000 * item.tentativas)
        } else {
          this.log(`❌ Falha após 3 tentativas: ${item.id}`, 'erro')
        }
      }
    }

    this.processando = false
  }

  /**
   * Imprime um item da fila
   */
  private async imprimirItem(item: ItemFila): Promise<void> {
    const pedidoIdCurto = (item.pedido.id || '').slice(-6)
    const tipoLabel = item.tipo === 'cozinha' ? 'Cozinha' : 'Cliente'

    // Gera o HTML do recibo
    let htmlRecibo: string

    if (item.dadosEdicao) {
      htmlRecibo = gerarHtmlReciboEdicao(item.pedido, item.dadosEdicao, this.configuracoes!)
    } else {
      htmlRecibo = gerarHtmlRecibo(item.pedido, item.tipo, this.configuracoes!)
    }

    // Envia para impressão via Electron
    const resultado = await window.electronAPI.imprimirSilencioso(
      htmlRecibo,
      this.configuracoes?.nomeImpressora
    )

    if (resultado.sucesso) {
      this.log(`✅ Impresso: #${pedidoIdCurto} (${tipoLabel})`, 'sucesso')
    } else {
      throw new Error(resultado.erro || 'Falha desconhecida')
    }
  }

  /**
   * Identifica itens novos comparando com itens anteriores
   */
  private identificarItensNovos(itensAnteriores: ItemPedido[], itensAtuais: ItemPedido[]): ItemPedido[] {
    const itensNovos: ItemPedido[] = []

    // Cria mapa de contagem dos itens anteriores
    const contagemAnterior = new Map<string, number>()
    itensAnteriores.forEach((item) => {
      const chave = this.gerarChaveItem(item)
      contagemAnterior.set(chave, (contagemAnterior.get(chave) || 0) + (item.quantity || item.quantidade || 1))
    })

    // Compara com itens atuais
    itensAtuais.forEach((item) => {
      const chave = this.gerarChaveItem(item)
      const quantidadeAnterior = contagemAnterior.get(chave) || 0
      const quantidadeAtual = item.quantity || item.quantidade || 1

      if (quantidadeAtual > quantidadeAnterior) {
        // Item novo ou quantidade aumentou
        itensNovos.push({
          ...item,
          quantity: quantidadeAtual - quantidadeAnterior,
          quantidade: quantidadeAtual - quantidadeAnterior,
        })
      }
    })

    return itensNovos
  }

  /**
   * Gera chave única para identificar um item
   */
  private gerarChaveItem(item: ItemPedido): string {
    const nome = item.name || item.nome || ''
    const preco = item.basePrice || item.preco || 0
    const complementos = (item.complements || item.complementos || [])
      .map((c) => c.name)
      .sort()
      .join(',')
    
    return `${nome}|${preco}|${complementos}`
  }

  /**
   * Obtém o nome do último editor do pedido
   */
  private obterUltimoEditor(itens: ItemPedido[]): string | undefined {
    for (let i = itens.length - 1; i >= 0; i--) {
      if (itens[i].adicionado_por) {
        return itens[i].adicionado_por
      }
    }
    return undefined
  }

  /**
   * Limita o cache de itens impressos
   */
  private limitarCacheItens(): void {
    if (this.itensImpressos.size > 200) {
      const chaves = Array.from(this.itensImpressos.keys())
      chaves.slice(0, 50).forEach((chave) => this.itensImpressos.delete(chave))
    }
  }

  /**
   * Função auxiliar de log
   */
  private log(mensagem: string, tipo: 'info' | 'sucesso' | 'aviso' | 'erro'): void {
    console.log(`[IMPRESSAO] ${mensagem}`)
    this.callbackLog?.(mensagem, tipo)
  }

  /**
   * Aguarda um tempo em ms
   */
  private aguardar(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Retorna o tamanho atual da fila
   */
  obterTamanhoFila(): number {
    return this.fila.length
  }
}

// Exporta instância única (singleton)
export const servicoImpressao = new ServicoImpressao()
