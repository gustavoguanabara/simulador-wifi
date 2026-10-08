/**
 * Simulador Wi-Fi - Gerenciador de Estado da Cena (State Manager)
 * Camada: State (WifiSim.State)
 * Zero dependências externas - ECMAScript 2020+
 */

(function () {
  'use strict';

  window.WifiSim = window.WifiSim || {};

  const STORAGE_KEY = 'wifisim_active_scene_v1';

  class SceneState {
    constructor() {
      this.scene = null;
      this.selectedItem = null; // { type: 'wall'|'device'|'vertex', id: string, vertex?: 'p1'|'p2' }
      this.activeTool = 'select'; // 'select' | 'wall' | 'router' | 'receiver' | 'microwave'
      this.currentMaterial = 'alvenaria';
      this.activeFrequencyMode = '5.0';
      this.viewportState = null; // { zoom: number, scrollLeft: number, scrollTop: number }
      this.isRestoredSession = false;
      this.listeners = [];

      // Tenta restaurar automaticamente a sessão anterior salva no localStorage
      const restored = this.loadFromStorage(false);
      if (!restored) {
        this.initDefault();
      }
    }

    initDefault() {
      // Carrega template inicial Studio 45m² por padrão
      const templates = window.WifiSim.Templates;
      if (templates && templates.studio45) {
        this.loadTemplate('studio45');
      } else {
        this.scene = {
          id: 'scene-initial',
          name: 'Ambiente Padrão',
          dimensions: { width_m: 8.0, height_m: 6.0, pixels_per_meter: 70 },
          grid: { step_m: 0.25, show_grid: true },
          walls: [],
          devices: [],
          furniture: []
        };
      }
    }

    subscribe(callback) {
      if (typeof callback === 'function') {
        this.listeners.push(callback);
      }
    }

    notify(eventType = 'change') {
      for (const cb of this.listeners) {
        try {
          cb(eventType, this.scene, this.selectedItem);
        } catch (err) {
          console.error('[SceneState] Erro no listener:', err);
        }
      }
      this.saveToStorage();
    }

    loadTemplate(templateKey) {
      const templates = window.WifiSim.Templates;
      if (templates && templates[templateKey]) {
        // Deep clone
        this.scene = JSON.parse(JSON.stringify(templates[templateKey]));
        this.selectedItem = null;
        this.viewportState = null;
        this.isRestoredSession = false;
        this.enforceRepeaterDependency();
        this.notify('template_loaded');
      }
    }

    /**
     * Restaura o ambiente para os valores padrões originais do sistema (Studio 45m²)
     * e notifica ouvintes para recalcular o enquadramento e a cena.
     */
    resetToDefault() {
      this.clearSavedSession();
      this.initDefault();
      this.selectedItem = null;
      this.viewportState = null;
      this.isRestoredSession = false;
      this.notify('default_loaded');
      this.notify('template_loaded');
      return true;
    }

    /**
     * Redefine a cena para um espaço limpo com dimensões personalizadas
     */
    resetScene(widthM = 8.0, heightM = 6.0) {
      this.scene = {
        id: 'scene-' + Date.now().toString(36),
        name: 'Ambiente Limpo',
        dimensions: { width_m: widthM, height_m: heightM, pixels_per_meter: 70 },
        grid: { step_m: 0.25, show_grid: true },
        walls: [],
        devices: []
      };
      this.selectedItem = null;
      this.notify('scene_reset');
      return this.scene;
    }

    /**
     * Carrega um cenário completo a partir de um objeto JSON importado de arquivo salvo
     */
    loadScene(sceneData) {
      if (!sceneData || typeof sceneData !== 'object') {
        throw new Error('Formato de arquivo inválido: JSON vazio ou corrompido.');
      }
      if (!sceneData.dimensions || !Array.isArray(sceneData.walls) || !Array.isArray(sceneData.devices)) {
        throw new Error('O arquivo não contém a estrutura válida de um cenário do simulador (dimensões, paredes e dispositivos).');
      }

      this.scene = JSON.parse(JSON.stringify(sceneData));
      this.selectedItem = null;
      this.viewportState = null;
      this.isRestoredSession = false;
      this.enforceRepeaterDependency();
      this.notify('storage_loaded');
      return true;
    }

    select(type, id, extra = {}) {
      if (!type || !id) {
        this.selectedItem = null;
      } else {
        this.selectedItem = { type, id, ...extra };
      }
      this.notify('selection_changed');
    }

    clearSelection() {
      this.selectedItem = null;
      this.notify('selection_changed');
    }

    addWall(p1, p2, material = 'alvenaria') {
      const id = 'wall-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
      const newWall = {
        id,
        p1: { x: Number(p1.x.toFixed(2)), y: Number(p1.y.toFixed(2)) },
        p2: { x: Number(p2.x.toFixed(2)), y: Number(p2.y.toFixed(2)) },
        material: material || this.currentMaterial,
        thickness_m: 0.15
      };
      this.scene.walls.push(newWall);
      this.select('wall', id);
      this.notify('wall_added');
      return newWall;
    }

    addDevice(deviceData) {
      const id = 'dev-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
      let rfConfig = deviceData.rf_config || null;
      if (!rfConfig && deviceData.category === 'transmitter') {
        rfConfig = {
          is_active: true,
          tx_power_dbm: 20.0,
          frequency_ghz: 5.0,
          channel: 36,
          antenna_gain_dbi: 3.0
        };
      }
      const device = {
        id,
        name: deviceData.name || 'Dispositivo Wi-Fi',
        category: deviceData.category || 'transmitter',
        type: deviceData.type || 'router_gateway',
        position: deviceData.position || { x: 3.0, y: 3.0 },
        size: deviceData.size || { width_m: 0.5, height_m: 0.5 },
        rotation_deg: deviceData.rotation_deg || 0,
        attenuation_db: deviceData.attenuation_db || null,
        rf_config: rfConfig,
        receiver_metrics: deviceData.receiver_metrics || null
      };
      // Se o dispositivo adicionado for um repetidor e não houver roteador principal ativo, nasce desligado
      if (this.isRepeaterDevice(device) && !this.hasActiveMainRouter()) {
        device.is_active = false;
        if (device.rf_config) {
          device.rf_config.is_active = false;
        }
      }

      this.scene.devices.push(device);
      this.select('device', id);
      this.notify('device_added');

      if (this.isRepeaterDevice(device) && !this.hasActiveMainRouter()) {
        const reason = this.hasMainRouterPresent() ? 'router_off' : 'router_missing';
        this.notify('repeater_power_blocked', { device, reason });
      }

      return device;
    }

    /**
     * Define a frequência de operação do dispositivo principal (2.4GHz, 5GHz ou Dual)
     * e notifica o sistema para recálculo dinâmico do heatmap e animação das ondas.
     */
    setPrimaryFrequency(freqMode = '5.0') {
      const normalizedMode = (freqMode === 'dual' || freqMode === 'multi') ? 'multi' : freqMode;
      this.activeFrequencyMode = normalizedMode;
      if (this.scene && this.scene.devices) {
        const mainTransmitter = this.scene.devices.find(
          (d) => d.category === 'transmitter' && d.type === 'router_gateway'
        ) || this.scene.devices.find((d) => d.category === 'transmitter');

        if (mainTransmitter && mainTransmitter.rf_config) {
          mainTransmitter.rf_config.frequency_mode = normalizedMode;
          if (normalizedMode === '2.4') {
            mainTransmitter.rf_config.frequency_ghz = 2.4;
          } else if (normalizedMode === '5.0') {
            mainTransmitter.rf_config.frequency_ghz = 5.0;
          } else {
            mainTransmitter.rf_config.frequency_ghz = 'multi';
          }
        }
      }
      this.notify('frequency_changed');
    }

    /**
     * Adiciona uma porta ou janela fixada na parede mais próxima.
     * Portas e janelas não podem existir fora de paredes.
     */
    addAperture(type = 'door', targetPoint = null) {
      if (!this.scene || !this.scene.walls || this.scene.walls.length === 0) {
        alert('Adicione ao menos uma parede antes de inserir portas ou janelas.');
        return null;
      }

      const Geometry = window.WifiSim.Core.Geometry;
      if (!Geometry) return null;

      // Ponto de busca: se houver parede selecionada, usa o ponto médio dela;
      // caso contrário, usa o centro da cena ou targetPoint fornecido.
      let searchPt = targetPoint;
      if (!searchPt) {
        if (this.selectedItem && this.selectedItem.type === 'wall') {
          const selWall = this.scene.walls.find((w) => w.id === this.selectedItem.id);
          if (selWall) {
            searchPt = {
              x: (selWall.p1.x + selWall.p2.x) / 2,
              y: (selWall.p1.y + selWall.p2.y) / 2
            };
          }
        }
      }
      if (!searchPt) {
        searchPt = {
          x: this.scene.dimensions.width_m / 2,
          y: this.scene.dimensions.height_m / 2
        };
      }

      const widthM = type === 'door' ? 0.9 : 1.2;
      const closest = Geometry.findClosestWall(searchPt, this.scene.walls, widthM / 2);
      if (!closest) return null;

      const id = (type === 'door' ? 'door-' : 'win-') + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
      const aperture = {
        id,
        name: type === 'door' ? 'Porta de Madeira' : 'Janela de Vidro',
        category: 'aperture',
        type, // 'door' | 'window'
        wall_id: closest.wall.id,
        position: { x: closest.point.x, y: closest.point.y },
        size: { width_m: widthM, height_m: closest.wall.thickness_m || 0.15 },
        rotation_deg: closest.angleDeg,
        attenuation_db: type === 'door' ? { db24: 3.5, db5: 6.0 } : { db24: 2.0, db5: 4.0 },
        swing_direction: 'inward', // 'inward' (para dentro) | 'outward' (para fora)
        hinge_side: 'left', // 'left' (à esquerda) | 'right' (à direita)
        flip_swing: false
      };

      this.scene.devices.push(aperture);
      this.select('device', id);
      this.notify('device_added');
      return aperture;
    }

    /**
     * Alterna o sentido e o lado de abertura de uma porta seguindo o ciclo de 4 estados:
     * - Estado 1: Para dentro, dobradiça à esquerda (padrão)
     * - Estado 2: Para fora, dobradiça à esquerda (2º clique: inverte dentro/fora)
     * - Estado 3: Para fora, dobradiça à direita (3º clique: inverte para o outro lado)
     * - Estado 4: Para dentro, dobradiça à direita (4º clique: inverte dentro/fora)
     * - Retorna ao Estado 1 no 5º clique.
     */
    cycleDoorSwing(doorId = null) {
      if (!this.scene || !this.scene.devices) return false;
      const targetId = doorId || (this.selectedItem && this.selectedItem.type === 'device' ? this.selectedItem.id : null);
      if (!targetId) return false;

      const door = this.scene.devices.find((d) => d.id === targetId && d.type === 'door');
      if (!door) return false;

      const isOutward = door.swing_direction === 'outward' || door.flip_swing === true;
      const isRight = door.hinge_side === 'right';

      if (!isOutward && !isRight) {
        // Estado 1 -> 2: abre para fora (mesma dobradiça à esquerda)
        door.swing_direction = 'outward';
        door.hinge_side = 'left';
        door.flip_swing = true;
      } else if (isOutward && !isRight) {
        // Estado 2 -> 3: abre para o outro lado (dobradiça à direita)
        door.swing_direction = 'outward';
        door.hinge_side = 'right';
        door.flip_swing = true;
      } else if (isOutward && isRight) {
        // Estado 3 -> 4: abre para dentro (mesma dobradiça à direita)
        door.swing_direction = 'inward';
        door.hinge_side = 'right';
        door.flip_swing = false;
      } else {
        // Estado 4 -> 1: volta ao padrão original (para dentro, dobradiça à esquerda)
        door.swing_direction = 'inward';
        door.hinge_side = 'left';
        door.flip_swing = false;
      }

      this.notify('scene_modified');
      this.notify('device_moved');
      return true;
    }

    /**
     * Alias de compatibilidade para cycleDoorSwing
     */
    toggleDoorSwing(doorId = null) {
      return this.cycleDoorSwing(doorId);
    }

    /**
     * Verifica se um dispositivo específico é um aparelho eletrônico chaveável por energia
     */
    isElectronicDevice(device) {
      if (!device) return false;
      const electronicTypes = [
        'router_gateway', 'mesh_node',
        'tv', 'pc', 'laptop', 'videogame', 'phone',
        'microwave', 'cordless_phone'
      ];
      return device.category === 'transmitter' || device.category === 'receiver' || device.category === 'noise_source' || electronicTypes.includes(device.type);
    }

    /**
     * Retorna se um dispositivo eletrônico está atualmente ligado
     */
    isDevicePowered(device) {
      if (!device) return false;
      if (device.rf_config && typeof device.rf_config.is_active === 'boolean') {
        return device.rf_config.is_active;
      }
      return device.is_active !== false;
    }

    /**
     * Retorna se um dispositivo é um repetidor / nó mesh de sinal Wi-Fi
     */
    isRepeaterDevice(device) {
      if (!device) return false;
      return device.type === 'mesh_node' || device.type === 'repeater' ||
        (device.category === 'transmitter' && (device.name || '').toLowerCase().includes('repetidor'));
    }

    /**
     * Retorna se um dispositivo é um roteador principal (Gateway)
     */
    isMainRouterDevice(device) {
      if (!device) return false;
      return device.category === 'transmitter' && (device.type === 'router_gateway' || device.type === 'router');
    }

    /**
     * Retorna se existe pelo menos um roteador principal presente e ligado na cena
     */
    hasActiveMainRouter() {
      if (!this.scene || !this.scene.devices) return false;
      return this.scene.devices.some((d) => this.isMainRouterDevice(d) && this.isDevicePowered(d));
    }

    /**
     * Retorna se existe pelo menos um roteador principal presente na cena (ligado ou desligado)
     */
    hasMainRouterPresent() {
      if (!this.scene || !this.scene.devices) return false;
      return this.scene.devices.some((d) => this.isMainRouterDevice(d));
    }

    /**
     * Aplica a regra de dependência de repetidores:
     * Em um cenário, não permite que um repetidor funcione sem ter um roteador principal presente e ligado.
     * Caso o roteador principal seja desligado ou removido, desliga automaticamente os repetidores.
     * @returns {Array} Lista de repetidores que foram desligados automaticamente
     */
    enforceRepeaterDependency() {
      if (!this.scene || !this.scene.devices) return [];
      const hasActive = this.hasActiveMainRouter();
      const hasPresent = this.hasMainRouterPresent();
      const disabledRepeaters = [];

      if (!hasActive) {
        for (const dev of this.scene.devices) {
          if (this.isRepeaterDevice(dev) && this.isDevicePowered(dev)) {
            dev.is_active = false;
            if (dev.rf_config) {
              dev.rf_config.is_active = false;
            }
            disabledRepeaters.push(dev);
          }
        }
      }

      if (disabledRepeaters.length > 0) {
        this.saveToStorage();
        this.notify('repeater_auto_disabled', {
          repeaters: disabledRepeaters,
          reason: hasPresent ? 'router_off' : 'router_missing'
        });
        this.notify('scene_modified');
        this.notify('device_moved');
      }

      return disabledRepeaters;
    }

    /**
     * Alterna o estado de ligado / desligado de aparelhos eletrônicos
     * (Transmissores Wi-Fi, Clientes e Fontes de Ruído ativas).
     * Ao desligar, interrompe a transmissão RF e atualiza reativamente o heatmap e as ondas.
     * Móveis (mesas, camas, sofás) e aberturas (portas, janelas) não são chaveáveis por energia.
     * @param {string|null} deviceId ID do dispositivo (ou selecionado atualmente)
     * @returns {boolean|null} Novo estado de energia (true = ligado, false = desligado) ou null se não aplicável
     */
    toggleDevicePower(deviceId = null) {
      if (!this.scene || !this.scene.devices) return null;
      const targetId = deviceId || (this.selectedItem && this.selectedItem.type === 'device' ? this.selectedItem.id : null);
      if (!targetId) return null;

      const dev = this.scene.devices.find((d) => d.id === targetId);
      if (!dev) return null;

      if (!this.isElectronicDevice(dev)) {
        return null; // Móveis, portas e janelas ignoram o toggle de energia
      }

      // Determina o estado atual de ligado/desligado
      const currentPower = this.isDevicePowered(dev);
      const newPower = !currentPower;

      // Se for um repetidor e o usuário tentar ligá-lo sem roteador principal presente e ligado, bloqueia
      if (this.isRepeaterDevice(dev) && newPower === true) {
        if (!this.hasActiveMainRouter()) {
          const reason = this.hasMainRouterPresent() ? 'router_off' : 'router_missing';
          this.notify('repeater_power_blocked', { device: dev, reason });
          return false;
        }
      }

      // Aplica o novo estado de forma consistente tanto em dev.is_active quanto em dev.rf_config.is_active
      dev.is_active = newPower;
      if (dev.rf_config) {
        dev.rf_config.is_active = newPower;
      }

      // Se for um roteador principal e foi desligado, aplica regra nos repetidores
      if (this.isMainRouterDevice(dev) && newPower === false) {
        this.enforceRepeaterDependency();
      }

      // Salva no armazenamento local e notifica os subsistemas
      this.saveToStorage();
      this.notify('device_power_toggled', dev);
      this.notify('scene_modified');
      this.notify('device_moved');

      return newPower;
    }

    /**
     * Remove o objeto selecionado atualmente (paredes, portas, janelas, objetos e equipamentos)
     * acionado pela tecla Del do teclado.
     */
    deleteSelected() {
      if (!this.selectedItem || !this.scene) return false;

      const sel = this.selectedItem;

      if (sel.type === 'device') {
        const idx = this.scene.devices.findIndex((d) => d.id === sel.id);
        if (idx !== -1) {
          const removedDev = this.scene.devices.splice(idx, 1)[0];
          this.clearSelection();

          // Se removeu um roteador principal, verifica se restou algum roteador ativo para os repetidores
          if (this.isMainRouterDevice(removedDev)) {
            this.enforceRepeaterDependency();
          }

          this.notify('scene_modified');
          this.notify('device_moved');
          return true;
        }
      } else if (sel.type === 'wall') {
        const idx = this.scene.walls.findIndex((w) => w.id === sel.id);
        if (idx !== -1) {
          const removedWall = this.scene.walls.splice(idx, 1)[0];

          // Verifica portas ou janelas que estavam nesta parede removida
          const Geometry = window.WifiSim.Core.Geometry;
          const orphaned = this.scene.devices.filter(
            (d) => (d.type === 'door' || d.type === 'window') && d.wall_id === removedWall.id
          );

          for (const item of orphaned) {
            // Se houver outras paredes restantes, transfere a porta/janela para a parede mais próxima
            if (this.scene.walls.length > 0 && Geometry) {
              const closest = Geometry.findClosestWall(item.position, this.scene.walls, (item.size.width_m || 0.9) / 2);
              if (closest) {
                item.wall_id = closest.wall.id;
                item.position.x = closest.point.x;
                item.position.y = closest.point.y;
                item.rotation_deg = closest.angleDeg;
                item.size.height_m = closest.wall.thickness_m || 0.15;
              }
            } else {
              // Se não restou nenhuma parede, remove a porta/janela órfã (pois não podem existir fora de paredes)
              const devIdx = this.scene.devices.findIndex((d) => d.id === item.id);
              if (devIdx !== -1) {
                this.scene.devices.splice(devIdx, 1);
              }
            }
          }

          this.clearSelection();
          this.notify('scene_modified');
          this.notify('wall_modified');
          return true;
        }
      }

      return false;
    }

    saveToStorage(viewportData = null) {
      try {
        if (this.scene && typeof localStorage !== 'undefined') {
          if (viewportData) {
            this.viewportState = {
              zoom: typeof viewportData.zoom === 'number' ? Number(viewportData.zoom.toFixed(2)) : (this.viewportState?.zoom ?? 1.0),
              scrollLeft: typeof viewportData.scrollLeft === 'number' ? Math.round(viewportData.scrollLeft) : (this.viewportState?.scrollLeft ?? 0),
              scrollTop: typeof viewportData.scrollTop === 'number' ? Math.round(viewportData.scrollTop) : (this.viewportState?.scrollTop ?? 0)
            };
          }
          const payload = {
            version: '1.1',
            scene: this.scene,
            viewport: this.viewportState || null,
            activeFrequencyMode: this.activeFrequencyMode || '5.0',
            currentMaterial: this.currentMaterial || 'alvenaria',
            updatedAt: Date.now()
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        }
      } catch (err) {
        // Ignora silenciosamente se localStorage estiver restrito
      }
    }

    setViewportState(viewportData) {
      if (!viewportData) return;
      this.saveToStorage(viewportData);
    }

    clearSavedSession() {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (err) {
        // Ignora silenciosamente
      }
      this.viewportState = null;
      this.isRestoredSession = false;
    }

    hasSavedSession() {
      try {
        if (typeof localStorage !== 'undefined') {
          return !!localStorage.getItem(STORAGE_KEY);
        }
      } catch (e) {}
      return false;
    }

    loadFromStorage(emitEvent = true) {
      try {
        if (typeof localStorage !== 'undefined') {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            let loadedScene = null;
            let loadedViewport = null;
            let loadedFreq = null;
            let loadedMaterial = null;

            // Formato v1.1 com viewport e metadados
            if (parsed && parsed.scene && parsed.scene.dimensions && Array.isArray(parsed.scene.walls)) {
              loadedScene = parsed.scene;
              loadedViewport = parsed.viewport || null;
              loadedFreq = parsed.activeFrequencyMode || null;
              loadedMaterial = parsed.currentMaterial || null;
            } else if (parsed && parsed.dimensions && Array.isArray(parsed.walls)) {
              // Formato v1.0 legado (direto na raiz)
              loadedScene = parsed;
            }

            if (loadedScene) {
              this.scene = loadedScene;
              this.viewportState = loadedViewport;
              if (loadedFreq) this.activeFrequencyMode = loadedFreq;
              if (loadedMaterial) this.currentMaterial = loadedMaterial;
              this.isRestoredSession = true;
              this.selectedItem = null;
              if (emitEvent) {
                this.notify('storage_loaded');
              }
              return true;
            }
          }
        }
      } catch (err) {
        console.warn('[SceneState] Falha ao carregar do localStorage:', err);
      }
      return false;
    }
  }

  window.WifiSim.State = new SceneState();
})();
