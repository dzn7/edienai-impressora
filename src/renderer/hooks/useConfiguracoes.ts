/**
 * Hook para gerenciar configurações da aplicação
 */

import { useState, useEffect, useCallback } from 'react'
import { ConfiguracoesApp, InfoImpressora } from '../tipos'

const CONFIG_PADRAO: ConfiguracoesApp = {
  nomeImpressora: '',
  larguraPapel: '80mm',
  tamanhoTexto: 'extra',
  imprimirClienteAutomatico: true,
  imprimirCozinhaAutomatico: true,
  espacamentoLinhas: 8,
}

interface RetornoHook {
  configuracoes: ConfiguracoesApp
  impressorasDisponiveis: InfoImpressora[]
  carregando: boolean
  erro: string | null
  salvarConfiguracoes: (novasConfigs: Partial<ConfiguracoesApp>) => Promise<boolean>
  recarregarImpressoras: () => Promise<void>
}

export function useConfiguracoes(): RetornoHook {
  const [configuracoes, setConfiguracoes] = useState<ConfiguracoesApp>(CONFIG_PADRAO)
  const [impressorasDisponiveis, setImpressorasDisponiveis] = useState<InfoImpressora[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  // Carrega configurações iniciais
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setCarregando(true)
        setErro(null)

        // Carrega configurações
        const configsSalvas = await window.electronAPI.obterConfiguracoes()
        setConfiguracoes({ ...CONFIG_PADRAO, ...configsSalvas })

        // Carrega impressoras
        const impressoras = await window.electronAPI.obterImpressoras()
        setImpressorasDisponiveis(impressoras as InfoImpressora[])

        // Se não tem impressora selecionada, usa a padrão
        if (!configsSalvas.nomeImpressora && impressoras.length > 0) {
          const impressoraPadrao = impressoras.find((p) => p.isDefault)
          if (impressoraPadrao) {
            await window.electronAPI.salvarConfiguracoes({ nomeImpressora: impressoraPadrao.name })
            setConfiguracoes((prev) => ({ ...prev, nomeImpressora: impressoraPadrao.name }))
          }
        }
      } catch (e) {
        console.error('[CONFIG] Erro ao carregar:', e)
        setErro('Erro ao carregar configurações')
      } finally {
        setCarregando(false)
      }
    }

    carregarDados()
  }, [])

  // Salva configurações
  const salvarConfiguracoes = useCallback(async (novasConfigs: Partial<ConfiguracoesApp>): Promise<boolean> => {
    try {
      const sucesso = await window.electronAPI.salvarConfiguracoes(novasConfigs)
      
      if (sucesso) {
        setConfiguracoes((prev) => ({ ...prev, ...novasConfigs }))
      }
      
      return sucesso
    } catch (e) {
      console.error('[CONFIG] Erro ao salvar:', e)
      return false
    }
  }, [])

  // Recarrega lista de impressoras
  const recarregarImpressoras = useCallback(async () => {
    try {
      const impressoras = await window.electronAPI.obterImpressoras()
      setImpressorasDisponiveis(impressoras as InfoImpressora[])
    } catch (e) {
      console.error('[CONFIG] Erro ao recarregar impressoras:', e)
    }
  }, [])

  return {
    configuracoes,
    impressorasDisponiveis,
    carregando,
    erro,
    salvarConfiguracoes,
    recarregarImpressoras,
  }
}
