# Documentação Técnica: SmartRoute

Esta documentação fornece uma visão geral da arquitetura, estrutura de arquivos, componentes de UI e das estruturas de dados utilizadas no projeto **SmartRoute**.

---

## 1. Arquitetura do Projeto
O projeto foi totalmente construído sem a utilização de bibliotecas pesadas de reatividade (React, Vue, Angular). Em vez disso, utiliza **Vanilla JavaScript (ECMAScript Modules - ESM)** para atingir máxima performance. O empacotamento é realizado pelo **Vite**, que otimiza e minifica os pacotes (Javascript e CSS) para o ambiente de produção.

### Divisão de Responsabilidades
A aplicação possui uma arquitetura orientada a serviços e componentes de UI isolados:
- **`utils/`**: Estruturas de dados complexas, algoritmos isolados e constantes estáticas.
- **`components/`**: Lógicas de UI reutilizáveis ou isoladas que operam na manipulação do DOM.
- **`ui/`**: Componentes puramente visuais, de interação com botões (Drawers, Toasts).
- **`services/`**: Camada que integra a regra de negócio do Algoritmo de Dijkstra com as interações e atualizações do formulário/mapa.

---

## 2. Estrutura de Arquivos

```text
src/
├── assets/
│   ├── images/          # Logotipos e cursores da aplicação
│   ├── styles/
│   │   └── main.css     # Estilização completa do projeto (CSS Puro com Glassmorphism)
│   └── videos/          # Vídeo imersivo do plano de fundo
├── components/
│   ├── autocomplete.js  # Componente customizado de busca (cidades) sem libs externas
│   ├── map.js           # Orquestrador do Leaflet, FLIP animations e desenhos vetoriais
│   └── timeline-scroll.js# Motor customizado de Scroll Horizontal com física de "Momentum"
├── data/
│   └── capitais.json    # JSON com dados e distâncias das rotas e pedágios do Brasil
├── services/
│   └── route.service.js # Orquestrador principal: processa os inputs, executa Graph.dijkstra() e atualiza as telas
├── ui/
│   ├── drawers.js       # Lógica visual e mecânica das abas retráteis (Lateral e Base)
│   ├── fuel-input.js    # Máscara numérica do input de preço do combustível
│   └── toast.js         # Sistema isolado para renderização de alertas (Warnings/Errors)
├── utils/
│   ├── coordinates.js   # Dicionário absoluto com [Latitude, Longitude] de todas as capitais
│   ├── graph.js         # Classe `Graph` (Lista de Adjacência) + Método principal de `dijkstra`
│   ├── heap.js          # Classe `MinHeap` pura (Fila de Prioridade em tempo O(log n))
│   └── states.js        # Dicionário de Capítal > Estado (utilizado nos links de GPS)
└── main.js              # Entrypoint da aplicação (wiring de dependências)
```

---

## 3. Estruturas de Dados Core (O Algoritmo)

O cálculo de rotas no Brasil não é trivial. Para encontrar o "Menor Caminho", é calculada uma métrica de **Custo Financeiro Total**:
> `Custo do Trecho = (Distância / Autonomia) * Preço do Combustível + Pedágio do Destino`

Para processar essas métricas quase instantaneamente, o SmartRoute baseia-se em:
1. **Grafo Direcionado (Lista de Adjacência)**: Construído pela classe `Graph` em `graph.js` a partir do `capitais.json`. Cada vértice (cidade) conhece seus vizinhos imediatos, distância até eles, e o custo de pedágio.
2. **Min-Heap (Fila de Prioridade)**: Como não existe Min-Heap nativo no JavaScript, a classe foi escrita manualmente (`heap.js`). Essencial para garantir a complexidade ideal de **O(E log V)** ao algoritmo de busca.
3. **Algoritmo de Dijkstra (`dijkstra`)**: O cérebro do cálculo. Recebe os parâmetros de autonomia e combustível para alterar, em tempo real, os pesos das arestas. Caso o usuário adicione um *Waypoint (Parada Obrigatória)*, a rota quebra em dois cálculos (Origem → Parada e Parada → Destino), que são integrados automaticamente sob o capô, exibindo o resultado perfeitamente emendado.

---

## 4. Engenharia de UI e UX

A interface foi programada simulando um visual moderno e transparente (Glassmorphism), aliado a uma performance focada na aceleração gráfica.

### FLIP Animations (Modo Dashboard)
Quando o usuário simula uma rota, a tela não simplesmente "pula" para o modo de resultados. O `map.js` engatilha uma animação do tipo **FLIP** (First, Last, Invert, Play):
- Mede o tamanho real do contêiner primário e o tamanho após a classe `fullscreen` ser adicionada.
- Inverte as posições e o `border-radius` utilizando a propriedade `transform` (`translate` e `scale`), obrigando a GPU a renderizar a diferença em vez de sobrecarregar a Thread principal do JS refazendo caixas (`width`/`height`).
- O resultado é uma expansão do mapa ao longo da tela em perfeitos 60 frames por segundo.

### Momentum Scroll
Na barra de "Timeline" dos resultados horizontais, o comportamento de *Drag-to-Scroll* implementado em `timeline-scroll.js` injeta uma física de atrito com a função `requestAnimationFrame()`. O painel desliza suavemente à medida que a força inicial do mouse se extingue exponencialmente, igual a dispositivos iOS.

### Custom Autocomplete Dropdowns
Como inputs nativos `<datalist>` são feios e indestilizáveis na maioria dos navegadores, implementamos do zero a mecânica (`autocomplete.js`) utilizando `DIVs`, filtrando com Regex avançado ignorando pontuações e acentos, incluindo navegação completa pelo teclado (`UP`, `DOWN`, `ENTER`).

---

## 5. Resumo
SmartRoute não é apenas um buscador. É um modelo de arquitetura modular focada em VanillaJS limpo, onde cada comportamento de interação, mecânica de CSS e cálculos pesados em algoritmos logísticos operam independentemente e performam otimizados pelo Vite para um ambiente MVP robusto e totalmente livre de código morto.
