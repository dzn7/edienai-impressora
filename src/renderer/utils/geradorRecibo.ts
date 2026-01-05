/**
 * Gerador de Recibos HTML
 * Gera o HTML formatado para impressão térmica
 */

import { Pedido, ItemPedido, TipoImpressao, ConfiguracoesApp, DadosEdicao, OpcaoEntrega } from '../tipos'

// Mapeamento de tamanhos de fonte
const TAMANHOS_FONTE = {
  pequeno: { normal: 10, negrito: 12, titulo: 14, cabecalho: 9, total: 13 },
  normal: { normal: 12, negrito: 14, titulo: 18, cabecalho: 11, total: 16 },
  grande: { normal: 14, negrito: 16, titulo: 20, cabecalho: 13, total: 18 },
  extra: { normal: 16, negrito: 18, titulo: 22, cabecalho: 15, total: 20 },
}

// Larguras de papel em mm
const LARGURAS_PAPEL = {
  '58mm': 48,
  '72mm': 62,
  '80mm': 72,
}

/**
 * Formata data/hora para exibição
 */
function formatarDataHora(dataString?: string): { data: string; hora: string } {
  if (!dataString) {
    return { data: '--/--/----', hora: '--:--' }
  }

  try {
    const data = new Date(dataString)
    // Ajusta para horário de Brasília (UTC-3)
    const dataBrasilia = new Date(data.getTime() - 3 * 60 * 60 * 1000)
    
    return {
      data: dataBrasilia.toLocaleDateString('pt-BR'),
      hora: dataBrasilia.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    }
  } catch {
    return { data: '--/--/----', hora: '--:--' }
  }
}

/**
 * Formata valor monetário
 */
function formatarMoeda(valor: number | string): string {
  const numero = typeof valor === 'string' ? parseFloat(valor) : valor
  return `R$ ${numero.toFixed(2).replace('.', ',')}`
}

/**
 * Obtém o texto de localização do pedido
 */
function obterTextoLocalizacao(opcaoEntrega?: OpcaoEntrega): {
  tipo: string
  detalhes: string
  endereco?: string
} {
  if (!opcaoEntrega) {
    return { tipo: 'N/A', detalhes: '' }
  }

  const tipo = opcaoEntrega.type || 'N/A'
  let detalhes = ''
  let endereco: string | undefined

  if (tipo === 'Entrega') {
    detalhes = 'DELIVERY'
    // Monta endereço completo
    const partes: string[] = []
    if (opcaoEntrega.address) partes.push(opcaoEntrega.address)
    if (opcaoEntrega.location) partes.push(opcaoEntrega.location)
    endereco = partes.join(' - ')
  } else if (tipo === 'No Local') {
    if (opcaoEntrega.localEstabelecimento) {
      // Locais externos: Marcelo, Escamas, Parquinho, etc.
      detalhes = opcaoEntrega.localEstabelecimento.toUpperCase()
    } else if (opcaoEntrega.tableNumber) {
      detalhes = `MESA ${opcaoEntrega.tableNumber}`
    } else {
      detalhes = 'NO LOCAL'
    }
  } else if (tipo === 'Retirada') {
    detalhes = 'RETIRADA NO BALCÃO'
  } else {
    detalhes = String(tipo).toUpperCase()
  }

  return { tipo, detalhes, endereco }
}

/**
 * Gera estilos CSS base para o recibo
 */
function gerarEstilosBase(config: ConfiguracoesApp): string {
  const fontes = TAMANHOS_FONTE[config.tamanhoTexto]
  const largura = LARGURAS_PAPEL[config.larguraPapel]

  return `
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: 'Courier New', monospace;
        font-size: ${fontes.normal}pt;
        width: ${largura}mm;
        background: white;
        color: black;
        line-height: 1.3;
        padding: 2mm;
      }
      .centro { text-align: center; }
      .esquerda { text-align: left; }
      .direita { text-align: right; }
      .negrito { font-weight: bold; }
      .titulo { font-size: ${fontes.titulo}pt; font-weight: bold; }
      .cabecalho { font-size: ${fontes.cabecalho}pt; }
      .total { font-size: ${fontes.total}pt; font-weight: bold; }
      .separador { border-top: 1px dashed black; margin: 2mm 0; }
      .separador-duplo { border-top: 2px solid black; margin: 2mm 0; }
      .item { margin: 1mm 0; }
      .complemento { padding-left: 3mm; font-size: ${fontes.cabecalho}pt; }
      .observacao { padding-left: 3mm; font-size: ${fontes.cabecalho}pt; font-style: italic; }
      .destaque { 
        background: black; 
        color: white; 
        padding: 1mm 2mm; 
        font-weight: bold;
        text-align: center;
        margin: 2mm 0;
      }
      .alerta-edicao {
        background: black;
        color: white;
        padding: 2mm;
        text-align: center;
        font-weight: bold;
        font-size: ${fontes.negrito}pt;
        margin: 2mm 0;
      }
      .endereco-delivery {
        background: #f0f0f0;
        padding: 2mm;
        margin: 2mm 0;
        font-weight: bold;
      }
      .flex-between {
        display: flex;
        justify-content: space-between;
      }
    </style>
  `
}

