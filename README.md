# Edienai Printer

Cliente de impressão em tempo real para **Edienai Lanches**. Aplicação desktop desenvolvida com Electron + React + TypeScript.

## Funcionalidades

- 🖨️ **Impressão silenciosa** - Imprime automaticamente sem diálogos
- ⚡ **Tempo real** - Recebe pedidos via Supabase Realtime
- 🔄 **Fila de impressão** - Processa pedidos em sequência
- 📝 **Detecção de edições** - Imprime apenas itens adicionados quando um pedido é editado
- 🏪 **Locais externos** - Identifica Marcelo, Escamas, Parquinho, etc.
- 📍 **Endereço completo** - Exibe endereço completo para deliveries
- ⚙️ **Configurável** - Escolha impressora, tamanho do papel e texto

## Requisitos

- Node.js 18+ 
- npm ou yarn
- Impressora térmica (58mm, 72mm ou 80mm)

## Instalação

```bash
# Clonar repositório
git clone <repo-url>
cd edienai-printer

# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev
```

## Build

```bash
# Build para Windows
npm run build:win

# Build para macOS
npm run build:mac

# Build para Linux
npm run build:linux
```

Os executáveis serão gerados na pasta `release/`.

## Build via GitHub Actions

O projeto está configurado para build automático via GitHub Actions. Para criar uma release:

1. Crie uma tag com versão semântica:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. O workflow irá:
   - Buildar para Windows, macOS e Linux
   - Criar uma release com os executáveis

## Estrutura do Projeto

```
edienai-printer/
├── src/
│   ├── main/                 # Processo principal (Electron)
│   │   ├── index.ts          # Entry point
│   │   └── preload.ts        # Bridge para renderer
│   └── renderer/             # Interface (React)
│       ├── componentes/      # Componentes React
│       ├── hooks/            # Custom hooks
│       ├── servicos/         # Serviços (Supabase, Impressão)
│       ├── tipos/            # Tipos TypeScript
│       ├── utils/            # Utilitários
│       ├── styles/           # CSS/Tailwind
│       ├── App.tsx           # Componente principal
│       └── main.tsx          # Entry point React
├── assets/                   # Logo e ícones
├── .github/workflows/        # GitHub Actions
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Configuração

### Impressora

1. Abra o aplicativo
2. Clique em "Configurações"
3. Selecione sua impressora na lista
4. Escolha a largura do papel (58mm, 72mm ou 80mm)
5. Ajuste o tamanho do texto conforme necessário
6. Ative/desative impressão automática de cliente e cozinha

### Supabase

As credenciais do Supabase estão configuradas em:
- `src/renderer/servicos/supabase.ts`

## Lógica de Impressão

### Pedidos Novos
- Imprime via do **cliente** e via da **cozinha** (se habilitado)

### Pedidos Editados
- Detecta automaticamente itens adicionados
- Imprime apenas a **cozinha** com os novos itens
- Exibe alerta "PEDIDO EDITADO/SOMADO"

### Tipos de Entrega
- **Delivery**: Exibe endereço completo + localidade
- **No Local**: Exibe mesa ou local externo (Marcelo, Escamas, Parquinho)
- **Retirada**: Exibe "RETIRADA NO BALCÃO"

## Tecnologias

- **Electron** - Framework desktop
- **React 18** - Interface
- **TypeScript** - Tipagem
- **Vite** - Bundler
- **Tailwind CSS** - Estilos
- **Supabase** - Realtime database
- **electron-builder** - Empacotamento

## Licença

Proprietário - Edienai Lanches © 2026
