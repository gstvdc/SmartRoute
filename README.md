# SmartRoute

![SmartRoute Banner](./public/assets/images/logo.png)

> **Análise de rotas logísticas com Algoritmo de Dijkstra e UX cinematográfica.**

O **SmartRoute** é uma aplicação web de ponta focada em calcular a rota mais barata e eficiente entre capitais brasileiras. Ele leva em consideração os custos de combustível (baseados na autonomia do veículo) e os custos reais de pedágio das rodovias brasileiras, processando milhares de possibilidades em milissegundos utilizando a Teoria dos Grafos.

Tudo isso envelopado em uma Interface de Usuário (UI) *Premium* com design Glassmorphism, aceleração de hardware e animações cinematográficas (FLIP animations) para uma experiência de navegação (UX) fluida e imersiva.

## Principais Funcionalidades

- **Cálculo de Rota Ótima**: Usa o **Algoritmo de Dijkstra** para encontrar o caminho com o menor custo (Combustível + Pedágio).
- **Suporte a Paradas (Waypoints)**: Permite adicionar uma cidade como parada obrigatória, recalculando e unindo as rotas automaticamente.
- **Integração com GPS**: Exporta a rota calculada diretamente para o **Google Maps** ou **Waze** com apenas um clique.
- **Interface Dashboard (Tela Cheia)**: Um modo imersivo que transforma o mapa em um painel interativo (Dashboard), com painéis de vidro retráteis (Drawers) totalmente fluidos.
- **Mapa Interativo (Leaflet)**: Navegação espacial moderna com visualização escura (Dark Mode) focada no contraste de rotas.

## Tecnologias e Arquitetura

O projeto foi construído puramente com **Vanilla JavaScript** focado em performance extrema, sem depender de frameworks pesados para reatividade, priorizando acesso direto ao DOM e aceleração por placa de vídeo (GPU).

- **Core**: HTML5, CSS3 (Variáveis, Flexbox, Animações Avançadas), JavaScript (ES6+).
- **Bundler**: [Vite](https://vitejs.dev/) (Para Hot-Module-Replacement rápido e build otimizado).
- **Mapas**: [Leaflet.js](https://leafletjs.com/) utilizando os mapas renderizados da CARTO (Dark Matter).
- **Estruturas de Dados**: Implementação pura de **Grafos** (Lista de Adjacência) e **Min-Heap** (Fila de Prioridade) para o algoritmo de Dijkstra.

## Instalação e Execução

Para rodar o projeto localmente, certifique-se de ter o [Node.js](https://nodejs.org/) instalado.

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/smartroute.git
   cd smartroute
   ```

2. Instale as dependências do Vite:
   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

4. Abra o navegador no endereço exibido no terminal (geralmente `http://localhost:5173/`).

## Destaques de Design e UX

- **Glassmorphism UI**: Painéis translúcidos baseados em *Backdrop Filters* simulando vidro fosco.
- **FLIP Animations**: As transições de tela cheia do mapa não são apenas trocas de classe CSS; elas utilizam a técnica *First, Last, Invert, Play* no JavaScript para garantir que o mapa expanda com curva bézier `cubic-bezier(0.16, 1, 0.3, 1)` perfeitamente alinhada.
- **Zero Jitter / Zero Lag**: Elementos que se movem muito usam `will-change: transform` e `translateZ(0)` para repassar o processamento para a GPU (Aceleração de Hardware).

---
Feito com codigo e cafe.