/**
 * Gera HTML do recibo para impressão
 */
export function gerarHtmlRecibo(
  pedido: Pedido,
  tipo: TipoImpressao,
  config: ConfiguracoesApp
): string {
  const estilos = gerarEstilosBase(config)
  const dataHora = formatarDataHora(pedido.sentAt || pedido.sent_at || pedido.createdAt || pedido.created_at)
  const pedidoId = (pedido.id || '').slice(-6)
  const nomeCliente = (pedido.customerName || pedido.customer_name || 'Cliente').slice(0, 25)
  const telefone = pedido.customerPhone || pedido.customer_phone || ''
  const opcaoEntrega = pedido.deliveryOption || pedido.delivery_option
  const localizacao = obterTextoLocalizacao(opcaoEntrega)
  const garcom = pedido.created_by_waiter

  if (tipo === 'cozinha') {
    return gerarReciboCozinha(pedido, estilos, dataHora, pedidoId, nomeCliente, localizacao, garcom)
  } else {
    return gerarReciboCliente(pedido, estilos, dataHora, pedidoId, nomeCliente, telefone, localizacao, garcom)
  }
}

/**
 * Gera recibo para a cozinha (compacto, foco nos itens)
 */
function gerarReciboCozinha(
  pedido: Pedido,
  estilos: string,
  dataHora: { data: string; hora: string },
  pedidoId: string,
  nomeCliente: string,
  localizacao: { tipo: string; detalhes: string; endereco?: string },
  garcom?: string
): string {
  let itensHtml = ''
  
  pedido.items.forEach((item) => {
    const qtd = item.quantity || item.quantidade || 1
    const nome = (item.name || item.nome || 'Item').slice(0, 30)
    
    itensHtml += `<div class="item negrito">${qtd}x ${nome}</div>`
    
    // Complementos
    const complementos = item.complements || item.complementos || []
    complementos.forEach((comp) => {
      if (comp.name) {
        itensHtml += `<div class="complemento">+ ${comp.name}</div>`
      }
    })
    
    // Observações
    const obs = item.notes || item.observations || item.observacao
    if (obs) {
      itensHtml += `<div class="observacao">&gt; ${obs}</div>`
    }
  })

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      ${estilos}
    </head>
    <body>
      <div class="centro titulo">** COZINHA **</div>
      <div class="separador-duplo"></div>
      
      <div class="centro negrito">#${pedidoId}</div>
      <div class="centro cabecalho">${dataHora.data} às ${dataHora.hora}</div>
      
      <div class="separador"></div>
      
      <div class="destaque">&gt;&gt; ${localizacao.detalhes} &lt;&lt;</div>
      
      ${localizacao.endereco ? `
        <div class="endereco-delivery">
          📍 ${localizacao.endereco}
        </div>
      ` : ''}
      
      <div class="esquerda">Cliente: ${nomeCliente}</div>
      ${garcom ? `<div class="esquerda cabecalho">Garçom: ${garcom}</div>` : ''}
      
      <div class="separador-duplo"></div>
      
      ${itensHtml}
      
      <div class="separador-duplo"></div>
      <div class="centro cabecalho">Bom trabalho!</div>
      <br><br><br>
    </body>
    </html>
  `
}

/**
 * Gera recibo para o cliente (completo, com preços)
 */
function gerarReciboCliente(
  pedido: Pedido,
  estilos: string,
  dataHora: { data: string; hora: string },
  pedidoId: string,
  nomeCliente: string,
  telefone: string,
  localizacao: { tipo: string; detalhes: string; endereco?: string },
  garcom?: string
): string {
  let itensHtml = ''
  
  pedido.items.forEach((item) => {
    const qtd = item.quantity || item.quantidade || 1
    const nome = (item.name || item.nome || 'Item').slice(0, 25)
    const preco = item.totalItemPrice || 0
    
    itensHtml += `
      <div class="item flex-between">
        <span class="negrito">${qtd}x ${nome}</span>
        <span>${formatarMoeda(preco)}</span>
      </div>
    `
    
    // Complementos
    const complementos = item.complements || item.complementos || []
    complementos.forEach((comp) => {
      if (comp.name) {
        itensHtml += `<div class="complemento">+ ${comp.name}</div>`
      }
    })
    
    // Observações
    const obs = item.notes || item.observations || item.observacao
    if (obs) {
      itensHtml += `<div class="observacao">Obs: ${obs}</div>`
    }
  })

  const total = typeof pedido.total === 'string' ? parseFloat(pedido.total) : pedido.total
  const formaPagamento = pedido.paymentMethod || pedido.payment_method || 'N/A'
  const trocoPara = pedido.trocoPara || pedido.troco_para

  let trocoHtml = ''
  if (trocoPara && trocoPara > total) {
    const troco = trocoPara - total
    trocoHtml = `<div class="cabecalho">Troco p/ ${formatarMoeda(trocoPara)} = ${formatarMoeda(troco)}</div>`
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      ${estilos}
    </head>
    <body>
      <div class="centro titulo">EDIENAI LANCHES</div>
      <div class="separador"></div>
      <div class="centro cabecalho">${dataHora.data} - ${dataHora.hora}</div>
      <div class="separador-duplo"></div>
      
      <div class="esquerda">Pedido: <span class="negrito">#${pedidoId}</span></div>
      <div class="esquerda">Cliente: ${nomeCliente}</div>
      ${telefone ? `<div class="esquerda cabecalho">Tel: ${telefone}</div>` : ''}
      ${garcom ? `<div class="esquerda cabecalho">Atendente: ${garcom}</div>` : ''}
      
      <div class="separador"></div>
      
      <div class="esquerda negrito">${localizacao.detalhes}</div>
      ${localizacao.endereco ? `
        <div class="endereco-delivery">
          📍 ENDEREÇO: ${localizacao.endereco}
        </div>
      ` : ''}
      
      <div class="separador"></div>
      <div class="esquerda cabecalho negrito">ITENS:</div>
      
      ${itensHtml}
      
      <div class="separador-duplo"></div>
      
      <div class="direita total">TOTAL: ${formatarMoeda(total)}</div>
      <div class="esquerda">Pagamento: ${formaPagamento}</div>
      ${trocoHtml}
      
      <div class="separador"></div>
      <div class="centro cabecalho">Obrigado pela preferência!</div>
      <br><br><br>
    </body>
    </html>
  `
}

