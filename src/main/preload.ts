/**
 * Preload Script - Expõe APIs seguras para o renderer
 */

import { contextBridge, ipcRenderer, PrinterInfo } from 'electron'

// Interface das configurações
interface ConfiguracoesApp {
  nomeImpressora: string
  larguraPapel: '58mm' | '72mm' | '80mm'
  tamanhoTexto: 'pequeno' | 'normal' | 'grande' | 'extra'
  imprimirClienteAutomatico: boolean
  imprimirCozinhaAutomatico: boolean
  espacamentoLinhas: number
}

// API exposta ao renderer
const apiElectron = {
  // Impressoras
  obterImpressoras: (): Promise<PrinterInfo[]> => {
    return ipcRenderer.invoke('obter-impressoras')
  },
  
  // Impressão silenciosa
  imprimirSilencioso: (conteudoHtml: string, nomeImpressora?: string): Promise<{ sucesso: boolean; erro?: string }> => {
    return ipcRenderer.invoke('imprimir-silencioso', conteudoHtml, nomeImpressora)
  },
  
  // Configurações
  obterConfiguracoes: (): Promise<ConfiguracoesApp> => {
    return ipcRenderer.invoke('obter-configuracoes')
  },
  
  salvarConfiguracoes: (config: Partial<ConfiguracoesApp>): Promise<boolean> => {
    return ipcRenderer.invoke('salvar-configuracoes', config)
  },
  
  // Info
  obterVersao: (): Promise<string> => {
    return ipcRenderer.invoke('obter-versao')
  },
  
  // Plataforma
  plataforma: process.platform,
}

// Expõe a API de forma segura
contextBridge.exposeInMainWorld('electronAPI', apiElectron)

// Tipos para o renderer
export type ElectronAPI = typeof apiElectron
