/**
 * Processo Principal do Electron - Edienai Printer
 * Gerencia a janela principal, impressão e comunicação com o renderer
 */

import { app, BrowserWindow, ipcMain, PrinterInfo } from 'electron'
import * as path from 'path'
import Store from 'electron-store'

// Configurações persistentes
interface ConfiguracoesApp {
  nomeImpressora: string
  larguraPapel: '58mm' | '72mm' | '80mm'
  tamanhoTexto: 'pequeno' | 'normal' | 'grande' | 'extra'
  imprimirClienteAutomatico: boolean
  imprimirCozinhaAutomatico: boolean
  espacamentoLinhas: number
}

const configPadrao: ConfiguracoesApp = {
  nomeImpressora: '',
  larguraPapel: '80mm',
  tamanhoTexto: 'extra',
  imprimirClienteAutomatico: true,
  imprimirCozinhaAutomatico: true,
  espacamentoLinhas: 8,
}

const armazenamento = new Store<ConfiguracoesApp>({
  defaults: configPadrao,
})

let janelaprincipal: BrowserWindow | null = null

function criarJanela(): void {
  janelaprincipal = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    title: 'Edienai Printer',
    icon: path.join(__dirname, '../../assets/icon.png'),
    backgroundColor: '#1a1a2e',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  // Em desenvolvimento, carrega do servidor Vite
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    janelaprincipal.loadURL('http://localhost:5173')
    janelaprincipal.webContents.openDevTools()
  } else {
    // Em produção, carrega do build
    janelaprincipal.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  janelaprincipal.on('closed', () => {
    janelaprincipal = null
  })
}

// Inicialização do app
app.whenReady().then(() => {
  criarJanela()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      criarJanela()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// ============================================================================
// IPC Handlers - Comunicação com o Renderer
// ============================================================================

// Obter lista de impressoras disponíveis
ipcMain.handle('obter-impressoras', async (): Promise<PrinterInfo[]> => {
  if (!janelaprincipal) return []
  return janelaprincipal.webContents.getPrinters()
})

// Obter configurações salvas
ipcMain.handle('obter-configuracoes', (): ConfiguracoesApp => {
  return armazenamento.store
})

// Salvar configurações
ipcMain.handle('salvar-configuracoes', (_event, config: Partial<ConfiguracoesApp>): boolean => {
  try {
    Object.keys(config).forEach((chave) => {
      const key = chave as keyof ConfiguracoesApp
      if (config[key] !== undefined) {
        armazenamento.set(key, config[key] as ConfiguracoesApp[keyof ConfiguracoesApp])
      }
    })
    return true
  } catch (erro) {
    console.error('[MAIN] Erro ao salvar configurações:', erro)
    return false
  }
})

// Imprimir conteúdo HTML silenciosamente
ipcMain.handle('imprimir-silencioso', async (_event, conteudoHtml: string, nomeImpressora?: string): Promise<{ sucesso: boolean; erro?: string }> => {
  return new Promise((resolve) => {
    if (!janelaprincipal) {
      resolve({ sucesso: false, erro: 'Janela principal não encontrada' })
      return
    }

    // Cria janela oculta para impressão
    const janelaImpressao = new BrowserWindow({
      show: false,
      width: 300,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    })

    // Carrega o HTML
    janelaImpressao.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(conteudoHtml)}`)

    janelaImpressao.webContents.on('did-finish-load', () => {
      const impressora = nomeImpressora || armazenamento.get('nomeImpressora')
      
      const opcoesImpressao: Electron.WebContentsPrintOptions = {
        silent: true,
        printBackground: true,
        deviceName: impressora || undefined,
        margins: {
          marginType: 'none',
        },
        pageSize: {
          width: 80000, // 80mm em microns
          height: 297000, // Altura dinâmica
        },
      }

      janelaImpressao.webContents.print(opcoesImpressao, (sucesso, motivoFalha) => {
        janelaImpressao.close()
        
        if (sucesso) {
          console.log('[MAIN] Impressão realizada com sucesso')
          resolve({ sucesso: true })
        } else {
          console.error('[MAIN] Falha na impressão:', motivoFalha)
          resolve({ sucesso: false, erro: motivoFalha })
        }
      })
    })

    janelaImpressao.webContents.on('did-fail-load', () => {
      janelaImpressao.close()
      resolve({ sucesso: false, erro: 'Falha ao carregar conteúdo para impressão' })
    })
  })
})

// Obter versão do app
ipcMain.handle('obter-versao', (): string => {
  return app.getVersion()
})

console.log('[MAIN] Processo principal iniciado')
