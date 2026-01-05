/**
 * Hook para gerenciar o log de atividades
 */

import { useState, useCallback } from 'react'
import { EntradaLog } from '../tipos'

const MAX_ENTRADAS = 200

interface RetornoHook {
  entradas: EntradaLog[]
  adicionarEntrada: (mensagem: string, tipo: EntradaLog['tipo']) => void
  limparLog: () => void
}

export function useLog(): RetornoHook {
  const [entradas, setEntradas] = useState<EntradaLog[]>([])

  const adicionarEntrada = useCallback((mensagem: string, tipo: EntradaLog['tipo']) => {
    const novaEntrada: EntradaLog = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date(),
      mensagem,
      tipo,
    }

    setEntradas((prev) => {
      const novasEntradas = [novaEntrada, ...prev]
      
      // Limita o número de entradas
      if (novasEntradas.length > MAX_ENTRADAS) {
        return novasEntradas.slice(0, MAX_ENTRADAS)
      }
      
      return novasEntradas
    })
  }, [])

  const limparLog = useCallback(() => {
    setEntradas([])
  }, [])

  return {
    entradas,
    adicionarEntrada,
    limparLog,
  }
}
