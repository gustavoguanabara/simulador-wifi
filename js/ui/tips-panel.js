/**
 * Simulador Wi-Fi - Painel Lateral de Dicas e Boas Práticas (Tips Drawer)
 * Camada: UI (WifiSim.UI.TipsPanel)
 * Zero dependências externas - ECMAScript 2020+
 */

(function () {
  'use strict';

  window.WifiSim = window.WifiSim || {};
  window.WifiSim.UI = window.WifiSim.UI || {};

  const TipsPanel = {
    drawerEl: null,
    toggleBtn: null,
    floatingTab: null,
    closeBtn: null,
    liveBodyEl: null,
    isInitialized: false,

    init() {
      this.drawerEl = document.getElementById('tips-drawer');
      this.toggleBtn = document.getElementById('btn-toggle-tips');
      this.floatingTab = document.getElementById('btn-floating-tips');
      this.closeBtn = document.getElementById('btn-close-tips');
      this.liveBodyEl = document.getElementById('tips-live-body');

      if (!this.drawerEl) return;

      // Botão na barra superior
      if (this.toggleBtn) {
        this.toggleBtn.addEventListener('click', () => this.toggle());
      }

      // Aba flutuante na borda direita
      if (this.floatingTab) {
        this.floatingTab.addEventListener('click', () => this.open());
      }

      // Botão de fechar no cabeçalho do painel
      if (this.closeBtn) {
        this.closeBtn.addEventListener('click', () => this.close());
      }

      // Fechar com a tecla ESC
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen()) {
          this.close();
        }
      });

      // Atualiza diagnósticos dinâmicos quando o estado da cena mudar
      const state = window.WifiSim.State;
      if (state) {
        state.subscribe((event) => {
          if (this.isOpen()) {
            this.updateLiveDiagnostics();
          }
          if (event === 'repeater_auto_disabled' || event === 'repeater_power_blocked') {
            // O painel de dicas só deve ser aberto automaticamente na tela principal (index.html)
            const isMainApp = !!document.getElementById('app-container');
            const isTestPage = typeof window !== 'undefined' && window.location && window.location.pathname && window.location.pathname.includes('test.html');
            if (isMainApp && !isTestPage) {
              this.updateLiveDiagnostics();
              this.open();
            }
          }
        });
      }

      this.isInitialized = true;
    },

    isOpen() {
      return this.drawerEl && this.drawerEl.classList.contains('open');
    },

    open() {
      if (!this.drawerEl) return;
      this.drawerEl.classList.add('open');
      this.drawerEl.setAttribute('aria-hidden', 'false');

      if (this.toggleBtn) {
        this.toggleBtn.classList.add('active');
      }

      if (this.floatingTab) {
        this.floatingTab.classList.add('drawer-open');
      }

      this.updateLiveDiagnostics();
    },

    close() {
      if (!this.drawerEl) return;
      this.drawerEl.classList.remove('open');
      this.drawerEl.setAttribute('aria-hidden', 'true');

      if (this.toggleBtn) {
        this.toggleBtn.classList.remove('active');
      }

      if (this.floatingTab) {
        this.floatingTab.classList.remove('drawer-open');
      }
    },

    toggle() {
      if (this.isOpen()) {
        this.close();
      } else {
        this.open();
      }
    },

    /**
     * Analisa o cenário atual (dispositivos, materiais e posições) e gera alertas contextuais ao vivo
     */
    updateLiveDiagnostics() {
      if (!this.liveBodyEl) return;

      const state = window.WifiSim.State;
      if (!state || !state.scene) {
        this.liveBodyEl.innerHTML = '<div class="live-alert-item live-alert-info"><span>Nenhum cenário carregado no momento.</span></div>';
        return;
      }

      const scene = state.scene;
      const devices = scene.devices || [];
      const walls = scene.walls || [];
      const dims = scene.dimensions || { width_m: 10, height_m: 8 };

      const routers = devices.filter((d) => d.category === 'transmitter' && d.rf_config?.is_active);
      const primaryRouter = routers[0] || devices.find((d) => d.type === 'router');

      const alerts = [];

      // 0. Verificação de Repetidores Wi-Fi (Nó Mesh) e dependência de Roteador Principal
      const repeaters = devices.filter((d) => (state.isRepeaterDevice ? state.isRepeaterDevice(d) : (d.type === 'mesh_node' || d.type === 'repeater')));
      const mainRouters = devices.filter((d) => (state.isMainRouterDevice ? state.isMainRouterDevice(d) : (d.category === 'transmitter' && (d.type === 'router_gateway' || d.type === 'router'))));
      const activeMainRouters = mainRouters.filter((d) => (state.isDevicePowered ? state.isDevicePowered(d) : (d.rf_config?.is_active && d.is_active !== false)));

      if (repeaters.length > 0) {
        if (mainRouters.length === 0) {
          alerts.push({
            type: 'danger',
            icon: '⚠️',
            title: 'Repetidor Inoperante (Sem Roteador Principal)',
            text: 'O repetidor Wi-Fi (nó Mesh) não pode funcionar sem um Roteador Principal presente na rede. Adicione um Roteador Principal (AP) pelo menu "+" para que o repetidor volte a emitir sinal.'
          });
        } else if (activeMainRouters.length === 0) {
          alerts.push({
            type: 'warning',
            icon: '🔌',
            title: 'Repetidor Desligado (Roteador Principal Apagado)',
            text: 'O repetidor Wi-Fi (nó Mesh) foi desligado automaticamente porque o Roteador Principal está desligado. Ligue o Roteador Principal para que o repetidor volte a emitir sinal.'
          });
        }
      }

      // 1. Verificação de Forno Micro-ondas
      const microwaves = devices.filter((d) => d.type === 'microwave');
      if (microwaves.length > 0) {
        microwaves.forEach((mw) => {
          let distToRouter = null;
          if (primaryRouter && mw.position && primaryRouter.position) {
            const dx = mw.position.x - primaryRouter.position.x;
            const dy = mw.position.y - primaryRouter.position.y;
            distToRouter = Math.sqrt(dx * dx + dy * dy);
          }

          if (distToRouter !== null && distToRouter < 3.0) {
            alerts.push({
              type: 'danger',
              icon: '⚠️',
              title: `Micro-ondas muito perto do Roteador (${distToRouter.toFixed(1)}m)`,
              text: 'Afaste o roteador principal do micro-ondas! Fornos operam em 2.45 GHz e vazam ruído capaz de congelar transmissões e derrubar o sinal.'
            });
          } else {
            alerts.push({
              type: 'warning',
              icon: '📻',
              title: 'Micro-ondas detectado na planta',
              text: 'Mantenha o roteador afastado do micro-ondas durante o preparo de alimentos para evitar interferência destrutiva na banda 2.4 GHz.'
            });
          }
        });
      }

      // 2. Verificação de Espelhos
      const mirrors = devices.filter((d) => d.type === 'mirror_obj');
      if (mirrors.length > 0) {
        alerts.push({
          type: 'warning',
          icon: '🪞',
          title: `${mirrors.length} Espelho(s) no ambiente`,
          text: 'Espelhos causam interferência e reflexão eletromagnética severa (película metálica de prata). Evite deixá-los no meio do caminho até outros cômodos.'
        });
      }

      // 3. Verificação de Geladeiras / Refrigeradores
      const fridges = devices.filter((d) => d.type === 'fridge');
      if (fridges.length > 0) {
        alerts.push({
          type: 'warning',
          icon: '🧊',
          title: 'Geladeira / Bloco Metálico',
          text: 'A carcaça metálica e o compressor da geladeira atenuam mais de 25 dB de sinal, criando uma zona de sombra cega logo atrás dela.'
        });
      }

      // 4. Verificação de Aquários (Absorção de Água)
      const aquariums = devices.filter((d) => d.type === 'aquarium');
      if (aquariums.length > 0) {
        alerts.push({
          type: 'warning',
          icon: '🐠',
          title: 'Aquário / Massa de Água',
          text: 'A água é um absorvedor potente de radiofrequência (~16 dB de perda). Não instale receptores ou o roteador com um aquário na linha reta de visada.'
        });
      }

      // 5. Verificação de Centralização do Roteador
      if (primaryRouter && primaryRouter.position) {
        const posX = primaryRouter.position.x;
        const posY = primaryRouter.position.y;
        const marginX = dims.width_m * 0.18;
        const marginY = dims.height_m * 0.18;

        const isCorner =
          posX < marginX ||
          posX > (dims.width_m - marginX) ||
          posY < marginY ||
          posY > (dims.height_m - marginY);

        if (isCorner) {
          alerts.push({
            type: 'info',
            icon: '🎯',
            title: 'Centralização do Roteador',
            text: 'Melhor posicionar o roteador em um ponto mais central para distribuir melhor o sinal em 360°, reduzindo sinal desperdiçado para fora da residência.'
          });
        }
      }

      // 6. Verificação de Banda e Paredes de Concreto
      const concreteWalls = walls.filter((w) => w.material === 'concreto');
      const is5G = primaryRouter?.rf_config?.frequency_ghz === 5.0 || primaryRouter?.rf_config?.frequency_mode === '5.0';
      if (concreteWalls.length >= 2 && is5G) {
        alerts.push({
          type: 'info',
          icon: '🏛️',
          title: 'Paredes de Concreto e Banda 5 GHz',
          text: 'O concreto atenua fortemente ondas de 5.0 GHz (-25 dB). Se houver cômodos isolados, considere utilizar o modo Dual ou instalar nós Mesh adicionais.'
        });
      }

      // 7. Se não houver alertas, exibir confirmação contextual
      if (alerts.length === 0) {
        if (!primaryRouter) {
          alerts.push({
            type: 'info',
            icon: '📐',
            title: 'Projeto em Branco / Sem Roteador Wi-Fi',
            text: 'Ambiente livre para criação. Adicione um Roteador Principal (AP) pelo menu "+" ou construa paredes estruturais pelo menu de ferramentas.'
          });
        } else {
          alerts.push({
            type: 'success',
            icon: '✅',
            title: 'Excelente Disposição do Sinal',
            text: 'O roteador está bem localizado, livre de grandes bloqueios metálicos ou emissores de ruído no raio imediato.'
          });
        }
      }

      // Renderiza os alertas dinâmicos
      this.liveBodyEl.innerHTML = alerts.map((a) => `
        <div class="live-alert-item live-alert-${a.type}">
          <span class="live-alert-icon">${a.icon}</span>
          <div>
            <strong>${a.title}:</strong> ${a.text}
          </div>
        </div>
      `).join('');
    }
  };

  window.WifiSim.UI.TipsPanel = TipsPanel;
})();
