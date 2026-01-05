/**
 * Componente Painel de Log
 * Exibe o histórico de atividades e eventos de impressão
 */

import React, { useRef, useEffect } from 'react'
import { EntradaLog } from '../tipos'

interface PropsPainelLog {
  entradas: EntradaLog[]
  aoLimpar: () => void
}

export const PainelLog: React.FC<PropsPainelLog> = ({ entradas, aoLimpar }) => {
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll para a última entrada
  useEffect(() => {
    if (containerRef.current && entradas.length > 0) {
      containerRef.current.scrollTop = 0
    }
  }, [entradas])

  const obterCorTipo = (tipo: EntradaLog['tipo']): string => {
    switch (tipo) {
      case 'sucesso':
        return 'text-green-400'
      case 'erro':
        return 'text-red-400'
      case 'aviso':
        return 'text-yellow-400'
      default:
        return 'text-cyan-400'
    }
  }

  const obterIconeTipo = (tipo: EntradaLog['tipo']): string => {
    switch (tipo) {
      case 'sucesso':
        return '✓'
      case 'erro':
        return '✕'
      case 'aviso':
        return '⚠'
      default:
        return '→'
    }
  }

  const formatarHora = (data: Date): string => {
    return data.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className="flex h-full flex-col rounded-lg bg-edienai-fundo-card">
      {/* Cabeçalho do Painel */}
      <div className="flex items-center justify-between border-b border-edienai-fundo-claro px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-400">
          📋 Log de Atividades
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {entradas.length} registro(s)
          </span>
          {entradas.length > 0 && (
            <button
              onClick={aoLimpar}
              className="rounded px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-edienai-fundo-claro hover:text-white"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Lista de Entradas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm"
      >
        {entradas.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="mb-2 text-4xl">🖨️</div>
              <p>Aguardando atividades...</p>
              <p className="mt-1 text-xs">
                Os eventos de impressão aparecerão aqui
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {entradas.map((entrada) => (
              <div
                key={entrada.id}
                className="flex items-start gap-2 rounded px-2 py-1 transition-colors hover:bg-edienai-fundo-claro/50"
              >
                <span className="text-gray-500 flex-shrink-0">
                  [{formatarHora(entrada.timestamp)}]
                </span>
                <span className={`flex-shrink-0 ${obterCorTipo(entrada.tipo)}`}>
                  {obterIconeTipo(entrada.tipo)}
                </span>
                <span className={obterCorTipo(entrada.tipo)}>
                  {entrada.mensagem}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
