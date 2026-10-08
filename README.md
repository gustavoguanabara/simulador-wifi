# 📡 Simulador Wi-Fi (RF Signal Propagation Simulator)

Simulador interativo e visual de propagação de sinal Wi-Fi, nós de rede (Access Points, nós mesh, estações clientes), obstáculos físicos (paredes com diferentes materiais e índices de atenuação), canais, interferências de aparelhos domésticos (micro-ondas) e métricas de desempenho em tempo real (RSSI em dBm, SNR, throughput estimado).

Desenvolvido com **tecnologias web nativas** (HTML5, Dual-Canvas 2D, CSS3 e JavaScript ES6+), com **zero dependências externas** e **zero-build** — roda diretamente em qualquer navegador moderno.

---

## 🚀 Demonstração Online

Acesse o simulador diretamente pelo seu navegador:  
👉 **[https://gustavoguanabara.github.io/simulador-wifi/](https://gustavoguanabara.github.io/simulador-wifi/)**

🧪 **Painel de Testes & Validação Técnica**:  
👉 **[https://gustavoguanabara.github.io/simulador-wifi/test.html](https://gustavoguanabara.github.io/simulador-wifi/test.html)**

---

## ✨ Principais Funcionalidades

- **Motor Analítico de Radiofrequência (RF)**:
  - Modelo de atenuação FSPL (*Free-Space Path Loss*) para frequências de **2.4 GHz** e **5.0 GHz**.
  - Cálculo de atenuação por espessura e material de paredes (alvenaria, concreto armado, drywall, vidro simples/duplo, madeira maciça).
  - Simulação de obstáculos e mobílias com degradação RF (espelhos com película metálica, aquários com água, geladeiras inox, micro-ondas com ruído ativo).
  - Cálculo de malha discreta de calor (*Heatmap*) em tempo real com interpolação de gradiente cromático de 5 cores.
- **Arquitetura Dual-Canvas a 60 FPS**:
  - Camada de fundo com renderização reativa do mapa de calor de sinal.
  - Camada frontal de alta resolução com animação suave de frentes de onda, halo pulsante e nós de rede.
- **Controle de Equipamentos & Topologia de Rede**:
  - Roteadores Principais (AP Gateway), Nós Mesh / Repetidores e Clientes Wi-Fi (notebooks, smartphones, smart TVs).
  - Sistema de controle de energia (*power toggle*): ligue ou desligue aparelhos com cessação imediata de ondas e recálculo dinâmico do heatmap.
  - Dependência de rede inteligente: repetidores e nós mesh detectam a presença e o estado de operação do roteador principal.
  - Interferência de micro-ondas: fonte de ruído ativo com anéis de interferência tracejados na banda de 2.4 GHz.
- **Editor de Plantas e Cenários**:
  - Ferramenta de desenho e edição de paredes com snap de ângulos (0°, 45°, 90°) e manipulação de vértices.
  - Posicionamento de portas e janelas com alternância de lado de abertura e direção do batente.
  - Rotação livre de móveis e aparelhos com alça inteligente anti-oclusão.
  - Galeria de templates prontos: **Projeto em Branco**, **Studio (45 m²)**, **Apartamento Familiar (85 m²)** e **Casa Térrea (130 m²)**.
- **Exportação, Importação e Persistência**:
  - Persistência automática contínua da sessão no `localStorage` (planta, posições, zoom e scroll da viewport).
  - Exportação e importação completa do projeto em arquivo JSON estruturado.
- **Design 100% Responsivo e Tátil**:
  - Totalmente adaptado para smartphones, tablets e desktops.
  - Suporte a gestos de pinça (*pinch-to-zoom*), pan com dois dedos e controles flutuantes de enquadramento (*Fit to screen*).

---

## 💻 Como Executar Localmente

Como o projeto é construído em Vanilla Web puro, não é necessário instalar Node.js, compilar pacotes ou baixar dependências:

### Opção 1: Abrir diretamente no navegador
Basta abrir o arquivo `index.html` em qualquer navegador web moderno.

### Opção 2: Servidor HTTP local simples (Python)
Se preferir rodar em um servidor local estático:

```bash
# Com Python 3
python3 -m http.server 8000
```

Em seguida, acesse no navegador: `http://localhost:8000`

---

## 🧪 Suíte de Testes Automatizados

O projeto inclui uma suíte integrada de testes unitários e de integração acessível em `test.html`. Ela valida:
- Algoritmos geométricos 2D e cálculo de interseção de raios.
- Fórmulas analíticas de FSPL e atenuação por material.
- Geração da malha de calor e mapeamento de gradientes.
- Persistência e restauração de estado no LocalStorage.
- Comportamento de energia e dependência de repetidores.

Para rodar os testes, basta abrir `test.html` no navegador.

---

## 📄 Licença

Distribuído sob a licença MIT.

---

Desenvolvido por **Gustavo Guanabara**.
