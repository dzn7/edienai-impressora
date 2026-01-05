/**
 * Componente Cabeçalho
 * Exibe o logo, status de conexão e botão de configurações
 */

import React from 'react'
import { StatusConexao } from '../tipos'

interface PropsCabecalho {
  status: StatusConexao
  mensagemStatus: string
  versao: string
  aoClicarConfiguracoes: () => void
}

export const Cabecalho: React.FC<PropsCabecalho> = ({
  status,
  mensagemStatus,
  versao,
  aoClicarConfiguracoes,
}) => {
  const obterCorStatus = (): string => {
    switch (status) {
      case 'conectado':
        return 'bg-green-500'
      case 'conectando':
        return 'bg-yellow-500 animate-pulse'
      case 'erro':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const obterIconeStatus = (): string => {
    switch (status) {
      case 'conectado':
        return '🟢'
      case 'conectando':
        return '🟡'
      case 'erro':
        return '🔴'
      default:
        return '⚪'
    }
  }

  return (
    <header className="bg-edienai-fundo border-b border-edienai-fundo-claro px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo e Título */}
        <div className="flex items-center gap-4">
          <img
            src="./assets/logo.png"
            alt="Edienai Lanches"
            className="h-12 w-12 rounded-lg object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
          <div>
            <h1 className="text-2xl font-bold text-edienai-amarelo">
              EDIENAI PRINTER
            </h1>
            <p className="text-xs text-gray-400">v{versao}</p>
          </div>
        </div>

        {/* Status da Conexão */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${obterCorStatus()}`} />
            <span className="text-sm text-gray-300">
              {obterIconeStatus()} {mensagemStatus}
            </span>
          </div>

          {/* Botão Configurações */}
          <button
            onClick={aoClicarConfiguracoes}
            className="flex items-center gap-2 rounded-lg bg-edienai-fundo-claro px-4 py-2 text-gray-300 transition-colors hover:bg-edienai-vermelho hover:text-white"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Configurações
          </button>
        </div>
      </div>
    </header>
  )
}
