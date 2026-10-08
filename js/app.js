/**
 * Simulador Wi-Fi - Orquestrador Principal da Aplicação
 * Ponto de entrada JavaScript
 * Zero dependências externas - ECMAScript 2020+
 */

(function () {
  'use strict';

  window.WifiSim = window.WifiSim || {};

  function initApp() {
    const heatmapCanvas = document.getElementById('heatmap-canvas');
    const sceneCanvas = document.getElementById('scene-canvas');
    const container = document.getElementById('canvas-container');

    if (!heatmapCanvas || !sceneCanvas || !container) {
      console.warn('[WifiSim] Elementos Canvas não encontrados nesta página.');
      return;
    }

    const state = window.WifiSim.State;
    const renderer = window.WifiSim.UI.Renderer;
    const interaction = window.WifiSim.UI.Interaction;
    const heatmap = window.WifiSim.Core.Heatmap;

    // =========================================================================
    // Sistema de Zoom & Enquadramento (Fit-to-Screen)
    // =========================================================================
    // =========================================================================
    // Sistema de Zoom & Enquadramento (Fit-to-Screen) & Persistência de Viewport
    // =========================================================================
    let currentZoom = (state && state.isRestoredSession && state.viewportState && typeof state.viewportState.zoom === 'number')
      ? Math.min(Math.max(state.viewportState.zoom, 0.20), 3.0)
      : 1.0;

    const scaler = document.getElementById('canvas-scaler');
    const mainViewport = document.getElementById('main-viewport');
    const btnZoomIn = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const btnZoomReset = document.getElementById('btn-zoom-reset');
    const btnZoomFit = document.getElementById('btn-zoom-fit');
    const zoomValueText = document.getElementById('zoom-value-text');

    function saveCurrentViewport() {
      if (!state || !mainViewport) return;
      state.setViewportState({
        zoom: currentZoom,
        scrollLeft: mainViewport.scrollLeft,
        scrollTop: mainViewport.scrollTop
      });
    }

    let scrollSaveTimer = null;
    function debouncedSaveViewport() {
      if (scrollSaveTimer) clearTimeout(scrollSaveTimer);
      scrollSaveTimer = setTimeout(saveCurrentViewport, 150);
    }

    function restoreSavedViewportPosition() {
      if (!state || !state.isRestoredSession || !state.viewportState || !mainViewport) {
        return false;
      }
      const vp = state.viewportState;
      if (typeof vp.zoom === 'number') {
        currentZoom = Math.min(Math.max(vp.zoom, 0.20), 3.0);
        updateZoomTransform(false);
      }
      if (typeof vp.scrollLeft === 'number') {
        mainViewport.scrollLeft = vp.scrollLeft;
      }
      if (typeof vp.scrollTop === 'number') {
        mainViewport.scrollTop = vp.scrollTop;
      }
      return true;
    }

    function updateZoomTransform(smooth = false) {
      if (!state || !state.scene || !scaler || !container) return;
      const ppm = state.scene.dimensions.pixels_per_meter || 60;
      const w = Math.round(state.scene.dimensions.width_m * ppm);
      const h = Math.round(state.scene.dimensions.height_m * ppm);

      if (smooth) {
        scaler.classList.add('smooth-zoom');
        container.classList.add('smooth-zoom');
        setTimeout(() => {
          scaler.classList.remove('smooth-zoom');
          container.classList.remove('smooth-zoom');
        }, 280);
      }

      scaler.style.width = `${Math.round(w * currentZoom)}px`;
      scaler.style.height = `${Math.round(h * currentZoom)}px`;
      container.style.transform = `scale(${currentZoom})`;

      if (zoomValueText) {
        zoomValueText.textContent = `${Math.round(currentZoom * 100)}%`;
      }
    }

    function setZoom(newZoom, smooth = false) {
      const clamped = Math.min(Math.max(Number(newZoom.toFixed(2)), 0.20), 3.0);
      currentZoom = clamped;
      updateZoomTransform(smooth);
      debouncedSaveViewport();
    }

    function zoomIn() {
      setZoom(currentZoom + 0.15, true);
    }

    function zoomOut() {
      setZoom(currentZoom - 0.15, true);
    }

    function resetZoom() {
      setZoom(1.0, true);
    }

    function fitToScreen() {
      if (!state || !state.scene || !mainViewport) return;
      const ppm = state.scene.dimensions.pixels_per_meter || 60;
      const sceneW = state.scene.dimensions.width_m * ppm;
      const sceneH = state.scene.dimensions.height_m * ppm;

      // Mede dimensões úteis reais da viewport por múltiplos métodos defensivos
      const vpRect = mainViewport.getBoundingClientRect ? mainViewport.getBoundingClientRect() : { width: 0, height: 0 };
      const vpW = mainViewport.clientWidth || vpRect.width || mainViewport.offsetWidth || window.innerWidth;
      const vpH = mainViewport.clientHeight || vpRect.height || mainViewport.offsetHeight || (window.innerHeight - 100);

      const isMobile = window.innerWidth <= 720;
      const paddingX = isMobile ? 12 : 28;
      const paddingY = isMobile ? 12 : 28;

      const availW = Math.max(60, vpW - paddingX);
      const availH = Math.max(60, vpH - paddingY);

      if (sceneW <= 0 || sceneH <= 0 || availW <= 60 || availH <= 60) return;

      const scaleX = availW / sceneW;
      const scaleY = availH / sceneH;
      let fitZoom = Math.min(scaleX, scaleY);

      // Permite expandir até 2.5x para aproveitar todo o espaço de telas grandes e monitores
      fitZoom = Math.min(fitZoom, 2.50);
      fitZoom = Math.max(fitZoom, 0.20);
      fitZoom = Number(fitZoom.toFixed(2));

      setZoom(fitZoom, true);

      // Centraliza suavemente o scroll do viewport
      mainViewport.scrollTo({
        left: Math.max(0, (sceneW * fitZoom - vpW) / 2),
        top: Math.max(0, (sceneH * fitZoom - vpH) / 2),
        behavior: 'smooth'
      });

      // Salva a nova visualização enquadrada após a rolagem suave
      setTimeout(saveCurrentViewport, 320);
    }

    if (btnZoomIn) btnZoomIn.addEventListener('click', zoomIn);
    if (btnZoomOut) btnZoomOut.addEventListener('click', zoomOut);
    if (btnZoomReset) btnZoomReset.addEventListener('click', resetZoom);
    if (btnZoomFit) btnZoomFit.addEventListener('click', fitToScreen);

    // Zoom via roda do mouse no desktop (Ctrl/Cmd + Wheel)
    if (mainViewport) {
      mainViewport.addEventListener('wheel', (e) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          const factor = e.deltaY < 0 ? 1.12 : 0.88;
          setZoom(currentZoom * factor, false);
        }
      }, { passive: false });

      // Salva a posição de rolagem com debounce ao rolar a viewport
      mainViewport.addEventListener('scroll', debouncedSaveViewport, { passive: true });
    }

    // Persiste imediatamente ao descarregar a página ou mudar de aba
    window.addEventListener('beforeunload', saveCurrentViewport);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        saveCurrentViewport();
      }
    });

    // Gesto de Pinça (Pinch-to-Zoom) e Pan com 2 dedos no Touchscreen
    let touchStartDist = 0;
    let touchStartZoom = 1.0;
    let touchStartMidX = 0;
    let touchStartMidY = 0;
    let touchStartScrollL = 0;
    let touchStartScrollT = 0;
    let isPinchingActive = false;

    if (mainViewport) {
      mainViewport.addEventListener('touchstart', (e) => {
        if (e.touches.length >= 2) {
          e.preventDefault();
          isPinchingActive = true;
          // Cancela e restaura imediatamente qualquer arraste em andamento na tela
          if (interaction && typeof interaction.cancelDrag === 'function') {
            interaction.cancelDrag(true);
          }
          const t1 = e.touches[0];
          const t2 = e.touches[1];
          touchStartDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
          touchStartZoom = currentZoom;
          touchStartMidX = (t1.clientX + t2.clientX) / 2;
          touchStartMidY = (t1.clientY + t2.clientY) / 2;
          touchStartScrollL = mainViewport.scrollLeft;
          touchStartScrollT = mainViewport.scrollTop;
        }
      }, { passive: false });

      mainViewport.addEventListener('touchmove', (e) => {
        if (e.touches.length >= 2 && touchStartDist > 0) {
          e.preventDefault();
          if (interaction && typeof interaction.cancelDrag === 'function') {
            interaction.cancelDrag(true);
          }
          const t1 = e.touches[0];
          const t2 = e.touches[1];
          const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

          // Calibração de sensibilidade: filtra micro-trepidações (deadband de 5px) para zoom mais estável
          if (Math.abs(currentDist - touchStartDist) > 5) {
            const ratio = currentDist / touchStartDist;
            setZoom(touchStartZoom * ratio, false);
          }

          const midX = (t1.clientX + t2.clientX) / 2;
          const midY = (t1.clientY + t2.clientY) / 2;
          mainViewport.scrollLeft = touchStartScrollL - (midX - touchStartMidX);
          mainViewport.scrollTop = touchStartScrollT - (midY - touchStartMidY);
        }
      }, { passive: false });

      mainViewport.addEventListener('touchend', (e) => {
        if (e.touches.length < 2) {
          touchStartDist = 0;
          if (isPinchingActive) {
            isPinchingActive = false;
            if (interaction && typeof interaction.cancelDrag === 'function') {
              interaction.cancelDrag(true);
            }
          }
          saveCurrentViewport();
        }
      });

      mainViewport.addEventListener('touchcancel', () => {
        touchStartDist = 0;
        isPinchingActive = false;
        if (interaction && typeof interaction.cancelDrag === 'function') {
          interaction.cancelDrag(true);
        }
      });
    }

    function resizeCanvases() {
      if (!state || !state.scene) return;
      const ppm = state.scene.dimensions.pixels_per_meter || 60;
      const w = Math.round(state.scene.dimensions.width_m * ppm);
      const h = Math.round(state.scene.dimensions.height_m * ppm);

      heatmapCanvas.width = w;
      heatmapCanvas.height = h;
      sceneCanvas.width = w;
      sceneCanvas.height = h;

      container.style.width = `${w}px`;
      container.style.height = `${h}px`;

      updateZoomTransform();

      // Recalcula o heatmap
      if (heatmap && state.scene) {
        heatmap.render(heatmapCanvas, state.scene);
      }
    }

    // Inicializa dimensões e renderizadores
    resizeCanvases();
    if (renderer) renderer.init(sceneCanvas);
    if (interaction) interaction.init(sceneCanvas);

    // Atualiza Heatmap e UI sempre que o estado sofrer modificações
    if (state) {
      state.subscribe((event) => {
        if (['template_loaded', 'storage_loaded', 'default_loaded', 'scene_reset'].includes(event)) {
          resizeCanvases();
          // Aplica o melhor enquadramento possível em qualquer dispositivo ou monitor
          setTimeout(fitToScreen, 50);
          setTimeout(fitToScreen, 150);
        } else if (heatmap && state.scene) {
          heatmap.render(heatmapCanvas, state.scene);
        }
        updateStatusBar();
        if (typeof updateSelectionToolbar === 'function') {
          updateSelectionToolbar();
        }
      });
    }

    // Barra de status inferior
    function updateStatusBar() {
      const statusEl = document.getElementById('status-info');
      if (!statusEl || !state || !state.scene) return;

      const sc = state.scene;
      const txCount = (sc.devices || []).filter((d) => d.category === 'transmitter').length;
      const rxCount = (sc.devices || []).filter((d) => d.category === 'receiver').length;
      const obsCount = (sc.devices || []).filter((d) => ['furniture', 'obstacle', 'noise_source'].includes(d.category)).length;
      const wallCount = (sc.walls || []).length;

      let selectionText = 'Nenhum item selecionado';
      if (state.selectedItem) {
        if (state.selectedItem.type === 'wall') {
          const w = sc.walls.find((wall) => wall.id === state.selectedItem.id);
          const matName = w ? (window.WifiSim.Core.RF.MATERIALS[w.material]?.name || w.material) : 'Parede';
          selectionText = `Parede: ${matName}`;
        } else if (state.selectedItem.type === 'device') {
          const dev = sc.devices.find((d) => d.id === state.selectedItem.id);
          if (dev && dev.type === 'door') {
            const isOutward = dev.swing_direction === 'outward' || dev.flip_swing === true;
            const isRight = dev.hinge_side === 'right';
            const dirStr = isOutward ? 'para fora' : 'para dentro';
            const sideStr = isRight ? 'dobradiça à direita' : 'dobradiça à esquerda';
            selectionText = `Porta: ${dev.name} [${dirStr} • ${sideStr} 🚪] (clique para alternar)`;
          } else if (dev && state.isElectronicDevice && state.isElectronicDevice(dev)) {
            const isPowered = state.isDevicePowered ? state.isDevicePowered(dev) : true;
            let powerBadge = isPowered ? '🟢 LIGADO' : '⚪ DESLIGADO';
            if (state.isRepeaterDevice && state.isRepeaterDevice(dev) && !state.hasActiveMainRouter()) {
              powerBadge = '⚠️ INOPERANTE (SEM ROTEADOR)';
            }
            selectionText = `${dev.name} [${powerBadge}] (clique novamente para alternar)`;
          } else {
            selectionText = dev ? `Objeto: ${dev.name}` : 'Dispositivo selecionado';
          }
        }
      }

      statusEl.innerHTML = `
        <span>📐 <strong>${sc.name}</strong> (${sc.dimensions.width_m}m × ${sc.dimensions.height_m}m)</span>
        <span>📡 <strong>${txCount}</strong> APs | 💻 <strong>${rxCount}</strong> Clientes | 🛋️ <strong>${obsCount}</strong> Objetos/Móveis</span>
        <span>🧱 <strong>${wallCount}</strong> Paredes</span>
        <span>🎯 ${selectionText}</span>
      `;
    }

    bindUIButtons();
    updateStatusBar();
    console.log('✅ [WifiSim] Sistema inicializado com sucesso.');
  }

  function bindUIButtons() {
    const state = window.WifiSim.State;
    const dialogs = window.WifiSim.UI.Dialogs;

    // Elementos dos Dropdowns e Menus Móveis
    const btnToolSelect = document.getElementById('btn-tool-select');
    const btnBuildMenu = document.getElementById('btn-build-menu');
    const menuBuild = document.getElementById('menu-build');
    const btnAddMenu = document.getElementById('btn-add-menu');
    const menuAdd = document.getElementById('menu-add');
    const dropdownBackdrop = document.getElementById('dropdown-backdrop');

    const wrapperBuild = btnBuildMenu?.closest('.dropdown-wrapper');
    const wrapperAdd = btnAddMenu?.closest('.dropdown-wrapper');

    function alignDropdown(menu, btn) {
      if (!menu || !btn) return;
      if (window.innerWidth <= 720) {
        menu.style.left = '';
        menu.style.right = '';
        return;
      }

      menu.style.left = '0px';
      menu.style.right = 'auto';

      // Lê os limites na tela após o menu estar com display: block
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const margin = 16;

      // Se a borda direita ultrapassa o limite da janela visível:
      if (rect.right > viewportWidth - margin) {
        const overflow = rect.right - (viewportWidth - margin);
        const maxShiftLeft = -(rect.left - margin);
        const finalLeft = Math.max(-overflow, maxShiftLeft);
        menu.style.left = `${finalLeft}px`;
      }
    }

    function closeAllDropdowns() {
      if (menuBuild) {
        menuBuild.classList.remove('active');
        menuBuild.style.left = '';
      }
      if (menuAdd) {
        menuAdd.classList.remove('active');
        menuAdd.style.left = '';
      }
      if (wrapperBuild) wrapperBuild.classList.remove('open');
      if (wrapperAdd) wrapperAdd.classList.remove('open');
      if (dropdownBackdrop) dropdownBackdrop.classList.remove('active');
    }

    if (dropdownBackdrop) {
      dropdownBackdrop.addEventListener('click', () => {
        closeAllDropdowns();
      });
    }

    // Ferramenta de Seleção
    if (btnToolSelect) {
      btnToolSelect.addEventListener('click', () => {
        closeAllDropdowns();
        btnToolSelect.classList.add('active');
        if (btnBuildMenu) btnBuildMenu.classList.remove('active');
        if (state) state.activeTool = 'select';
      });
    }

    // Toggle Dropdown Construir
    if (btnBuildMenu && menuBuild) {
      btnBuildMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = menuBuild.classList.contains('active');
        closeAllDropdowns();
        if (!isOpen) {
          menuBuild.classList.add('active');
          if (wrapperBuild) wrapperBuild.classList.add('open');
          if (dropdownBackdrop) dropdownBackdrop.classList.add('active');
          alignDropdown(menuBuild, btnBuildMenu);
        }
      });
    }

    // Itens de Construção (Paredes, Portas, Janelas, Espelhos)
    const buildItems = document.querySelectorAll('[data-build-material]');
    const buildMaterialNames = {
      alvenaria: { name: 'Alvenaria', icon: '🧱' },
      concreto: { name: 'Concreto', icon: '🏛️' },
      drywall: { name: 'Drywall', icon: '📄' },
      madeira: { name: 'Porta', icon: '🚪' },
      vidro: { name: 'Janela', icon: '🪟' },
      espelho: { name: 'Espelho', icon: '🪞' }
    };

    buildItems.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const mat = btn.getAttribute('data-build-material');
        const apertureType = btn.getAttribute('data-build-aperture');

        if (state) {
          if (apertureType || mat === 'madeira' || mat === 'vidro') {
            const type = apertureType || (mat === 'madeira' ? 'door' : 'window');
            state.addAperture(type);
            state.activeTool = 'select';
            if (btnToolSelect) btnToolSelect.classList.add('active');
            if (btnBuildMenu) btnBuildMenu.classList.remove('active');
          } else if (mat) {
            state.currentMaterial = mat;
            state.activeTool = 'wall';

            // Atualiza ícone e tooltip do botão Construir
            const info = buildMaterialNames[mat] || { name: 'Construir', icon: '🏗️' };
            const iconEl = document.getElementById('btn-build-icon');
            if (iconEl) iconEl.textContent = info.icon;
            if (btnBuildMenu) {
              btnBuildMenu.setAttribute('data-tooltip', `Construir ${info.name} (${info.icon})`);
              btnBuildMenu.classList.add('active');
            }
            if (btnToolSelect) btnToolSelect.classList.remove('active');
          }
        }
        closeAllDropdowns();
      });
    });

    // Toggle Dropdown Adicionar
    if (btnAddMenu && menuAdd) {
      btnAddMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = menuAdd.classList.contains('active');
        closeAllDropdowns();
        if (!isOpen) {
          menuAdd.classList.add('active');
          if (wrapperAdd) wrapperAdd.classList.add('open');
          if (dropdownBackdrop) dropdownBackdrop.classList.add('active');
          alignDropdown(menuAdd, btnAddMenu);
        }
      });
    }

    // Catálogo de Definições de Itens para Adicionar (com tamanhos proporcionais realistas)
    const ITEM_CATALOG = {
      // 1. Equipamentos Wi-Fi
      router_main: {
        name: 'Roteador Wi-Fi (Gateway)',
        category: 'transmitter',
        type: 'router_gateway',
        size: { width_m: 0.35, height_m: 0.3 },
        rf_config: { is_active: true, tx_power_dbm: 20.0, frequency_ghz: 5.0, channel: 36, antenna_gain_dbi: 3.0 }
      },
      router_mesh: {
        name: 'Nó Mesh (Repetidor)',
        category: 'transmitter',
        type: 'mesh_node',
        size: { width_m: 0.28, height_m: 0.28 },
        rf_config: { is_active: true, tx_power_dbm: 17.0, frequency_ghz: 5.0, channel: 36, antenna_gain_dbi: 3.0 }
      },

      // 2. Dispositivos Eletrônicos (Clientes)
      tv: {
        name: 'Smart TV',
        category: 'receiver',
        type: 'tv',
        size: { width_m: 1.0, height_m: 0.15 },
        receiver_metrics: { current_rssi_dbm: -50, quality_level: 'excellent' }
      },
      pc: {
        name: 'PC Desktop',
        category: 'receiver',
        type: 'pc',
        size: { width_m: 0.65, height_m: 0.45 },
        receiver_metrics: { current_rssi_dbm: -55, quality_level: 'excellent' }
      },
      laptop: {
        name: 'Notebook',
        category: 'receiver',
        type: 'laptop',
        size: { width_m: 0.35, height_m: 0.25 },
        receiver_metrics: { current_rssi_dbm: -60, quality_level: 'good' }
      },
      videogame: {
        name: 'Console Videogame',
        category: 'receiver',
        type: 'videogame',
        size: { width_m: 0.3, height_m: 0.25 },
        receiver_metrics: { current_rssi_dbm: -55, quality_level: 'excellent' }
      },
      phone: {
        name: 'Smartphone',
        category: 'receiver',
        type: 'phone',
        size: { width_m: 0.2, height_m: 0.12 },
        receiver_metrics: { current_rssi_dbm: -62, quality_level: 'good' }
      },

      // 3. Mobiliário Residencial
      bed: {
        name: 'Cama de Casal',
        category: 'furniture',
        type: 'bed',
        size: { width_m: 1.5, height_m: 1.9 },
        attenuation_db: { db24: 2.5, db5: 3.5 }
      },
      sofa: {
        name: 'Sofá',
        category: 'furniture',
        type: 'sofa',
        size: { width_m: 1.6, height_m: 0.75 },
        attenuation_db: { db24: 3.0, db5: 4.5 }
      },
      table: {
        name: 'Mesa de Jantar',
        category: 'furniture',
        type: 'table',
        size: { width_m: 1.2, height_m: 0.8 },
        attenuation_db: { db24: 1.5, db5: 2.5 }
      },
      wardrobe: {
        name: 'Guarda-Roupa',
        category: 'furniture',
        type: 'wardrobe',
        size: { width_m: 1.4, height_m: 0.55 },
        attenuation_db: { db24: 5.0, db5: 8.0 }
      },

      // 4. Bloqueios & Fontes de Interferência RF
      fridge: {
        name: 'Geladeira (Inox)',
        category: 'obstacle',
        type: 'fridge',
        size: { width_m: 0.75, height_m: 0.75 },
        attenuation_db: { db24: 25.0, db5: 32.0 }
      },
      microwave: {
        name: 'Forno Micro-ondas',
        category: 'noise_source',
        type: 'microwave',
        size: { width_m: 0.5, height_m: 0.35 },
        attenuation_db: { db24: 20.0, db5: 28.0 },
        rf_config: { is_active: true, noise_level_dbm: -35.0, interference_radius_m: 3.5 }
      },
      mirror_obj: {
        name: 'Espelho de Parede',
        category: 'obstacle',
        type: 'mirror_obj',
        size: { width_m: 0.9, height_m: 0.12 },
        attenuation_db: { db24: 14.0, db5: 20.0 }
      },
      aquarium: {
        name: 'Aquário de Água',
        category: 'obstacle',
        type: 'aquarium',
        size: { width_m: 0.8, height_m: 0.4 },
        attenuation_db: { db24: 16.0, db5: 22.0 }
      },
      cordless_phone: {
        name: 'Telefone Sem Fio 2.4G',
        category: 'noise_source',
        type: 'cordless_phone',
        size: { width_m: 0.25, height_m: 0.2 },
        attenuation_db: { db24: 1.0, db5: 1.0 },
        rf_config: { is_active: true, noise_level_dbm: -45.0, interference_radius_m: 2.5 }
      }
    };

    // Ação ao clicar em qualquer item do menu Adicionar
    const addButtons = document.querySelectorAll('[data-add-type]');
    addButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const addType = btn.getAttribute('data-add-type');

        if (state && (addType === 'door' || addType === 'window')) {
          state.addAperture(addType);
          state.activeTool = 'select';
          if (btnToolSelect) btnToolSelect.classList.add('active');
          if (btnBuildMenu) btnBuildMenu.classList.remove('active');
          closeAllDropdowns();
          return;
        }

        const template = ITEM_CATALOG[addType];
        if (state && template) {
          // Posiciona próximo ao centro do ambiente com ligeira variação aleatória
          const scW = (state.scene && state.scene.dimensions.width_m) || 8.0;
          const scH = (state.scene && state.scene.dimensions.height_m) || 6.0;
          const posX = Math.max(1.0, Math.min(scW - 1.0, scW / 2 + (Math.random() - 0.5) * 2.0));
          const posY = Math.max(1.0, Math.min(scH - 1.0, scH / 2 + (Math.random() - 0.5) * 2.0));

          const deviceData = {
            ...JSON.parse(JSON.stringify(template)),
            position: { x: Number(posX.toFixed(2)), y: Number(posY.toFixed(2)) }
          };

          state.addDevice(deviceData);

          // Restaura ferramenta de seleção para permitir arrastar imediatamente
          state.activeTool = 'select';
          if (btnToolSelect) btnToolSelect.classList.add('active');
          if (btnBuildMenu) btnBuildMenu.classList.remove('active');
        }
        closeAllDropdowns();
      });
    });

    // Fechar dropdowns ao clicar fora
    window.addEventListener('click', (e) => {
      if (!e.target.closest('.dropdown-wrapper')) {
        closeAllDropdowns();
      }
    });

    // Fechar dropdowns com tecla Escape
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeAllDropdowns();
      }
    });

    // Realinhar dropdowns abertos em caso de redimensionamento da janela
    window.addEventListener('resize', () => {
      if (menuBuild && menuBuild.classList.contains('active')) {
        alignDropdown(menuBuild, btnBuildMenu);
      }
      if (menuAdd && menuAdd.classList.contains('active')) {
        alignDropdown(menuAdd, btnAddMenu);
      }
    });

    // Seletor Segmentado de Frequência do Roteador Principal (2.4GHz, 5GHz ou Dual)
    const segButtons = document.querySelectorAll('.seg-btn');
    segButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        segButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const freq = btn.getAttribute('data-freq');
        if (state && typeof state.setPrimaryFrequency === 'function') {
          state.setPrimaryFrequency(freq);
        }
      });
    });

    function syncFrequencyUI() {
      if (!state || !state.scene || !state.scene.devices) return;
      const mainTx = state.scene.devices.find(
        (d) => d.category === 'transmitter' && d.type === 'router_gateway'
      ) || state.scene.devices.find((d) => d.category === 'transmitter');

      let currentFreq = state.activeFrequencyMode || '5.0';
      if (mainTx && mainTx.rf_config) {
        currentFreq = mainTx.rf_config.frequency_mode || (mainTx.rf_config.frequency_ghz === 2.4 ? '2.4' : mainTx.rf_config.frequency_ghz === 'multi' ? 'multi' : '5.0');
      }
      segButtons.forEach((b) => {
        b.classList.toggle('active', b.getAttribute('data-freq') === String(currentFreq));
      });
    }

    syncFrequencyUI();
    if (state) {
      state.subscribe((event) => {
        if (['template_loaded', 'storage_loaded', 'default_loaded', 'scene_reset'].includes(event)) {
          syncFrequencyUI();
        }
      });
    }

    // Botão Templates
    const btnTemplates = document.getElementById('btn-open-templates');
    if (btnTemplates && dialogs) {
      btnTemplates.addEventListener('click', () => dialogs.showTemplatesModal());
    }

    // Botão Exportar (Salvar Projeto)
    const btnExport = document.getElementById('btn-export-json');
    if (btnExport && dialogs) {
      btnExport.addEventListener('click', () => dialogs.exportSceneJSON());
    }

    // Botão Abrir Projeto Salvo (Importar JSON)
    const btnImport = document.getElementById('btn-import-json');
    const fileInput = document.getElementById('file-input-json');
    if (btnImport && fileInput && state) {
      btnImport.addEventListener('click', () => {
        fileInput.click();
      });

      fileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const data = JSON.parse(evt.target.result);
            state.loadScene(data);
          } catch (err) {
            alert('Não foi possível abrir o arquivo: ' + err.message);
            console.error('[WifiSim Import Error]:', err);
          } finally {
            fileInput.value = '';
          }
        };
        reader.readAsText(file);
      });
    }

    // Carregamento de templates pelos cards do modal
    const templateCards = document.querySelectorAll('[data-load-template]');
    templateCards.forEach((card) => {
      card.addEventListener('click', () => {
        const key = card.getAttribute('data-load-template');
        if (state && key) {
          state.loadTemplate(key);
          if (dialogs) dialogs.closeModals();
        }
      });
    });

    // Fechar modais
    const closeButtons = document.querySelectorAll('[data-close-modal]');
    closeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (dialogs) dialogs.closeModals();
      });
    });

    // Inicialização do Painel de Dicas & Boas Práticas Wi-Fi
    const tipsPanel = window.WifiSim.UI.TipsPanel;
    if (tipsPanel) {
      tipsPanel.init();
    }

    // Legenda Visual de Sinal (Recolhível no Mobile)
    const signalLegend = document.getElementById('signal-legend');
    const legendHeader = document.getElementById('legend-header');
    if (signalLegend && legendHeader) {
      if (window.innerWidth <= 720) {
        signalLegend.classList.add('collapsed');
      }
      legendHeader.addEventListener('click', () => {
        signalLegend.classList.toggle('collapsed');
      });
    }

    // =========================================================================
    // Barra de Ações Rápidas do Item Selecionado (Contextual)
    // =========================================================================
    const DEVICE_INFO_MAP = {
      router_gateway: { name: 'Roteador Wi-Fi (Gateway)', icon: '📶' },
      mesh_node: { name: 'Nó Mesh (Repetidor)', icon: '📡' },
      tv: { name: 'Smart TV', icon: '📺' },
      pc: { name: 'PC Desktop', icon: '🖥️' },
      laptop: { name: 'Notebook', icon: '💻' },
      videogame: { name: 'Videogame', icon: '🎮' },
      phone: { name: 'Smartphone', icon: '📱' },
      bed: { name: 'Cama de Casal', icon: '🛏️' },
      sofa: { name: 'Sofá', icon: '🛋️' },
      table: { name: 'Mesa de Trabalho', icon: '🪑' },
      wardrobe: { name: 'Armário / Guarda-Roupa', icon: '🗄️' },
      door: { name: 'Porta de Madeira', icon: '🚪' },
      window: { name: 'Janela de Vidro', icon: '🪟' },
      fridge: { name: 'Geladeira', icon: '🧊' },
      microwave: { name: 'Forno Micro-ondas', icon: '📻' },
      mirror_obj: { name: 'Espelho de Parede', icon: '🪞' },
      aquarium: { name: 'Aquário com Água', icon: '🐠' },
      cordless_phone: { name: 'Telefone Sem Fio', icon: '☎️' }
    };

    const selToolbar = document.getElementById('selection-toolbar');
    const selIcon = document.getElementById('sel-icon');
    const selTitle = document.getElementById('sel-title');
    const selSub = document.getElementById('sel-sub');
    const btnSelDoorSwing = document.getElementById('btn-sel-door-swing');
    const btnSelPower = document.getElementById('btn-sel-power');
    const btnSelPowerText = document.getElementById('btn-sel-power-text');
    const btnSelRotate = document.getElementById('btn-sel-rotate');
    const selWallMaterials = document.getElementById('sel-wall-materials');
    const btnSelDelete = document.getElementById('btn-sel-delete');
    const btnSelClose = document.getElementById('btn-sel-close');

    function updateSelectionToolbar() {
      if (!selToolbar || !state || !state.scene) return;

      const sel = state.selectedItem;
      if (!sel) {
        selToolbar.classList.add('hidden');
        if (btnSelPower) btnSelPower.style.display = 'none';
        return;
      }

      selToolbar.classList.remove('hidden');

      if (sel.type === 'wall') {
        const wall = state.scene.walls.find((w) => w.id === sel.id);
        if (!wall) {
          selToolbar.classList.add('hidden');
          return;
        }
        const mat = buildMaterialNames[wall.material] || { name: 'Alvenaria', icon: '🧱' };
        const len = Math.hypot(wall.p2.x - wall.p1.x, wall.p2.y - wall.p1.y).toFixed(2);

        if (selIcon) selIcon.textContent = mat.icon;
        if (selTitle) selTitle.textContent = `Parede de ${mat.name}`;
        if (selSub) selSub.textContent = `${len}m • Espessura ${wall.thickness_m || 0.15}m`;

        if (btnSelDoorSwing) btnSelDoorSwing.style.display = 'none';
        if (btnSelPower) btnSelPower.style.display = 'none';
        if (btnSelRotate) btnSelRotate.style.display = 'none';
        if (selWallMaterials) {
          selWallMaterials.style.display = 'flex';
          const matButtons = selWallMaterials.querySelectorAll('.btn-mat');
          matButtons.forEach((b) => {
            b.classList.toggle('active', b.getAttribute('data-mat') === wall.material);
          });
        }
      } else if (sel.type === 'device') {
        const dev = state.scene.devices.find((d) => d.id === sel.id);
        if (!dev) {
          selToolbar.classList.add('hidden');
          return;
        }

        const info = DEVICE_INFO_MAP[dev.type] || { name: dev.name || 'Dispositivo', icon: '📦' };
        if (selIcon) selIcon.textContent = info.icon;
        if (selTitle) selTitle.textContent = info.name;

        if (selWallMaterials) selWallMaterials.style.display = 'none';

        if (dev.type === 'door') {
          if (btnSelDoorSwing) btnSelDoorSwing.style.display = 'inline-flex';
          if (btnSelPower) btnSelPower.style.display = 'none';
          if (btnSelRotate) btnSelRotate.style.display = 'none';
          const isOut = dev.swing_direction === 'outward' || dev.flip_swing === true;
          const isR = dev.hinge_side === 'right';
          const sideText = isR ? 'Direita' : 'Esquerda';
          const dirText = isOut ? 'Para Fora' : 'Para Dentro';
          if (selSub) selSub.textContent = `${dirText} • Dobradiça ${sideText}`;
        } else if (dev.type === 'window') {
          if (btnSelDoorSwing) btnSelDoorSwing.style.display = 'none';
          if (btnSelPower) btnSelPower.style.display = 'none';
          if (btnSelRotate) btnSelRotate.style.display = 'none';
          if (selSub) selSub.textContent = `Largura ${(dev.size && dev.size.width_m) || 1.2}m • Vidro`;
        } else {
          if (btnSelDoorSwing) btnSelDoorSwing.style.display = 'none';
          if (btnSelRotate) btnSelRotate.style.display = 'inline-flex';
          const rot = dev.rotation_deg || 0;

          // Aparelhos eletrônicos chaveáveis por energia (ligar / desligar)
          const isElectronic = state.isElectronicDevice && state.isElectronicDevice(dev);
          if (isElectronic && btnSelPower) {
            btnSelPower.style.display = 'inline-flex';
            const isPowered = state.isDevicePowered ? state.isDevicePowered(dev) : true;
            const isRepeaterDisabled = state.isRepeaterDevice && state.isRepeaterDevice(dev) && !state.hasActiveMainRouter();
            if (isRepeaterDisabled) {
              btnSelPower.className = 'btn btn-action btn-power-disabled';
              if (btnSelPowerText) btnSelPowerText.textContent = '⚠️ Repetidor Inoperante';
              const reasonDesc = state.hasMainRouterPresent() ? 'o Roteador Principal está desligado' : 'não há Roteador Principal na cena';
              btnSelPower.setAttribute('data-tooltip', `O repetidor não pode ser ligado porque ${reasonDesc}. Consulte o painel de Dicas.`);
              if (selSub) selSub.textContent = `Status: Inoperante ⚠️ (Sem Roteador) • Rotação: ${rot}°`;
            } else if (isPowered) {
              btnSelPower.className = 'btn btn-action btn-power-on';
              if (btnSelPowerText) btnSelPowerText.textContent = '🔴 Desligar';
              btnSelPower.setAttribute('data-tooltip', 'Desligar aparelho (ou clique consecutivo no objeto)');
              if (selSub) selSub.textContent = `Status: Ligado ⚡ • Rotação: ${rot}°`;
            } else {
              btnSelPower.className = 'btn btn-action btn-power-off';
              if (btnSelPowerText) btnSelPowerText.textContent = '🟢 Ligar';
              btnSelPower.setAttribute('data-tooltip', 'Ligar aparelho (ou clique consecutivo no objeto)');
              if (selSub) selSub.textContent = `Status: Desligado ⚪ • Rotação: ${rot}°`;
            }
          } else {
            if (btnSelPower) btnSelPower.style.display = 'none';
            if (selSub) selSub.textContent = `Rotação: ${rot}°`;
          }
        }
      } else {
        selToolbar.classList.add('hidden');
        if (btnSelPower) btnSelPower.style.display = 'none';
      }
    }

    // Ações dos botões da barra de seleção
    if (btnSelDoorSwing) {
      btnSelDoorSwing.addEventListener('click', () => {
        if (state) {
          state.cycleDoorSwing();
          updateSelectionToolbar();
        }
      });
    }

    if (btnSelPower) {
      btnSelPower.addEventListener('click', () => {
        if (state && state.selectedItem && state.selectedItem.type === 'device') {
          state.toggleDevicePower(state.selectedItem.id);
          updateSelectionToolbar();
        }
      });
    }

    if (btnSelRotate) {
      btnSelRotate.addEventListener('click', () => {
        if (state && state.selectedItem && state.selectedItem.type === 'device') {
          const dev = state.scene.devices.find((d) => d.id === state.selectedItem.id);
          if (dev) {
            dev.rotation_deg = ((dev.rotation_deg || 0) + 90) % 360;
            state.notify('scene_modified');
            state.notify('device_moved');
            updateSelectionToolbar();
          }
        }
      });
    }

    if (selWallMaterials) {
      const matButtons = selWallMaterials.querySelectorAll('.btn-mat');
      matButtons.forEach((b) => {
        b.addEventListener('click', () => {
          const mat = b.getAttribute('data-mat');
          if (state && state.selectedItem && state.selectedItem.type === 'wall' && mat) {
            const wall = state.scene.walls.find((w) => w.id === state.selectedItem.id);
            if (wall) {
              wall.material = mat;
              state.notify('scene_modified');
              state.notify('wall_moved');
              updateSelectionToolbar();
            }
          }
        });
      });
    }

    if (btnSelDelete) {
      btnSelDelete.addEventListener('click', () => {
        if (state) {
          state.deleteSelected();
        }
      });
    }

    if (btnSelClose) {
      btnSelClose.addEventListener('click', () => {
        if (state) {
          state.clearSelection();
        }
      });
    }

    // Inicializa a barra de seleção no estado atual
    updateSelectionToolbar();

    // Inicialização da visualização da tela:
    // Se a aplicação estiver restaurando uma sessão anterior salva no localStorage,
    // ela preserva e restaura com máxima fidelidade o mapa, objetos, nível de zoom e a posição de visualização.
    // Caso seja a primeira execução ou uma redefinição explícita de template, executa o enquadramento dinâmico (fitToScreen).
    function setupInitialViewport() {
      resizeCanvases();
      if (state && state.isRestoredSession && state.viewportState) {
        restoreSavedViewportPosition();
      } else {
        fitToScreen();
      }
    }

    // Execuções em cascata cobrindo o ciclo de renderização do DOM
    requestAnimationFrame(setupInitialViewport);
    setTimeout(setupInitialViewport, 50);
    setTimeout(() => {
      if (state && state.isRestoredSession && state.viewportState) {
        restoreSavedViewportPosition();
      }
    }, 150);
    setTimeout(() => {
      if (state && state.isRestoredSession && state.viewportState) {
        restoreSavedViewportPosition();
      }
    }, 350);

    // ResizeObserver para garantir o enquadramento ou restauração ideal no instante em que a viewport recebe dimensões reais
    if (window.ResizeObserver && mainViewport) {
      let initialAutoFitDone = false;
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const cr = entry.contentRect;
          if (cr.width > 50 && cr.height > 50) {
            if (!initialAutoFitDone) {
              initialAutoFitDone = true;
              setupInitialViewport();
              setTimeout(() => {
                if (state && state.isRestoredSession && state.viewportState) {
                  restoreSavedViewportPosition();
                }
              }, 100);
            }
          }
        }
      });
      ro.observe(mainViewport);
    }

    if (document.readyState === 'complete') {
      setTimeout(setupInitialViewport, 50);
    } else {
      window.addEventListener('load', () => {
        setTimeout(setupInitialViewport, 60);
      }, { once: true });
    }
  }

  // Executa ao carregar o DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
