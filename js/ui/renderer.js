/**
 * Simulador Wi-Fi - Renderizador Gráfico da Cena (Scene Canvas 60 FPS)
 * Camada: UI (WifiSim.UI.Renderer)
 * Zero dependências externas - ECMAScript 2020+
 */

(function () {
  'use strict';

  window.WifiSim = window.WifiSim || {};
  window.WifiSim.UI = window.WifiSim.UI || {};

  /**
   * Catálogo Universal de Identidade Visual e Especificações para Componentes
   * Garante padronização rigorosa de ícones, contrastes, rótulos e chips operacionais
   */
  const COMPONENT_META = {
    // Transmissores Wi-Fi
    router_gateway: {
      icon: '📶',
      shortName: '📶 Roteador',
      defaultName: 'Roteador Wi-Fi',
      accentColor: '#00b894',
      getTag: (d) => {
        const isPowered = d.rf_config ? (d.rf_config.is_active !== false) : (d.is_active !== false);
        if (!isPowered) return '⚪ Desligado (Sem RF)';
        const mode = d.rf_config?.frequency_mode || (d.rf_config?.frequency_ghz === 2.4 ? '2.4 GHz' : d.rf_config?.frequency_ghz === 'multi' ? 'Multi-Band' : '5.0 GHz');
        const pwr = d.rf_config?.tx_power_dbm ? `${d.rf_config.tx_power_dbm} dBm` : '20 dBm';
        return `🟢 ${mode} • ${pwr}`;
      }
    },
    mesh_node: {
      icon: '📡',
      shortName: '📡 Mesh',
      defaultName: 'Ponto Mesh',
      accentColor: '#0984e3',
      getTag: (d) => {
        const state = window.WifiSim?.State;
        const isPowered = d.rf_config ? (d.rf_config.is_active !== false) : (d.is_active !== false);
        if (!isPowered) {
          if (state && state.hasActiveMainRouter && !state.hasActiveMainRouter()) {
            return '⚠️ Inoperante (Sem Roteador)';
          }
          return '⚪ Desligado (Sem RF)';
        }
        return '🟢 Nó Mesh 5.0 GHz';
      }
    },

    // Dispositivos Eletrônicos (Clientes Wi-Fi)
    tv: {
      icon: '📺',
      shortName: '📺 Smart TV',
      defaultName: 'Smart TV',
      accentColor: '#70a1ff',
      getTag: (d) => {
        const isPowered = d.is_active !== false;
        if (!isPowered) return '⚪ Desligado';
        return d.receiver_metrics?.current_rssi_dbm ? `🟢 RSSI: ${d.receiver_metrics.current_rssi_dbm} dBm` : '🟢 Conectado';
      }
    },
    pc: {
      icon: '🖥️',
      shortName: '🖥️ PC',
      defaultName: 'Computador PC',
      accentColor: '#70a1ff',
      getTag: (d) => {
        const isPowered = d.is_active !== false;
        if (!isPowered) return '⚪ Desligado';
        return d.receiver_metrics?.current_rssi_dbm ? `🟢 RSSI: ${d.receiver_metrics.current_rssi_dbm} dBm` : '🟢 Conectado';
      }
    },
    laptop: {
      icon: '💻',
      shortName: '💻 Notebook',
      defaultName: 'Notebook',
      accentColor: '#70a1ff',
      getTag: (d) => {
        const isPowered = d.is_active !== false;
        if (!isPowered) return '⚪ Desligado';
        return d.receiver_metrics?.current_rssi_dbm ? `🟢 RSSI: ${d.receiver_metrics.current_rssi_dbm} dBm` : '🟢 Conectado';
      }
    },
    videogame: {
      icon: '🎮',
      shortName: '🎮 Console',
      defaultName: 'Console Gamer',
      accentColor: '#a55eea',
      getTag: (d) => {
        const isPowered = d.is_active !== false;
        if (!isPowered) return '⚪ Desligado';
        return d.receiver_metrics?.current_rssi_dbm ? `🟢 RSSI: ${d.receiver_metrics.current_rssi_dbm} dBm` : '🟢 Conectado';
      }
    },
    phone: {
      icon: '📱',
      shortName: '📱 Celular',
      defaultName: 'Smartphone',
      accentColor: '#2ed573',
      getTag: (d) => {
        const isPowered = d.is_active !== false;
        if (!isPowered) return '⚪ Desligado';
        return d.receiver_metrics?.current_rssi_dbm ? `🟢 RSSI: ${d.receiver_metrics.current_rssi_dbm} dBm` : '🟢 Conectado';
      }
    },

    // Mobiliário Arquitetural
    table: {
      icon: '🪑',
      shortName: '🪑 Mesa',
      defaultName: 'Mesa de Jantar',
      accentColor: '#e67e22',
      getTag: () => 'Atenuação: -1.5 dB'
    },
    bed: {
      icon: '🛏️',
      shortName: '🛏️ Cama',
      defaultName: 'Cama Casal',
      accentColor: '#747d8c',
      getTag: () => 'Atenuação: -2.0 dB'
    },
    sofa: {
      icon: '🛋️',
      shortName: '🛋️ Sofá',
      defaultName: 'Sofá Estofado',
      accentColor: '#34495e',
      getTag: () => 'Atenuação: -3.0 dB'
    },
    wardrobe: {
      icon: '🚪',
      shortName: '🚪 Armário',
      defaultName: 'Guarda-Roupa',
      accentColor: '#57606f',
      getTag: () => 'Atenuação: -5.0 dB'
    },

    // Bloqueios Físicos e Fontes de Interferência RF
    fridge: {
      icon: '🧊',
      shortName: '🧊 Geladeira',
      defaultName: 'Geladeira (Inox)',
      accentColor: '#e74c3c',
      getTag: () => 'Bloqueio RF: -25 dB'
    },
    microwave: {
      icon: '⚠️',
      shortName: '⚠️ Micro-ondas',
      defaultName: 'Forno Micro-ondas',
      accentColor: '#e74c3c',
      getTag: (d) => {
        const isPowered = d.rf_config ? (d.rf_config.is_active !== false) : (d.is_active !== false);
        return isPowered ? '⚠️ Ruído Ativo 2.4 GHz' : '⚪ Desligado (Sem Ruído)';
      }
    },
    mirror_obj: {
      icon: '🪞',
      shortName: '🪞 Espelho',
      defaultName: 'Espelho de Parede',
      accentColor: '#0984e3',
      getTag: () => 'Reflexão RF: -14 dB'
    },
    aquarium: {
      icon: '🐠',
      shortName: '🐠 Aquário',
      defaultName: 'Aquário de Água',
      accentColor: '#00a8ff',
      getTag: () => 'Atenuação: -16 dB'
    },
    cordless_phone: {
      icon: '☎️',
      shortName: '☎️ Telefone',
      defaultName: 'Telefone Sem Fio',
      accentColor: '#f39c12',
      getTag: (d) => {
        const isPowered = d.rf_config ? (d.rf_config.is_active !== false) : (d.is_active !== false);
        return isPowered ? '⚠️ Interferência 2.4 GHz' : '⚪ Desligado (Sem Ruído)';
      }
    },

    // Aberturas Arquiteturais Integradas
    door: {
      icon: '🚪',
      shortName: '🚪 Porta',
      defaultName: 'Porta de Madeira',
      accentColor: '#00d2d3',
      getTag: (d) => {
        const isOutward = d.swing_direction === 'outward' || d.flip_swing === true;
        const isRight = d.hinge_side === 'right';
        const dir = isOutward ? 'Para fora' : 'Para dentro';
        const side = isRight ? 'Direita' : 'Esquerda';
        return `${dir} • ${side} ↻`;
      }
    },
    window: {
      icon: '🪟',
      shortName: '🪟 Janela',
      defaultName: 'Janela de Vidro',
      accentColor: '#74b9ff',
      getTag: () => 'Vidro: -2.0 dB'
    }
  };

  class SceneRenderer {
    constructor() {
      this.canvas = null;
      this.ctx = null;
      this.animationFrameId = null;
      this.waveTime = 0;
      this.isRunning = false;
    }

    init(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.startLoop();
    }

    startLoop() {
      if (this.isRunning) return;
      this.isRunning = true;

      const loop = (timestamp) => {
        if (!this.isRunning) return;
        this.animationFrameId = requestAnimationFrame(loop);
        this.waveTime = timestamp * 0.00085; // Velocidade suave e cadenciada (~58% mais lenta para identificação visual fácil)
        try {
          this.render();
        } catch (err) {
          console.error('[WifiSim Renderer Error]:', err);
        }
      };

      this.animationFrameId = requestAnimationFrame(loop);
    }

    stopLoop() {
      this.isRunning = false;
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
    }

    render() {
      if (!this.canvas || !this.ctx) return;
      const ctx = this.ctx;
      const width = this.canvas.width;
      const height = this.canvas.height;
      const state = window.WifiSim.State;
      const scene = state ? state.scene : null;
      if (!scene) return;

      const ppm = scene.dimensions.pixels_per_meter || 60;

      // Limpa com transparência total para revelar o Heatmap inferior
      ctx.clearRect(0, 0, width, height);

      // 1. Grade sutil de fundo (se ativada)
      if (scene.grid && scene.grid.show_grid) {
        this.drawGrid(ctx, width, height, ppm);
      }

      // 2. Frentes de onda concêntricas dinâmicas (60 FPS: Wi-Fi e Fontes de Ruído/Interferência)
      this.drawWaves(ctx, scene, ppm);
      this.drawNoiseWaves(ctx, scene, ppm);

      // 3. Paredes estruturais
      this.drawWalls(ctx, scene, ppm, state.selectedItem);

      // 4. Dispositivos e Receptores
      this.drawDevices(ctx, scene, ppm, state.selectedItem);

      // 5. Camada de Feedback e Guias de Interação (Snap magnético de paredes e objetos)
      this.drawInteractionOverlay(ctx, ppm, state);

      // 6. Camada Mestra Superior de Seleção Padronizada (Gizmos + Bounding Box + Badge Universal)
      this.drawSelectedItemOverlay(ctx, scene, ppm, state.selectedItem);
    }

    drawGrid(ctx, width, height, ppm) {
      const step = ppm * 1.0; // Linha a cada 1 metro
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;

      for (let x = 0; x <= width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let y = 0; y <= height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    /**
     * Desenha um anel de onda concêntrico com alto contraste em três camadas:
     * 1. Borda/halo escuro externo para contrastar contra fundos verdes/claros do mapa de calor.
     * 2. Traço de corpo colorido neon vibrante (verde elétrico em 2.4 GHz e ciano elétrico em 5.0 GHz).
     * 3. Crista central luminosa de alta definição (efeito radar / frentes de onda nítidas).
     */
    drawWaveRing(ctx, cx, cy, radius, baseColorRgb, alpha, lineWidth = 3.6) {
      if (radius <= 0 || alpha <= 0.01) return;

      // Camada 1: Sombra/Borda de contraste escuro exterior (separa da cor de fundo do heatmap)
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(10, 15, 20, ${Math.min(1, alpha * 0.85)})`;
      ctx.lineWidth = lineWidth + 3.0;
      ctx.stroke();

      // Camada 2: Traço principal colorido neon vibrante
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${baseColorRgb}, ${Math.min(1, alpha * 0.95)})`;
      ctx.lineWidth = lineWidth;
      ctx.stroke();

      // Camada 3: Crista de onda central luminosa (alta definição de radar)
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(1, alpha * 0.80)})`;
      ctx.lineWidth = Math.max(1.2, lineWidth * 0.36);
      ctx.stroke();
    }

    drawWaves(ctx, scene, ppm) {
      if (!scene.devices) return;
      const transmitters = scene.devices.filter(
        (d) => d.category === 'transmitter' && d.rf_config && d.rf_config.is_active
      );

      ctx.save();
      for (const tx of transmitters) {
        const cx = tx.position.x * ppm;
        const cy = tx.position.y * ppm;
        const freqMode = tx.rf_config.frequency_mode || (tx.rf_config.frequency_ghz === 2.4 ? '2.4' : tx.rf_config.frequency_ghz === 'multi' ? 'multi' : '5.0');

        if (freqMode === '2.4') {
          // 2.4 GHz: Comprimento de onda maior (~12.5 cm), frentes de onda amplas, espaçadas e lentas
          const maxRadius = ppm * 6.2;
          const waveCount = 4;
          for (let i = 0; i < waveCount; i++) {
            const progress = (this.waveTime * 0.65 + i / waveCount) % 1;
            const currentRadius = progress * maxRadius;
            const alpha = Math.pow(1 - progress, 0.70) * 0.85;

            // Verde-Elétrico / Esmeralda Neon de Alto Contraste (2.4 GHz)
            this.drawWaveRing(ctx, cx, cy, currentRadius, '0, 255, 136', alpha, 3.8);
          }
        } else if (freqMode === '5.0') {
          // 5.0 GHz: Comprimento de onda menor (~6 cm), frequência superior, anéis mais densos
          const maxRadius = ppm * 5.0;
          const waveCount = 6;
          for (let i = 0; i < waveCount; i++) {
            const progress = (this.waveTime * 0.95 + i / waveCount) % 1;
            const currentRadius = progress * maxRadius;
            const alpha = Math.pow(1 - progress, 0.70) * 0.85;

            // Ciano-Neon / Azul Turquesa Elétrico de Alto Contraste (5.0 GHz)
            this.drawWaveRing(ctx, cx, cy, currentRadius, '0, 240, 255', alpha, 2.8);
          }
        } else {
          // Múltiplo / Dual-Band: Emissão harmônica simultânea das duas portadoras
          // 1. Portadora 2.4 GHz (ampla, espaçada, verde elétrico)
          const maxRadius24 = ppm * 6.2;
          const waveCount24 = 4;
          for (let i = 0; i < waveCount24; i++) {
            const progress = (this.waveTime * 0.65 + i / waveCount24) % 1;
            const currentRadius = progress * maxRadius24;
            const alpha = Math.pow(1 - progress, 0.70) * 0.75;
            this.drawWaveRing(ctx, cx, cy, currentRadius, '0, 255, 136', alpha, 3.4);
          }

          // 2. Portadora 5.0 GHz (densa, ciano neon)
          const maxRadius50 = ppm * 5.0;
          const waveCount50 = 5;
          for (let i = 0; i < waveCount50; i++) {
            const progress = (this.waveTime * 0.95 + i / waveCount50) % 1;
            const currentRadius = progress * maxRadius50;
            const alpha = Math.pow(1 - progress, 0.70) * 0.80;
            this.drawWaveRing(ctx, cx, cy, currentRadius, '0, 240, 255', alpha, 2.6);
          }

          // Halo pulsante sutil no núcleo indicando ponto de emissão RF
          const pulse = (Math.sin(this.waveTime * 3) * 0.5 + 0.5);
          const coreRadius = pulse * 8 + 14;
          ctx.beginPath();
          ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.lineWidth = 3.5;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(241, 196, 15, ${0.4 + pulse * 0.4})`;
          ctx.lineWidth = 2.0;
          ctx.stroke();
        }
      }
      ctx.beginPath();
      ctx.restore();
    }

    /**
     * Renderiza as frentes de onda de interferência eletromagnética emitidas por fontes de ruído ativas (ex: forno micro-ondas).
     * Camada: Frentes de onda RF (posicionada sobre o heatmap e sob as paredes/dispositivos).
     * Desenha anéis concêntricos pulsantes tracejados com alto contraste e isolamento estrito de path.
     */
    drawNoiseWaves(ctx, scene, ppm) {
      if (!scene || !scene.devices) return;
      const noiseSources = scene.devices.filter(
        (d) => d.category === 'noise_source' && d.rf_config && d.rf_config.is_active !== false && d.is_active !== false
      );
      if (noiseSources.length === 0) return;

      ctx.save();
      for (const dev of noiseSources) {
        const cx = dev.position.x * ppm;
        const cy = dev.position.y * ppm;
        const noiseRadius = (dev.rf_config.interference_radius_m || 3.5) * ppm;
        const rippleCount = 3;

        for (let i = 0; i < rippleCount; i++) {
          const progress = (this.waveTime * 0.75 + i / rippleCount) % 1;
          const r = progress * noiseRadius;
          const alpha = Math.pow(1 - progress, 0.70) * 0.75;
          if (r <= 2 || alpha <= 0.01) continue;

          // Camada 1: Halo escuro exterior para contraste contra o heatmap
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(10, 15, 20, ${alpha * 0.85})`;
          ctx.lineWidth = 4.2;
          ctx.setLineDash([6, 6]);
          ctx.stroke();

          // Camada 2: Linha tracejada vermelha/âmbar neon vibrante (alerta de interferência RF)
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 71, 87, ${alpha})`;
          ctx.lineWidth = 2.4;
          ctx.setLineDash([6, 6]);
          ctx.stroke();

          // Camada 3: Crista luminosa interior de alta definição
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 235, 235, ${alpha * 0.75})`;
          ctx.lineWidth = 1.0;
          ctx.setLineDash([6, 6]);
          ctx.stroke();
        }

        // Halo pulsante no núcleo indicando ponto de fuga/emissão de ruído
        const pulse = (Math.sin(this.waveTime * 4) * 0.5 + 0.5);
        const coreRadius = pulse * 6 + 10;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.lineWidth = 3.0;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(231, 76, 60, ${0.4 + pulse * 0.4})`;
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Limpeza explícita do path do emissor
        ctx.beginPath();
      }
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.restore();
    }

    drawWalls(ctx, scene, ppm, selectedItem) {
      if (!scene.walls) return;
      const RF = window.WifiSim.Core.RF;

      for (const wall of scene.walls) {
        const p1x = wall.p1.x * ppm;
        const p1y = wall.p1.y * ppm;
        const p2x = wall.p2.x * ppm;
        const p2y = wall.p2.y * ppm;

        const isSelected = selectedItem && selectedItem.type === 'wall' && selectedItem.id === wall.id;
        const mat = (RF && RF.MATERIALS[wall.material]) || { color: '#ffffff' };
        const thicknessPx = Math.max(4, (wall.thickness_m || 0.15) * ppm);

        ctx.save();

        if (wall.material === 'vidro') {
          // Janela de Vidro: Traço duplo com miolo translúcido
          ctx.beginPath();
          ctx.moveTo(p1x, p1y);
          ctx.lineTo(p2x, p2y);
          ctx.lineWidth = thicknessPx + 4;
          ctx.strokeStyle = 'rgba(116, 185, 255, 0.25)';
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(p1x, p1y);
          ctx.lineTo(p2x, p2y);
          ctx.lineWidth = 3;
          ctx.strokeStyle = isSelected ? '#00d2d3' : '#74b9ff';
          ctx.stroke();
        } else if (wall.material === 'madeira') {
          // Porta de Madeira: Desenha batente e folha
          ctx.beginPath();
          ctx.moveTo(p1x, p1y);
          ctx.lineTo(p2x, p2y);
          ctx.lineWidth = thicknessPx;
          ctx.lineCap = 'square';
          ctx.strokeStyle = isSelected ? '#00d2d3' : '#e17055';
          ctx.stroke();

          // Arco de abertura da porta em linha pontilhada
          const wallLen = Math.hypot(p2x - p1x, p2y - p1y);
          const angle = Math.atan2(p2y - p1y, p2x - p1x);
          ctx.beginPath();
          ctx.setLineDash([4, 4]);
          ctx.arc(p1x, p1y, wallLen * 0.85, angle, angle + Math.PI / 2);
          ctx.strokeStyle = 'rgba(225, 112, 85, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (wall.material === 'espelho') {
          // Espelho de Parede: Traço com brilho metálico
          ctx.beginPath();
          ctx.moveTo(p1x, p1y);
          ctx.lineTo(p2x, p2y);
          ctx.lineWidth = thicknessPx;
          ctx.strokeStyle = isSelected ? '#00d2d3' : '#0984e3';
          ctx.stroke();

          // Traço de reflexão interno
          ctx.beginPath();
          ctx.moveTo(p1x, p1y);
          ctx.lineTo(p2x, p2y);
          ctx.lineWidth = 2;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.stroke();
        } else {
          // Paredes convencionais (alvenaria, concreto, drywall)
          ctx.beginPath();
          ctx.moveTo(p1x, p1y);
          ctx.lineTo(p2x, p2y);
          ctx.lineWidth = thicknessPx;
          ctx.lineCap = 'round';
          ctx.strokeStyle = isSelected ? '#00d2d3' : mat.color;
          ctx.stroke();
        }

        // Se selecionada, desenha alças de ancoragem e rótulo de alto contraste
        if (isSelected) {
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#ffffff';
          ctx.fillStyle = '#00d2d3';

          // Vértice P1
          ctx.beginPath();
          ctx.arc(p1x, p1y, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Vértice P2
          ctx.beginPath();
          ctx.arc(p2x, p2y, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          // Os rótulos de identificação mestre são renderizados no top layer por drawSelectedItemOverlay
        }
        ctx.restore();
      }
    }

    drawDevices(ctx, scene, ppm, selectedItem) {
      if (!scene.devices) return;

      for (const dev of scene.devices) {
        const x = dev.position.x * ppm;
        const y = dev.position.y * ppm;
        const w = (dev.size.width_m || 0.5) * ppm;
        const h = (dev.size.height_m || 0.5) * ppm;
        const halfW = w / 2;
        const halfH = h / 2;
        const isSelected = selectedItem && selectedItem.type === 'device' && selectedItem.id === dev.id;

        ctx.save();
        ctx.beginPath();
        ctx.translate(x, y);
        if (dev.rotation_deg) {
          ctx.rotate((dev.rotation_deg * Math.PI) / 180);
        }

        // -------------------------------------------------------------
        // Renderização Específica por Tipo de Componente
        // -------------------------------------------------------------
        const type = dev.type || 'router_gateway';
        const isPowered = dev.rf_config ? (dev.rf_config.is_active !== false) : (dev.is_active !== false);

        // 1. Roteadores e Pontos de Acesso Wi-Fi
        if (type === 'router_gateway') {
          // Chassi arredondado moderno
          ctx.fillStyle = isPowered ? '#1e272e' : '#14181c';
          ctx.beginPath();
          ctx.roundRect(-halfW, -halfH, w, h, 6);
          ctx.fill();
          ctx.lineWidth = isSelected ? 2.5 : 1.5;
          ctx.strokeStyle = isSelected ? '#00d2d3' : (isPowered ? '#00b894' : '#485460');
          ctx.stroke();

          // Antenas externas (4 cantos/traseira)
          ctx.fillStyle = isPowered ? '#00b894' : '#485460';
          ctx.fillRect(-halfW - 3, -halfH + 4, 3, 10);
          ctx.fillRect(halfW, -halfH + 4, 3, 10);

          // LEDs frontais acesos ou apagados
          ctx.fillStyle = isPowered ? '#2ecc71' : '#2f3542';
          ctx.beginPath();
          ctx.arc(-8, halfH - 6, 2.5, 0, Math.PI * 2);
          ctx.arc(-2, halfH - 6, 2.5, 0, Math.PI * 2);
          ctx.arc(4, halfH - 6, 2.5, 0, Math.PI * 2);
          ctx.arc(10, halfH - 6, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Ícone central de emissor
          ctx.save();
          if (!isPowered) ctx.globalAlpha = 0.4;
          ctx.font = '14px system-ui';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('📶', 0, -2);
          ctx.restore();
        } else if (type === 'mesh_node') {
          // Nó Mesh cilíndrico / torre moderna
          ctx.fillStyle = isPowered ? '#1e272e' : '#14181c';
          ctx.beginPath();
          ctx.arc(0, 0, Math.min(halfW, halfH), 0, Math.PI * 2);
          ctx.fill();
          ctx.lineWidth = isSelected ? 2.5 : 1.5;
          ctx.strokeStyle = isSelected ? '#00d2d3' : (isPowered ? '#0984e3' : '#485460');
          ctx.stroke();

          // Anel de status luminoso Mesh
          ctx.beginPath();
          ctx.arc(0, 0, Math.min(halfW, halfH) * 0.65, 0, Math.PI * 2);
          ctx.strokeStyle = isPowered ? 'rgba(0, 210, 211, 0.7)' : 'rgba(72, 84, 96, 0.4)';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.save();
          if (!isPowered) ctx.globalAlpha = 0.4;
          ctx.font = '13px system-ui';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('📡', 0, 0);
          ctx.restore();
        }
        // 2. Dispositivos Eletrônicos (Clientes)
        else if (type === 'tv') {
          // Smart TV ultrafina em suporte
          ctx.fillStyle = '#090a0c';
          ctx.fillRect(-halfW, -halfH, w, h);
          ctx.lineWidth = isSelected ? 2 : 1;
          ctx.strokeStyle = isSelected ? '#00d2d3' : (isPowered ? '#74b9ff' : '#485460');
          ctx.strokeRect(-halfW, -halfH, w, h);

          // Tela com brilho (apenas quando ligada)
          if (isPowered) {
            ctx.fillStyle = 'rgba(116, 185, 255, 0.15)';
            ctx.fillRect(-halfW + 2, -halfH + 2, w - 4, h - 4);
          }

          // LED indicador ligado/desligado
          ctx.fillStyle = isPowered ? '#0984e3' : '#2f3542';
          ctx.beginPath();
          ctx.arc(0, halfH - 2, 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (type === 'pc') {
          // Monitor e gabinete
          ctx.fillStyle = isPowered ? '#22272e' : '#16191d';
          ctx.beginPath();
          ctx.roundRect(-halfW, -halfH, w, h, 4);
          ctx.fill();
          ctx.strokeStyle = isSelected ? '#00d2d3' : (isPowered ? '#57606f' : '#3d4450');
          ctx.stroke();

          // Monitor
          if (isPowered) {
            ctx.fillStyle = 'rgba(0, 210, 211, 0.2)';
            ctx.fillRect(-halfW + 4, -halfH + 4, w - 8, h - 10);
          }
          ctx.save();
          if (!isPowered) ctx.globalAlpha = 0.4;
          ctx.font = '12px system-ui';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🖥️', 0, 0);
          ctx.restore();
        } else if (type === 'laptop') {
          // Notebook aberto
          ctx.fillStyle = isPowered ? '#2f3542' : '#1c2028';
          ctx.beginPath();
          ctx.roundRect(-halfW, -halfH, w, h, 3);
          ctx.fill();
          ctx.strokeStyle = isSelected ? '#00d2d3' : (isPowered ? '#70a1ff' : '#485460');
          ctx.stroke();

          if (isPowered) {
            ctx.fillStyle = 'rgba(112, 161, 255, 0.25)';
            ctx.fillRect(-halfW + 3, -halfH + 3, w - 6, h * 0.55);
          }
          ctx.save();
          if (!isPowered) ctx.globalAlpha = 0.4;
          ctx.font = '12px system-ui';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('💻', 0, 0);
          ctx.restore();
        } else if (type === 'videogame') {
          // Console de jogos
          ctx.fillStyle = isPowered ? '#1e272e' : '#14181c';
          ctx.beginPath();
          ctx.roundRect(-halfW, -halfH, w, h, 4);
          ctx.fill();
          ctx.strokeStyle = isSelected ? '#00d2d3' : (isPowered ? '#a55eea' : '#485460');
          ctx.stroke();

          // Barra de luz LED console
          ctx.fillStyle = isPowered ? '#a55eea' : '#2f3542';
          ctx.fillRect(-halfW + 4, -halfH + 3, w - 8, 3);
          ctx.save();
          if (!isPowered) ctx.globalAlpha = 0.4;
          ctx.font = '12px system-ui';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🎮', 0, 2);
          ctx.restore();
        } else if (type === 'phone') {
          // Smartphone
          ctx.fillStyle = isPowered ? '#1e272e' : '#14181c';
          ctx.beginPath();
          ctx.roundRect(-halfW, -halfH, w, h, 4);
          ctx.fill();
          ctx.strokeStyle = isSelected ? '#00d2d3' : (isPowered ? '#2ed573' : '#485460');
          ctx.stroke();
          ctx.save();
          if (!isPowered) ctx.globalAlpha = 0.4;
          ctx.font = '10px system-ui';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('📱', 0, 0);
          ctx.restore();
        }
        // 3. Mobiliário Arquitetural
        else if (type === 'bed') {
          // Cama de Casal: Cabeceira, colchão, lençol e travesseiros
          ctx.fillStyle = '#2f3542';
          ctx.fillRect(-halfW, -halfH, w, h);
          ctx.strokeStyle = isSelected ? '#00d2d3' : '#747d8c';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-halfW, -halfH, w, h);

          // Cabeceira
          ctx.fillStyle = '#1e272e';
          ctx.fillRect(-halfW, -halfH, w, h * 0.15);

          // Dois travesseiros
          const pillowW = w * 0.38;
          const pillowH = h * 0.2;
          ctx.fillStyle = '#f1f2f6';
          ctx.beginPath();
          ctx.roundRect(-halfW + w * 0.08, -halfH + h * 0.18, pillowW, pillowH, 3);
          ctx.roundRect(halfW - w * 0.08 - pillowW, -halfH + h * 0.18, pillowW, pillowH, 3);
          ctx.fill();

          // Dobra do edredom
          ctx.strokeStyle = '#57606f';
          ctx.beginPath();
          ctx.moveTo(-halfW, -halfH + h * 0.45);
          ctx.lineTo(halfW, -halfH + h * 0.45);
          ctx.stroke();
        } else if (type === 'sofa') {
          // Sofá estofado com encosto e almofadas
          ctx.fillStyle = '#2c3e50';
          ctx.beginPath();
          ctx.roundRect(-halfW, -halfH, w, h, 6);
          ctx.fill();
          ctx.strokeStyle = isSelected ? '#00d2d3' : '#34495e';
          ctx.stroke();

          // Encosto superior
          ctx.fillStyle = '#1a252f';
          ctx.fillRect(-halfW, -halfH, w, h * 0.3);

          // Braços laterais
          ctx.fillRect(-halfW, -halfH, w * 0.12, h);
          ctx.fillRect(halfW - w * 0.12, -halfH, w * 0.12, h);

          // Divisão das 3 almofadas
          ctx.strokeStyle = '#1a252f';
          ctx.beginPath();
          ctx.moveTo(-halfW + w * 0.4, -halfH + h * 0.3);
          ctx.lineTo(-halfW + w * 0.4, halfH);
          ctx.moveTo(-halfW + w * 0.7, -halfH + h * 0.3);
          ctx.lineTo(-halfW + w * 0.7, halfH);
          ctx.stroke();
        } else if (type === 'table') {
          // Mesa com cadeiras integradas
          ctx.fillStyle = '#d35400';
          ctx.beginPath();
          ctx.roundRect(-halfW, -halfH, w, h, 4);
          ctx.fill();
          ctx.strokeStyle = isSelected ? '#00d2d3' : '#e67e22';
          ctx.stroke();

          // Tampo de madeira texturizado
          ctx.fillStyle = '#e67e22';
          ctx.fillRect(-halfW + 4, -halfH + 4, w - 8, h - 8);

          ctx.font = '12px system-ui';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🪑', 0, 0);
        } else if (type === 'wardrobe') {
          // Guarda-Roupa / Armário
          ctx.fillStyle = '#34495e';
          ctx.fillRect(-halfW, -halfH, w, h);
          ctx.strokeStyle = isSelected ? '#00d2d3' : '#57606f';
          ctx.strokeRect(-halfW, -halfH, w, h);

          // Portas e puxadores
          ctx.strokeStyle = '#2c3e50';
          ctx.beginPath();
          ctx.moveTo(0, -halfH);
          ctx.lineTo(0, halfH);
          ctx.stroke();

          ctx.fillStyle = '#bdc3c7';
          ctx.beginPath();
          ctx.arc(-4, 0, 2, 0, Math.PI * 2);
          ctx.arc(4, 0, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        // 4. Bloqueios & Fontes de Interferência RF
        else if (type === 'fridge') {
          // Geladeira / Refrigerador em Inox
          const grad = ctx.createLinearGradient(-halfW, 0, halfW, 0);
          grad.addColorStop(0, '#57606f');
          grad.addColorStop(0.5, '#747d8c');
          grad.addColorStop(1, '#57606f');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(-halfW, -halfH, w, h, 4);
          ctx.fill();
          ctx.strokeStyle = isSelected ? '#00d2d3' : '#a4b0be';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Divisão de portas (freezer / refrigerador)
          ctx.strokeStyle = '#2f3542';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-halfW, -halfH + h * 0.35);
          ctx.lineTo(halfW, -halfH + h * 0.35);
          ctx.stroke();

          // Puxadores em metal escovado
          ctx.fillStyle = '#f1f2f6';
          ctx.fillRect(halfW - 6, -halfH + 6, 3, h * 0.25);
          ctx.fillRect(halfW - 6, -halfH + h * 0.4, 3, h * 0.45);

          ctx.font = '12px system-ui';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🧊', 0, 0);
        } else if (type === 'microwave') {
          // Forno de Micro-ondas
          ctx.fillStyle = isPowered ? '#22272e' : '#16191f';
          ctx.beginPath();
          ctx.roundRect(-halfW, -halfH, w, h, 4);
          ctx.fill();
          ctx.strokeStyle = isSelected ? '#00d2d3' : (isPowered ? '#e74c3c' : '#485460');
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Janela frontal de visualização com blindagem
          ctx.fillStyle = '#0f1318';
          ctx.fillRect(-halfW + 4, -halfH + 4, w * 0.65, h - 8);
          ctx.strokeStyle = isPowered ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)';
          ctx.strokeRect(-halfW + 4, -halfH + 4, w * 0.65, h - 8);

          // Painel digital lateral
          ctx.fillStyle = isPowered ? '#2ecc71' : '#2f3542';
          ctx.font = '8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(isPowered ? '12:00' : '--:--', halfW - (w * 0.15), -halfH + 10);

          ctx.save();
          if (!isPowered) ctx.globalAlpha = 0.4;
          ctx.font = '11px system-ui';
          ctx.fillText('⚠️', -halfW + (w * 0.35), 0);
          ctx.restore();
        } else if (type === 'mirror_obj') {
          // Espelho de Parede / Corpo
          const grad = ctx.createLinearGradient(-halfW, -halfH, halfW, halfH);
          grad.addColorStop(0, '#74b9ff');
          grad.addColorStop(0.5, '#ffffff');
          grad.addColorStop(1, '#0984e3');
          ctx.fillStyle = grad;
          ctx.fillRect(-halfW, -halfH, w, h);
          ctx.strokeStyle = isSelected ? '#00d2d3' : '#dfe4ea';
          ctx.lineWidth = 2;
          ctx.strokeRect(-halfW, -halfH, w, h);

          // Listras diagonais de reflexão espelhada
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-halfW + 6, halfH - 2);
          ctx.lineTo(-halfW + 16, -halfH + 2);
          ctx.moveTo(halfW - 16, halfH - 2);
          ctx.lineTo(halfW - 6, -halfH + 2);
          ctx.stroke();
        } else if (type === 'aquarium') {
          // Aquário de Água
          ctx.fillStyle = 'rgba(0, 168, 255, 0.45)';
          ctx.fillRect(-halfW, -halfH, w, h);
          ctx.strokeStyle = isSelected ? '#00d2d3' : '#00a8ff';
          ctx.lineWidth = 2;
          ctx.strokeRect(-halfW, -halfH, w, h);

          ctx.font = '12px system-ui';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🐠', 0, 0);
        } else if (type === 'cordless_phone') {
          // Telefone Sem Fio 2.4 GHz
          ctx.fillStyle = isPowered ? '#2f3542' : '#1c2028';
          ctx.beginPath();
          ctx.roundRect(-halfW, -halfH, w, h, 4);
          ctx.fill();
          ctx.strokeStyle = isSelected ? '#00d2d3' : (isPowered ? '#f39c12' : '#485460');
          ctx.stroke();

          ctx.save();
          if (!isPowered) ctx.globalAlpha = 0.4;
          ctx.font = '12px system-ui';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('☎️', 0, 0);
          ctx.restore();
        } else if (type === 'door') {
          // -------------------------------------------------------------
          // Porta de Madeira Integrada na Parede (Planta Baixa Arquitetural)
          // -------------------------------------------------------------
          // 1. Vão de abertura na parede
          ctx.fillStyle = '#121418';
          ctx.fillRect(-halfW, -halfH - 1, w, h + 2);

          // 2. Batentes nas extremidades do vão (madeira escura)
          ctx.fillStyle = '#8b572a';
          ctx.fillRect(-halfW - 2, -halfH, 4, h);
          ctx.fillRect(halfW - 2, -halfH, 4, h);

          // 3. Sentido de abertura da folha e lado da dobradiça (4 quadrantes)
          const isOutward = dev.swing_direction === 'outward' || dev.flip_swing === true;
          const isRight = dev.hinge_side === 'right';

          const hingeX = isRight ? halfW : -halfW;
          const hingeY = isOutward ? halfH : -halfH;
          const leafX = isRight ? halfW - 6 : -halfW;
          const leafY = isOutward ? halfH - w : -halfH;
          const handleX = isRight ? halfW - 3 : -halfW + 3;
          const handleY = isOutward ? halfH - w + 8 : -halfH + w - 8;

          // Arcos de abertura nos 4 quadrantes
          let arcStart = 0;
          let arcEnd = Math.PI / 2;
          if (!isRight && !isOutward) {
            arcStart = 0;
            arcEnd = Math.PI / 2;
          } else if (!isRight && isOutward) {
            arcStart = -Math.PI / 2;
            arcEnd = 0;
          } else if (isRight && isOutward) {
            arcStart = -Math.PI;
            arcEnd = -Math.PI / 2;
          } else if (isRight && !isOutward) {
            arcStart = Math.PI / 2;
            arcEnd = Math.PI;
          }

          ctx.save();
          ctx.beginPath();
          ctx.fillStyle = isSelected ? '#00d2d3' : '#d35400';
          ctx.strokeStyle = '#e17055';
          ctx.lineWidth = 1.5;
          ctx.roundRect(leafX, leafY, 6, w, 2);
          ctx.fill();
          ctx.stroke();

          // Maçaneta metálica sutil
          ctx.fillStyle = '#f1c40f';
          ctx.beginPath();
          ctx.arc(handleX, handleY, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // 4. Arco pontilhado de abertura do giro da porta (raio w)
          ctx.beginPath();
          ctx.setLineDash([3, 3]);
          ctx.strokeStyle = isSelected ? 'rgba(0, 210, 211, 0.7)' : 'rgba(225, 112, 85, 0.5)';
          ctx.lineWidth = 1.2;
          ctx.arc(hingeX, hingeY, w, arcStart, arcEnd);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        } else if (type === 'window') {
          // -------------------------------------------------------------
          // Janela de Vidro Integrada na Parede
          // -------------------------------------------------------------
          // 1. Vão na parede com miolo translúcido de vidro
          ctx.fillStyle = 'rgba(116, 185, 255, 0.35)';
          ctx.fillRect(-halfW, -halfH, w, h);

          // 2. Moldura e batentes laterais (alumínio/madeira clara)
          ctx.fillStyle = '#b2bec3';
          ctx.fillRect(-halfW - 2, -halfH, 4, h);
          ctx.fillRect(halfW - 2, -halfH, 4, h);

          // 3. Vidro duplo com linhas duplas em ciano/azul
          ctx.beginPath();
          ctx.strokeStyle = isSelected ? '#00d2d3' : '#74b9ff';
          ctx.lineWidth = 2;
          ctx.moveTo(-halfW, -2);
          ctx.lineTo(halfW, -2);
          ctx.moveTo(-halfW, 2);
          ctx.lineTo(halfW, 2);
          ctx.stroke();

          // 4. Divisória central vertical (montante da janela)
          ctx.beginPath();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.moveTo(0, -halfH);
          ctx.lineTo(0, halfH);
          ctx.stroke();

          // 5. Brilho reflexivo em diagonal no vidro
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 1.5;
          ctx.moveTo(-halfW * 0.4, -halfH + 2);
          ctx.lineTo(-halfW * 0.1, halfH - 2);
          ctx.moveTo(halfW * 0.2, -halfH + 2);
          ctx.lineTo(halfW * 0.5, halfH - 2);
          ctx.stroke();
        } else {
          // Renderização fallback elegante
          ctx.fillStyle = '#2d3436';
          ctx.beginPath();
          ctx.roundRect(-halfW, -halfH, w, h, 4);
          ctx.fill();
          ctx.strokeStyle = isSelected ? '#00d2d3' : '#a4b0be';
          ctx.stroke();
        }

        // Se for aparelho eletrônico desligado, renderiza badge sutil de estado "OFF"
        const isElectronic = (dev.category === 'transmitter' || dev.category === 'receiver' || dev.category === 'noise_source' ||
          ['router_gateway', 'mesh_node', 'tv', 'pc', 'laptop', 'videogame', 'phone', 'microwave', 'cordless_phone'].includes(type));
        if (isElectronic && !isPowered) {
          ctx.save();
          const badgeW = 22;
          const badgeH = 11;
          const bx = halfW - badgeW / 2 - 2;
          const by = -halfH + badgeH / 2 + 2;

          ctx.fillStyle = 'rgba(18, 20, 24, 0.92)';
          ctx.beginPath();
          ctx.roundRect(bx - badgeW / 2, by - badgeH / 2, badgeW, badgeH, 2);
          ctx.fill();

          ctx.strokeStyle = '#e74c3c';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.font = 'bold 7.5px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = '#ff7675';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('OFF', bx, by);
          ctx.restore();
        }

        ctx.beginPath();
        ctx.restore();
        ctx.beginPath();
      }
    }



    /**
     * Camada Mestra de Seleção Padronizada (Top Layer)
     * Garante visibilidade absoluta e zero oclusão para qualquer componente,
     * aparelho, móvel, obstáculo ou parede selecionada.
     */
    drawSelectedItemOverlay(ctx, scene, ppm, selectedItem) {
      if (!selectedItem || !scene) return;

      if (selectedItem.type === 'device') {
        const dev = (scene.devices || []).find((d) => d.id === selectedItem.id);
        if (!dev) return;

        const cx = dev.position.x * ppm;
        const cy = dev.position.y * ppm;
        const w = (dev.size.width_m || 0.5) * ppm;
        const h = (dev.size.height_m || 0.5) * ppm;
        const halfW = w / 2;
        const halfH = h / 2;
        const type = dev.type || 'router_gateway';
        const rotRad = ((dev.rotation_deg || 0) * Math.PI) / 180;
        const hasRotationStem = type !== 'door' && type !== 'window';

        // 1. Gizmos de Transformação do Item Selecionado no Top Layer
        ctx.save();
        ctx.translate(cx, cy);
        if (dev.rotation_deg) {
          ctx.rotate(rotRad);
        }

        // Bounding box pontilhada em ciano
        ctx.strokeStyle = '#00d2d3';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(-halfW - 4, -halfH - 4, w + 8, h + 8);
        ctx.setLineDash([]);

        // 4 Alças de ancoragem de canto
        ctx.fillStyle = '#00d2d3';
        const handleSize = 6;
        ctx.fillRect(-halfW - 4 - handleSize / 2, -halfH - 4 - handleSize / 2, handleSize, handleSize);
        ctx.fillRect(halfW + 4 - handleSize / 2, -halfH - 4 - handleSize / 2, handleSize, handleSize);
        ctx.fillRect(-halfW - 4 - handleSize / 2, halfH + 4 - handleSize / 2, handleSize, handleSize);
        ctx.fillRect(halfW + 4 - handleSize / 2, halfH + 4 - handleSize / 2, handleSize, handleSize);

        // Haste e Alça Circular de Rotação Angular (oculta para portas e janelas)
        // Quando a rotação faria a bolinha ficar atrás da etiqueta que fica abaixo do objeto,
        // a alça é reposicionada automaticamente para o lado oposto (pra cima na tela).
        if (hasRotationStem) {
          const Geometry = window.WifiSim?.Core?.Geometry;
          const isFlipped = Geometry?.isRotationHandleFlipped
            ? Geometry.isRotationHandleFlipped(dev, this.canvas?.height, ppm)
            : false;

          const stemStartY = isFlipped ? (halfH + 4) : (-halfH - 4);
          const rotationHandleY = isFlipped ? (halfH + 24) : (-halfH - 24);
          const currentRot = ((dev.rotation_deg || 0) % 360 + 360) % 360;
          const isAngleSnapped = currentRot % 90 === 0;

          ctx.beginPath();
          ctx.moveTo(0, stemStartY);
          ctx.lineTo(0, rotationHandleY);
          ctx.strokeStyle = isAngleSnapped ? '#2ecc71' : '#00d2d3';
          ctx.lineWidth = isAngleSnapped ? 2.5 : 2;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(0, rotationHandleY, isAngleSnapped ? 7 : 6, 0, Math.PI * 2);
          ctx.fillStyle = isAngleSnapped ? '#2ecc71' : '#00d2d3';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Destaque visual numérico com badge de alto contraste quando estiver em ponto de parada (0°, 90°, 180°, 270°)
          if (isAngleSnapped) {
            const snapText = `${currentRot}° 📐`;
            ctx.save();
            ctx.font = 'bold 9px system-ui, -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const snapMetrics = ctx.measureText(snapText);
            const bw = Math.round(snapMetrics.width + 8);
            const bh = 15;
            const by = isFlipped ? (rotationHandleY + 14) : (rotationHandleY - 14);

            ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetY = 1;

            ctx.fillStyle = '#080b12';
            ctx.beginPath();
            ctx.roundRect(-bw / 2, by - bh / 2, bw, bh, 3);
            ctx.fill();

            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#2ecc71';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = '#2ecc71';
            ctx.fillText(snapText, 0, by);
            ctx.restore();
          }
        }
        ctx.restore();

        // 2. Badge Mestre Flutuante de Identificação Padronizada
        this.renderDeviceMasterBadge(ctx, dev, ppm);
      } else if (selectedItem.type === 'wall') {
        const wall = (scene.walls || []).find((w) => w.id === selectedItem.id);
        if (!wall) return;
        this.renderWallMasterBadge(ctx, wall, ppm);
      }
    }

    /**
     * Renderiza o Badge Mestre Flutuante do Dispositivo com design universal padronizado
     */
    renderDeviceMasterBadge(ctx, dev, ppm) {
      const type = dev.type || 'router_gateway';
      const meta = COMPONENT_META[type] || {
        icon: '📦',
        defaultName: 'Objeto',
        accentColor: '#00d2d3',
        getTag: () => 'Componente'
      };

      const title = dev.name || meta.defaultName;
      const tag = meta.getTag(dev);
      const icon = meta.icon;

      ctx.save();
      ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
      const titleMetrics = ctx.measureText(title);
      ctx.font = '9px system-ui, -apple-system, sans-serif';
      const tagMetrics = ctx.measureText(tag);

      const iconW = 16;
      const sepW = 12;
      const padding = 20;
      const bgW = Math.round(iconW + titleMetrics.width + sepW + tagMetrics.width + padding);
      const bgH = 22;

      const cx = dev.position.x * ppm;
      const cy = dev.position.y * ppm;
      const w = (dev.size.width_m || 0.5) * ppm;
      const h = (dev.size.height_m || 0.5) * ppm;

      const rotRad = ((dev.rotation_deg || 0) * Math.PI) / 180;
      const cos = Math.abs(Math.cos(rotRad));
      const sin = Math.abs(Math.sin(rotRad));
      const isDoor = type === 'door';
      const effH = isDoor ? Math.max(h, w) : h;
      const aabbHalfW = (w * cos + effH * sin) / 2;
      const aabbHalfH = (w * sin + effH * cos) / 2;

      const hasRotationStem = type !== 'door' && type !== 'window';

      // Posiciona preferencialmente logo abaixo da caixa delimitadora
      let badgeY = Math.round(cy + aabbHalfH + 16);

      // Se ultrapassar ou ficar muito próximo da borda inferior do canvas, inverte para cima
      if (badgeY + bgH / 2 > this.canvas.height - 8) {
        badgeY = Math.round(cy - aabbHalfH - (hasRotationStem ? 36 : 16));
      }
      // Clamping vertical dentro dos limites do canvas
      badgeY = Math.max(bgH / 2 + 6, Math.min(this.canvas.height - bgH / 2 - 6, badgeY));

      // Clamping horizontal para manter 100% visível na tela
      const badgeX = Math.round(Math.max(bgW / 2 + 8, Math.min(this.canvas.width - bgW / 2 - 8, cx)));

      // Sombra profunda para descolar de qualquer cor do heatmap
      ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 3;

      // Fundo 100% sólido escuro (sem transparência para evitar sangramento)
      ctx.fillStyle = '#080b12';
      ctx.beginPath();
      ctx.roundRect(badgeX - bgW / 2, badgeY - bgH / 2, bgW, bgH, 5);
      ctx.fill();

      // Borda com cor de destaque por categoria
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.strokeStyle = meta.accentColor || '#00d2d3';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Renderização do conteúdo textual
      let startX = badgeX - bgW / 2 + 10;
      const centerY = badgeY;

      // 1. Ícone da categoria
      ctx.font = '11px system-ui';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(icon, startX, centerY);
      startX += iconW;

      // 2. Nome do componente (branco puro em negrito de máxima nitidez)
      ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(title, startX, centerY);
      startX += titleMetrics.width + 4;

      // 3. Separador visual
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.font = '9px system-ui, -apple-system, sans-serif';
      ctx.fillText('•', startX, centerY);
      startX += sepW - 4;

      // 4. Chip/Tag de Especificação RF
      ctx.fillStyle = meta.accentColor || '#00d2d3';
      ctx.fillText(tag, startX, centerY);

      ctx.restore();
    }

    /**
     * Renderiza o Badge Mestre Flutuante da Parede com design universal padronizado
     */
    renderWallMasterBadge(ctx, wall, ppm) {
      const RF = window.WifiSim.Core.RF;
      const mat = (RF && RF.MATERIALS[wall.material]) || { name: 'Parede', db24: 6.5, color: '#00d2d3' };
      const wallLenM = Math.hypot(wall.p2.x - wall.p1.x, wall.p2.y - wall.p1.y);
      const icon = wall.material === 'vidro' ? '🪟' : wall.material === 'madeira' ? '🚪' : wall.material === 'espelho' ? '🪞' : '🧱';
      const title = mat.name || 'Parede';
      const tag = `${wallLenM.toFixed(2)}m • -${mat.db24 || 6.5} dB`;
      const accentColor = '#00d2d3';

      ctx.save();
      ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
      const titleMetrics = ctx.measureText(title);
      ctx.font = '9px system-ui, -apple-system, sans-serif';
      const tagMetrics = ctx.measureText(tag);

      const iconW = 16;
      const sepW = 12;
      const padding = 20;
      const bgW = Math.round(iconW + titleMetrics.width + sepW + tagMetrics.width + padding);
      const bgH = 22;

      const p1x = wall.p1.x * ppm;
      const p1y = wall.p1.y * ppm;
      const p2x = wall.p2.x * ppm;
      const p2y = wall.p2.y * ppm;
      const midX = (p1x + p2x) / 2;
      const midY = (p1y + p2y) / 2;
      const dx = p2x - p1x;
      const dy = p2y - p1y;
      const len = Math.hypot(dx, dy);
      const nx = len > 0 ? -dy / len : 0;
      const ny = len > 0 ? dx / len : -1;

      let badgeX = Math.round(midX + nx * 20);
      let badgeY = Math.round(midY + ny * 20);

      // Clamping nos limites do canvas
      badgeX = Math.max(bgW / 2 + 8, Math.min(this.canvas.width - bgW / 2 - 8, badgeX));
      badgeY = Math.max(bgH / 2 + 6, Math.min(this.canvas.height - bgH / 2 - 6, badgeY));

      ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 3;

      ctx.fillStyle = '#080b12';
      ctx.beginPath();
      ctx.roundRect(badgeX - bgW / 2, badgeY - bgH / 2, bgW, bgH, 5);
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      let startX = badgeX - bgW / 2 + 10;
      const centerY = badgeY;

      ctx.font = '11px system-ui';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(icon, startX, centerY);
      startX += iconW;

      ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(title, startX, centerY);
      startX += titleMetrics.width + 4;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '9px system-ui, -apple-system, sans-serif';
      ctx.fillText('•', startX, centerY);
      startX += sepW - 4;

      ctx.fillStyle = accentColor;
      ctx.fillText(tag, startX, centerY);

      ctx.restore();
    }

    /**
     * Desenha a camada de feedback de interação em tempo real:
     * - Preview pontilhado e cota de parede sendo desenhada com indicação de ortogonalidade 90°
     * - Linhas guias ortogonais quando um vértice de parede está em snap de 90°
     * - Contorno de atração magnética na face da parede quando um objeto está alinhado
     */
    drawInteractionOverlay(ctx, ppm, state) {
      const interaction = window.WifiSim.UI.Interaction;
      if (!interaction) return;

      const RF = window.WifiSim.Core.RF;

      // 1. Pré-visualização de Parede em Construção (Ferramenta Desenhar Parede)
      if (interaction.dragMode === 'draw_wall' && interaction.pendingWallStart && interaction.pendingWallCurrent) {
        const p1 = interaction.pendingWallStart;
        const p2 = interaction.pendingWallCurrent;
        const p1x = p1.x * ppm;
        const p1y = p1.y * ppm;
        const p2x = p2.x * ppm;
        const p2y = p2.y * ppm;

        const lenM = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const isOrthogonal = interaction.activeSnap && interaction.activeSnap.type === 'wall_draw';
        const mat = (RF && RF.MATERIALS[state.currentMaterial]) || { color: '#00d2d3' };

        ctx.save();

        // Linha guia de projeção infinita suave se estiver em snap ortogonal (horizontal/vertical)
        if (isOrthogonal) {
          ctx.beginPath();
          ctx.setLineDash([4, 6]);
          ctx.strokeStyle = 'rgba(46, 204, 113, 0.4)';
          ctx.lineWidth = 1;
          if (interaction.activeSnap.axis === 'horizontal') {
            ctx.moveTo(0, p1y);
            ctx.lineTo(this.canvas.width, p1y);
          } else {
            ctx.moveTo(p1x, 0);
            ctx.lineTo(p1x, this.canvas.height);
          }
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Segmento da parede em construção
        ctx.beginPath();
        ctx.setLineDash([6, 4]);
        ctx.moveTo(p1x, p1y);
        ctx.lineTo(p2x, p2y);
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.strokeStyle = isOrthogonal ? '#2ecc71' : (mat.color || '#00d2d3');
        ctx.stroke();
        ctx.setLineDash([]);

        // Vértices de ancoragem P1 e P2
        ctx.fillStyle = isOrthogonal ? '#2ecc71' : '#00d2d3';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(p1x, p1y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(p2x, p2y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Badge flutuante de alto contraste com a metragem e indicação de ângulo
        const midX = (p1x + p2x) / 2;
        const midY = (p1y + p2y) / 2 - 16;
        const label = isOrthogonal ? `${lenM.toFixed(2)}m [90° 📐]` : `${lenM.toFixed(2)}m`;

        ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
        const textMetrics = ctx.measureText(label);
        const bgW = Math.round(textMetrics.width + 12);
        const bgH = 18;

        ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 2;

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.roundRect(midX - bgW / 2, midY - bgH / 2, bgW, bgH, 4);
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.strokeStyle = isOrthogonal ? '#2ecc71' : '#00d2d3';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = isOrthogonal ? '#2ecc71' : '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, midX, midY);

        ctx.restore();
      }

      // 2. Guias de Alinhamento Ortogonal em Vértices de Parede Existente
      if (interaction.activeSnap && interaction.activeSnap.type === 'wall_vertex' && interaction.activeSnap.anchor) {
        const anchor = interaction.activeSnap.anchor;
        const ay = anchor.y * ppm;
        const ax = anchor.x * ppm;

        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([4, 6]);
        ctx.strokeStyle = 'rgba(46, 204, 113, 0.55)';
        ctx.lineWidth = 1.5;

        if (interaction.activeSnap.axis === 'horizontal') {
          ctx.moveTo(0, ay);
          ctx.lineTo(this.canvas.width, ay);
        } else {
          ctx.moveTo(ax, 0);
          ctx.lineTo(ax, this.canvas.height);
        }
        ctx.stroke();

        // Badge indicador de 90° no ponto móvel
        if (interaction.activeSnap.point) {
          const px = interaction.activeSnap.point.x * ppm;
          const py = interaction.activeSnap.point.y * ppm;
          ctx.fillStyle = 'rgba(46, 204, 113, 0.9)';
          ctx.beginPath();
          ctx.arc(px, py, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        ctx.restore();
      }

      // 3. Efeito Magnético Suave de Objeto Encostado na Parede
      if (interaction.activeSnap && interaction.activeSnap.type === 'device_wall' && interaction.activeSnap.wall) {
        const wall = interaction.activeSnap.wall;
        const p1x = wall.p1.x * ppm;
        const p1y = wall.p1.y * ppm;
        const p2x = wall.p2.x * ppm;
        const p2y = wall.p2.y * ppm;

        ctx.save();
        // Brilho neon suave ao longo da parede ancorada
        ctx.beginPath();
        ctx.moveTo(p1x, p1y);
        ctx.lineTo(p2x, p2y);
        ctx.lineWidth = (wall.thickness_m || 0.15) * ppm + 8;
        ctx.strokeStyle = 'rgba(46, 204, 113, 0.35)';
        ctx.lineCap = 'round';
        ctx.stroke();

        // Se houver dispositivo ativo, mostra pequeno badge magnético de alto contraste
        if (interaction.activeSnap.device) {
          const dev = interaction.activeSnap.device;
          const dx = Math.round(dev.position.x * ppm);
          const dy = Math.round(dev.position.y * ppm - (dev.size.height_m * ppm) / 2 - 16);

          const snapText = '🧲 Encostado na parede';
          ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const sm = ctx.measureText(snapText);
          const sw = Math.round(sm.width + 10);
          const sh = 17;

          ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
          ctx.shadowBlur = 6;
          ctx.shadowOffsetY = 2;

          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.roundRect(dx - sw / 2, dy - sh / 2, sw, sh, 3);
          ctx.fill();

          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.strokeStyle = '#2ecc71';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          ctx.fillStyle = '#2ecc71';
          ctx.fillText(snapText, dx, dy);
        }
        ctx.restore();
      }
    }
  }

  window.WifiSim.UI.Renderer = new SceneRenderer();
})();
