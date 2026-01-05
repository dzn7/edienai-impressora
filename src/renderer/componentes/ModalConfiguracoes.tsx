/**
 * Componente Modal de Configurações
 * Permite configurar impressora, papel e opções de impressão automática
 */

import React, { useState, useEffect } from 'react'
import { ConfiguracoesApp, InfoImpressora } from '../tipos'

interface PropsModal {
  aberto: boolean
  configuracoes: ConfiguracoesApp
  impressorasDisponiveis: InfoImpressora[]
  aoFechar: () => void
  aoSalvar: (config: Partial<ConfiguracoesApp>) => Promise<boolean>
  aoRecarregarImpressoras: () => Promise<void>
}

export const ModalConfiguracoes: React.FC<PropsModal> = ({
  aberto,
  configuracoes,
  impressorasDisponiveis,
  aoFechar,
  aoSalvar,
  aoRecarregarImpressoras,
}) => {
  const [configLocal, setConfigLocal] = useState<ConfiguracoesApp>(configuracoes)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)

  useEffect(() => {
    setConfigLocal(configuracoes)
    setMensagem(null)
  }, [configuracoes, aberto])

  const handleSalvar = async () => {
    setSalvando(true)
    setMensagem(null)

    try {
      const sucesso = await aoSalvar(configLocal)
      
      if (sucesso) {
        setMensagem({ tipo: 'sucesso', texto: 'Configurações salvas com sucesso!' })
        setTimeout(() => {
          aoFechar()
        }, 1000)
      } else {
        setMensagem({ tipo: 'erro', texto: 'Erro ao salvar configurações' })
      }
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Erro inesperado ao salvar' })
    } finally {
      setSalvando(false)
    }
  }

  if (!aberto) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-lg rounded-xl bg-edienai-fundo p-6 shadow-2xl">
        {/* Cabeçalho */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-edienai-amarelo">
            ⚙️ Configurações
          </h2>
          <button
            onClick={aoFechar}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-edienai-fundo-claro hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Seção: Impressora */}
        <div className="mb-6 rounded-lg bg-edienai-fundo-claro p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-400">IMPRESSORA</h3>
            <button
              onClick={aoRecarregarImpressoras}
              className="text-xs text-edienai-amarelo hover:underline"
            >
              🔄 Atualizar lista
            </button>
          </div>
          
          <select
            value={configLocal.nomeImpressora}
            onChange={(e) => setConfigLocal({ ...configLocal, nomeImpressora: e.target.value })}
            className="w-full rounded-lg bg-edienai-fundo-card px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-edienai-amarelo"
          >
            <option value="">Selecione uma impressora...</option>
            {impressorasDisponiveis.map((impressora) => (
              <option key={impressora.name} value={impressora.name}>
                {impressora.displayName || impressora.name}
                {impressora.isDefault ? ' (Padrão)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Seção: Papel e Texto */}
        <div className="mb-6 rounded-lg bg-edienai-fundo-claro p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-400">
            PAPEL E TEXTO
          </h3>
          
          <div className="mb-4">
            <label className="mb-2 block text-sm text-gray-300">
              Largura do papel
            </label>
            <div className="flex gap-2">
              {(['58mm', '72mm', '80mm'] as const).map((largura) => (
                <button
                  key={largura}
                  onClick={() => setConfigLocal({ ...configLocal, larguraPapel: largura })}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    configLocal.larguraPapel === largura
                      ? 'bg-edienai-amarelo text-black'
                      : 'bg-edienai-fundo-card text-gray-300 hover:bg-edienai-fundo'
                  }`}
                >
                  {largura}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-300">
              Tamanho do texto
            </label>
            <div className="flex gap-2">
              {(['pequeno', 'normal', 'grande', 'extra'] as const).map((tamanho) => (
                <button
                  key={tamanho}
                  onClick={() => setConfigLocal({ ...configLocal, tamanhoTexto: tamanho })}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium capitalize transition-colors ${
                    configLocal.tamanhoTexto === tamanho
                      ? 'bg-edienai-amarelo text-black'
                      : 'bg-edienai-fundo-card text-gray-300 hover:bg-edienai-fundo'
                  }`}
                >
                  {tamanho}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Seção: Impressão Automática */}
        <div className="mb-6 rounded-lg bg-edienai-fundo-claro p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-400">
            IMPRESSÃO AUTOMÁTICA
          </h3>
          
          <div className="space-y-3">
            <label className="flex cursor-pointer items-center justify-between">
              <span className="text-gray-300">Imprimir via do CLIENTE</span>
              <div
                onClick={() =>
                  setConfigLocal({
                    ...configLocal,
                    imprimirClienteAutomatico: !configLocal.imprimirClienteAutomatico,
                  })
                }
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  configLocal.imprimirClienteAutomatico
                    ? 'bg-edienai-amarelo'
                    : 'bg-gray-600'
                }`}
              >
                <div
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    configLocal.imprimirClienteAutomatico
                      ? 'translate-x-5'
                      : 'translate-x-0.5'
                  }`}
                />
              </div>
            </label>

            <label className="flex cursor-pointer items-center justify-between">
              <span className="text-gray-300">Imprimir via da COZINHA</span>
              <div
                onClick={() =>
                  setConfigLocal({
                    ...configLocal,
                    imprimirCozinhaAutomatico: !configLocal.imprimirCozinhaAutomatico,
                  })
                }
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  configLocal.imprimirCozinhaAutomatico
                    ? 'bg-edienai-vermelho'
                    : 'bg-gray-600'
                }`}
              >
                <div
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    configLocal.imprimirCozinhaAutomatico
                      ? 'translate-x-5'
                      : 'translate-x-0.5'
                  }`}
                />
              </div>
            </label>
          </div>
        </div>

        {/* Mensagem de feedback */}
        {mensagem && (
          <div
            className={`mb-4 rounded-lg p-3 text-center text-sm ${
              mensagem.tipo === 'sucesso'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {mensagem.texto}
          </div>
        )}

        {/* Botões */}
        <div className="flex gap-3">
          <button
            onClick={handleSalvar}
            disabled={salvando}
            className="flex-1 rounded-lg bg-edienai-amarelo py-3 font-bold text-black transition-colors hover:bg-edienai-amarelo-escuro disabled:opacity-50"
          >
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
          <button
            onClick={aoFechar}
            className="flex-1 rounded-lg bg-edienai-fundo-claro py-3 font-medium text-gray-300 transition-colors hover:bg-edienai-fundo-card"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
