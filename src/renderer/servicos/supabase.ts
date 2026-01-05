/**
 * Serviço de conexão com Supabase Realtime
 * Gerencia a conexão WebSocket e eventos de pedidos/impressões
 */

import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
import { Pedido, ComandoImpressao, StatusConexao } from '../tipos'

// Configurações do Supabase
const SUPABASE_URL = 'https://azqnyluvhgqxjrpxylne.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6cW55bHV2aGdxeGpycHh5bG5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NjkwNjgsImV4cCI6MjA3MjA0NTA2OH0.JRvPeHyg_UizADeuUFCCg6cbRVCit9GpPaCTwdY7iNA'

// Callbacks do serviço
export interface CallbacksSupabase {
  aoReceberPedido: (pedido: Pedido) => void
  aoReceberComandoImpressao: (comando: ComandoImpressao) => void
  aoMudarStatus: (status: StatusConexao, mensagem: string) => void
}

class ServicoSupabase {
  private cliente: SupabaseClient
  private canalPedidos: RealtimeChannel | null = null
  private canalComandos: RealtimeChannel | null = null
  private callbacks: CallbacksSupabase | null = null
  private pedidosProcessados: Set<string> = new Set()
  private comandosProcessados: Set<string> = new Set()
  private ativo: boolean = false

  constructor() {
    this.cliente = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  }

  /**
   * Inicia a conexão com o Supabase Realtime
   */
  iniciar(callbacks: CallbacksSupabase): void {
    if (this.ativo) {
      console.log('[SUPABASE] Já está ativo')
      return
    }

    this.callbacks = callbacks
    this.ativo = true
    this.callbacks.aoMudarStatus('conectando', 'Conectando ao Supabase...')

    this.inscreverNoPedidos()
    this.inscreverNosComandos()

    console.log('[SUPABASE] Serviço iniciado')
  }

  /**
   * Para a conexão com o Supabase
   */
  parar(): void {
    this.ativo = false

    if (this.canalPedidos) {
      this.cliente.removeChannel(this.canalPedidos)
      this.canalPedidos = null
    }

    if (this.canalComandos) {
      this.cliente.removeChannel(this.canalComandos)
      this.canalComandos = null
    }

    this.callbacks?.aoMudarStatus('desconectado', 'Desconectado')
    console.log('[SUPABASE] Serviço parado')
  }

  /**
   * Inscreve no canal de pedidos (INSERT automático)
   */
  private inscreverNoPedidos(): void {
    this.canalPedidos = this.cliente
      .channel('pedidos-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('[SUPABASE] Novo pedido recebido:', payload.new)
          this.processarNovoPedido(payload.new as Pedido)
        }
      )
      .subscribe((status) => {
        console.log('[SUPABASE] Status do canal de pedidos:', status)
        this.atualizarStatusConexao()
      })
  }

  /**
   * Inscreve no canal de comandos de impressão (INSERT manual)
   */
  private inscreverNosComandos(): void {
    this.canalComandos = this.cliente
      .channel('comandos-impressao-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'print_commands',
        },
        (payload) => {
          console.log('[SUPABASE] Comando de impressão recebido:', payload.new)
          this.processarComandoImpressao(payload.new as ComandoImpressao)
        }
      )
      .subscribe((status) => {
        console.log('[SUPABASE] Status do canal de comandos:', status)
        this.atualizarStatusConexao()
      })
  }

  /**
   * Atualiza o status da conexão baseado nos canais
   */
  private atualizarStatusConexao(): void {
    const pedidosOk = this.canalPedidos?.state === 'joined'
    const comandosOk = this.canalComandos?.state === 'joined'

    if (pedidosOk && comandosOk) {
      this.callbacks?.aoMudarStatus('conectado', 'Conectado - Aguardando pedidos')
    } else if (pedidosOk || comandosOk) {
      this.callbacks?.aoMudarStatus('conectando', 'Conectando canais...')
    }
  }

  /**
   * Processa um novo pedido recebido
   */
  private processarNovoPedido(pedido: Pedido): void {
    if (!pedido.id) {
      console.warn('[SUPABASE] Pedido sem ID, ignorando')
      return
    }

    if (this.pedidosProcessados.has(pedido.id)) {
      console.log('[SUPABASE] Pedido já processado:', pedido.id)
      return
    }

    this.pedidosProcessados.add(pedido.id)
    this.limitarSetProcessados(this.pedidosProcessados)

    // Formata o pedido para o padrão esperado
    const pedidoFormatado = this.formatarPedido(pedido)
    this.callbacks?.aoReceberPedido(pedidoFormatado)
  }

  /**
   * Processa um comando de impressão recebido
   */
  private processarComandoImpressao(comando: ComandoImpressao): void {
    if (!comando.id) {
      console.warn('[SUPABASE] Comando sem ID, ignorando')
      return
    }

    if (comando.status !== 'pending') {
      console.log('[SUPABASE] Comando não está pendente:', comando.id)
      return
    }

    if (this.comandosProcessados.has(comando.id)) {
      console.log('[SUPABASE] Comando já processado:', comando.id)
      return
    }

    this.comandosProcessados.add(comando.id)
    this.limitarSetProcessados(this.comandosProcessados)

    this.callbacks?.aoReceberComandoImpressao(comando)
  }

  /**
   * Formata o pedido do Supabase para o formato padrão
   */
  private formatarPedido(pedido: Pedido): Pedido {
    return {
      ...pedido,
      customerName: pedido.customer_name || pedido.customerName || 'Cliente',
      customerPhone: pedido.customer_phone || pedido.customerPhone || '',
      deliveryOption: pedido.delivery_option || pedido.deliveryOption,
      paymentMethod: pedido.payment_method || pedido.paymentMethod || 'N/A',
      trocoPara: pedido.troco_para || pedido.trocoPara,
      sentAt: pedido.sent_at || pedido.sentAt || pedido.created_at,
      createdAt: pedido.created_at || pedido.createdAt,
    }
  }

  /**
   * Limita o tamanho do set de IDs processados
   */
  private limitarSetProcessados(set: Set<string>, maxItens: number = 500): void {
    if (set.size > maxItens) {
      const itensParaRemover = Array.from(set).slice(0, 100)
      itensParaRemover.forEach((item) => set.delete(item))
    }
  }

  /**
   * Atualiza o status de um comando de impressão no banco
   */
  async atualizarStatusComando(
    comandoId: string,
    status: 'printed' | 'error',
    mensagemErro?: string
  ): Promise<void> {
    try {
      const atualizacao: Record<string, unknown> = {
        status,
        processed_at: new Date().toISOString(),
      }

      if (mensagemErro) {
        atualizacao.error_message = mensagemErro
      }

      const { error } = await this.cliente
        .from('print_commands')
        .update(atualizacao)
        .eq('id', comandoId)

      if (error) {
        console.error('[SUPABASE] Erro ao atualizar comando:', error)
      } else {
        console.log('[SUPABASE] Comando atualizado:', comandoId, status)
      }
    } catch (erro) {
      console.error('[SUPABASE] Exceção ao atualizar comando:', erro)
    }
  }
}

// Exporta instância única (singleton)
export const servicoSupabase = new ServicoSupabase()