/**
 * Gera HTML do recibo para edição (apenas itens novos)
 */
export function gerarHtmlReciboEdicao(
  pedido: Pedido,
  dadosEdicao: DadosEdicao,
  config: ConfiguracoesApp
): string {
  const estilos = gerarEstilosBase(config)
  const dataHora = formatarDataHora(new Date().toISOString())
  const pedidoId = (pedido.id || '').slice(-6)
  const nomeCliente = (pedido.customerName || pedido.customer_name || 'Cliente').slice(0, 25)
  const opcaoEntrega = pedido.deliveryOption || pedido.delivery_option
  const localizacao = obterTextoLocalizacao(opcaoEntrega)

  let itensHtml = ''
  
  dadosEdicao.itensAdicionados.forEach((item) => {
    const qtd = item.quantity || item.quantidade || 1
    const nome = (item.name || item.nome || 'Item').slice(0, 30)
    
    itensHtml += `<div class="item negrito">+${qtd}x ${nome}</div>`
    
    // Complementos
    const complementos = item.complements || item.complementos || []
    complementos.forEach((comp) => {
      if (comp.name) {
        itensHtml += `<div class="complemento">+ ${comp.name}</div>`
      }
    })
    
    // Observações
    const obs = item.notes || item.observations || item.observacao
    if (obs) {
      itensHtml += `<div class="observacao">&gt; ${obs}</div>`
    }
  })

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      ${estilos}
    </head>
    <body>
      <div class="alerta-edicao">
        ⚠️ PEDIDO EDITADO/SOMADO ⚠️
      </div>
      
      <div class="centro titulo">** COZINHA **</div>
      <div class="separador-duplo"></div>
      
      <div class="centro negrito">#${pedidoId}</div>
      <div class="centro cabecalho">${dataHora.data} às ${dataHora.hora}</div>
      
      <div class="separador"></div>
      
      <div class="destaque">&gt;&gt; ${localizacao.detalhes} &lt;&lt;</div>
      
      ${localizacao.endereco ? `
        <div class="endereco-delivery">
          📍 ${localizacao.endereco}
        </div>
      ` : ''}
      
      <div class="esquerda">Cliente: ${nomeCliente}</div>
      ${dadosEdicao.editadoPor ? `<div class="esquerda cabecalho">Editado por: ${dadosEdicao.editadoPor}</div>` : ''}
      
      <div class="separador-duplo"></div>
      
      <div class="alerta-edicao">
        ITENS ADICIONADOS:
      </div>
      
      ${itensHtml}
      
      <div class="separador"></div>
      <div class="direita negrito">Adicional: ${formatarMoeda(dadosEdicao.totalAdicional)}</div>
      
      <div class="separador-duplo"></div>
      <div class="centro cabecalho">Atenção: Somar ao pedido original!</div>
      <br><br><br>
    </body>
    </html>
  `
}
