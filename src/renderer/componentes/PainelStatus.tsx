/**
 * Componente Painel de Status
 * Exibe informações sobre a impressora e configurações atuais
 */

import React from 'react'
import { ConfiguracoesApp } from '../tipos'

interface PropsPainelStatus {
  configuracoes: ConfiguracoesApp
  tamanhoFila: number
}

export const PainelStatus: React.FC<PropsPainelStatus> = ({
  configuracoes,
  tamanhoFila,
}) => {
  return (
    <div className="rounded-lg bg-edienai-fundo-card p-4">
      <h2 className="mb-4 text-sm font-semibold text-gray-400">
        📊 Status do Sistema
      </h2>

      <div className="space-y-3">
        {/* Impressora */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Impressora:</span>
          <span className="text-sm font-medium text-white">
            {configuracoes.nomeImpressora || 'Não configurada'}
          </span>
        </div>

        {/* Papel */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Papel:</span>
          <span className="text-sm font-medium text-white">
            {configuracoes.larguraPapel}
          </span>
        </div>

        {/* Fila de Impressão */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Fila:</span>
          <span
            className={`text-sm font-medium ${
              tamanhoFila > 0 ? 'text-edienai-amarelo' : 'text-green-400'
            }`}
          >
            {tamanhoFila > 0 ? `${tamanhoFila} pendente(s)` : 'Vazia'}
          </span>
        </div>

        {/* Separador */}
        <div className="border-t border-edienai-fundo-claro pt-3">
          <div className="text-xs text-gray-500">Impressão Automática:</div>
          
          <div className="mt-2 flex gap-2">
            <span
              className={`rounded px-2 py-1 text-xs ${
                configuracoes.imprimirClienteAutomatico
                  ? 'bg-edienai-amarelo/20 text-edienai-amarelo'
                  : 'bg-gray-700 text-gray-500'
              }`}
            >
              Cliente {configuracoes.imprimirClienteAutomatico ? '✓' : '✕'}
            </span>
            
            <span
              className={`rounded px-2 py-1 text-xs ${
                configuracoes.imprimirCozinhaAutomatico
                  ? 'bg-edienai-vermelho/20 text-edienai-vermelho'
                  : 'bg-gray-700 text-gray-500'
              }`}
            >
              Cozinha {configuracoes.imprimirCozinhaAutomatico ? '✓' : '✕'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
