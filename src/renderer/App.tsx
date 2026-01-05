/**
 * Componente Principal da Aplicação
 * Gerencia o estado global e orquestra os serviços
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Cabecalho, PainelLog, PainelStatus, ModalConfiguracoes } from './componentes'
import { useConfiguracoes } from './hooks/useConfiguracoes'
import { useLog } from './hooks/useLog'
import { servicoSupabase } from './servicos/supabase'
import { servicoImpressao } from './servicos/impressao'
import { StatusConexao, Pedido, ComandoImpressao } from './tipos'

export const App: React.FC = () => {
  const [statusConexao, setStatusConexao] = useState<StatusConexao>('desconectado')
  const [mensagemStatus, setMensagemStatus] = useState('Desconectado')
  const [versao, setVersao] = useState('1.0.0')
  const [modalConfigAberto, setModalConfigAberto] = useState(false)
  const [tamanhoFila, setTamanhoFila] = useState(0)

  const {
    configuracoes,
    impressorasDisponiveis,
    carregando,
    salvarConfiguracoes,
    recarregarImpressoras,
  } = useConfiguracoes()

  const { entradas, adicionarEntrada, limparLog } = useLog()

  // Callback para log do serviço de impressão
  const callbackLog = useCallback(
    (mensagem: string, tipo: 'info' | 'sucesso' | 'aviso' | 'erro') => {
      adicionarEntrada(mensagem, tipo)
      setTamanhoFila(servicoImpressao.obterTamanhoFila())
    },
    [adicionarEntrada]
  )

  // Callback para novos pedidos
  const aoReceberPedido = useCallback(
    (pedido: Pedido) => {
      const pedidoId = (pedido.id || '').slice(-6)
      adicionarEntrada(`📦 Novo pedido recebido: #${pedidoId}`, 'info')
      servicoImpressao.adicionarPedidoAutomatico(pedido)
    },
    [adicionarEntrada]
  )

  // Callback para comandos de impressão manual
  const aoReceberComando = useCallback(
    (comando: ComandoImpressao) => {
      const pedidoId = (comando.order_id || '').slice(-6)
      const tipo = comando.print_type === 'kitchen' ? 'Cozinha' : 'Cliente'
      adicionarEntrada(`🖨️ Impressão manual: #${pedidoId} (${tipo})`, 'info')
      servicoImpressao.adicionarComandoManual(comando.order_data, comando.print_type, comando.id)
    },
    [adicionarEntrada]
  )

  // Callback para mudança de status da conexão
  const aoMudarStatus = useCallback(
    (status: StatusConexao, mensagem: string) => {
      setStatusConexao(status)
      setMensagemStatus(mensagem)
      
      if (status === 'conectado') {
        adicionarEntrada('🟢 Conectado ao Supabase Realtime', 'sucesso')
      } else if (status === 'erro') {
        adicionarEntrada(`🔴 Erro de conexão: ${mensagem}`, 'erro')
      }
    },
    [adicionarEntrada]
  )

  // Inicialização
  useEffect(() => {
    const inicializar = async () => {
      // Obtém versão
      try {
        const v = await window.electronAPI.obterVersao()
        setVersao(v)
      } catch {
        console.warn('Não foi possível obter versão')
      }

      adicionarEntrada('🚀 Edienai Printer iniciado', 'info')
    }

    inicializar()
  }, [adicionarEntrada])

  // Inicializa serviços quando configurações carregam
  useEffect(() => {
    if (carregando) return

    // Inicializa serviço de impressão
    servicoImpressao.inicializar(configuracoes, callbackLog)

    // Inicia conexão com Supabase
    servicoSupabase.iniciar({
      aoReceberPedido,
      aoReceberComandoImpressao: aoReceberComando,
      aoMudarStatus,
    })

    adicionarEntrada('📡 Conectando ao servidor...', 'info')

    return () => {
      servicoSupabase.parar()
    }
  }, [carregando, configuracoes, callbackLog, aoReceberPedido, aoReceberComando, aoMudarStatus, adicionarEntrada])

  // Atualiza configurações no serviço de impressão
  useEffect(() => {
    if (!carregando) {
      servicoImpressao.atualizarConfiguracoes(configuracoes)
    }
  }, [configuracoes, carregando])

  // Atualiza tamanho da fila periodicamente
  useEffect(() => {
    const intervalo = setInterval(() => {
      setTamanhoFila(servicoImpressao.obterTamanhoFila())
    }, 1000)

    return () => clearInterval(intervalo)
  }, [])

  // Handler para salvar configurações
  const handleSalvarConfiguracoes = async (novasConfigs: Partial<typeof configuracoes>) => {
    const sucesso = await salvarConfiguracoes(novasConfigs)
    if (sucesso) {
      adicionarEntrada('⚙️ Configurações atualizadas', 'sucesso')
    }
    return sucesso
  }

  if (carregando) {
    return (
      <div className="flex h-screen items-center justify-center bg-edienai-fundo">
        <div className="text-center">
          <div className="mb-4 text-4xl animate-spin">🖨️</div>
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-edienai-fundo text-white">
      {/* Cabeçalho */}
      <Cabecalho
        status={statusConexao}
        mensagemStatus={mensagemStatus}
        versao={versao}
        aoClicarConfiguracoes={() => setModalConfigAberto(true)}
      />

      {/* Conteúdo Principal */}
      <main className="flex flex-1 gap-4 overflow-hidden p-4">
        {/* Painel de Status (Lateral) */}
        <aside className="w-64 flex-shrink-0">
          <PainelStatus
            configuracoes={configuracoes}
            tamanhoFila={tamanhoFila}
          />
        </aside>

        {/* Painel de Log (Principal) */}
        <div className="flex-1 overflow-hidden">
          <PainelLog entradas={entradas} aoLimpar={limparLog} />
        </div>
      </main>

      {/* Rodapé */}
      <footer className="border-t border-edienai-fundo-claro bg-edienai-fundo px-6 py-3">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Edienai Lanches © 2026</span>
          <span>
            Impressora: {configuracoes.nomeImpressora || 'Não configurada'} |
            Papel: {configuracoes.larguraPapel} |
            Texto: {configuracoes.tamanhoTexto}
          </span>
        </div>
      </footer>

      {/* Modal de Configurações */}
      <ModalConfiguracoes
        aberto={modalConfigAberto}
        configuracoes={configuracoes}
        impressorasDisponiveis={impressorasDisponiveis}
        aoFechar={() => setModalConfigAberto(false)}
        aoSalvar={handleSalvarConfiguracoes}
        aoRecarregarImpressoras={recarregarImpressoras}
      />
    </div>
  )
}
