/**
 * Simulador Wi-Fi - Manipulação e Interação de Usuário (Mouse & Gizmos)
 * Camada: UI (WifiSim.UI.Interaction)
 * Zero dependências externas - ECMAScript 2020+
 */

(function () {
  'use strict';

  window.WifiSim = window.WifiSim || {};
  window.WifiSim.UI = window.WifiSim.UI || {};

  class InteractionHandler {
    constructor() {
      this.canvas = null;
      this.isDragging = false;
      this.dragMode = null; // 'move_device' | 'vertex_p1' | 'vertex_p2' | 'wall_body' | 'draw_wall' | 'rotate_device'
      this.dragTarget = null;
      this.dragStartPos = null;
      this.dragOffset = null;
      this.pendingWallStart = null;
      this.pendingWallCurrent = null;
      this.activeSnap = null;
      this.pointerDownPos = null;
      this.hasMovedSignificantly = false;
      this.clickedOnSelectedDoor = false;
      this.clickedOnSelectedElectronic = false;
      this.initialPointerAngle = null;
      this.initialDeviceAngle = null;
      this.isPinching = false;
      this.pinchCooldownUntil = 0;
    }

    init(canvas) {
      this.canvas = canvas;
      this.bindEvents();
    }

    bindEvents() {
      const c = this.canvas;
      if (!c) return;

      c.addEventListener('pointerdown', (e) => this.onPointerDown(e));
      window.addEventListener('pointermove', (e) => this.onPointerMove(e));
      window.addEventListener('pointerup', (e) => this.onPointerUp(e));
      window.addEventListener('pointercancel', () => this.cancelDrag(true));

      // Supressão imediata de arraste de objetos ao detectar multitoque (pinça/pan no mobile)
      window.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches.length >= 2) {
          this.isPinching = true;
          this.cancelDrag(true);
        }
      }, { passive: true, capture: true });

      window.addEventListener('touchmove', (e) => {
        if (e.touches && e.touches.length >= 2) {
          this.isPinching = true;
          this.cancelDrag(true);
        }
      }, { passive: true, capture: true });

      window.addEventListener('touchend', (e) => {
        if (this.isPinching) {
          if (!e.touches || e.touches.length === 0) {
            this.isPinching = false;
            this.pinchCooldownUntil = Date.now() + 350;
          }
        }
      }, { passive: true });

      window.addEventListener('touchcancel', () => {
        this.isPinching = false;
        this.cancelDrag(true);
        this.pinchCooldownUntil = Date.now() + 350;
      }, { passive: true });

      // Atalho de Teclado: Tecla Delete / Backspace para excluir o objeto selecionado (paredes, portas, janelas, objetos e equipamentos)
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          const activeEl = document.activeElement;
          const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT');
          const state = window.WifiSim.State;
          if (!isInput && state && state.selectedItem) {
            e.preventDefault();
            state.deleteSelected();
          }
        }
      });
    }

    getCanvasCoords(e) {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = rect.width > 0 ? this.canvas.width / rect.width : 1;
      const scaleY = rect.height > 0 ? this.canvas.height / rect.height : 1;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    }

    getMeterCoords(pxCoords) {
      const state = window.WifiSim.State;
      const ppm = (state && state.scene && state.scene.dimensions.pixels_per_meter) || 60;
      return {
        x: Number((pxCoords.x / ppm).toFixed(2)),
        y: Number((pxCoords.y / ppm).toFixed(2))
      };
    }

    onPointerDown(e) {
      const state = window.WifiSim.State;
      if (!state || !state.scene) return;

      // Se o usuário estiver no meio de um gesto de pinça ou no período pós-pinça, ignora toques no canvas
      if (this.isPinching || Date.now() < this.pinchCooldownUntil) {
        this.cancelDrag(true);
        return;
      }

      // Se for multitoque secundário (ex: segundo dedo no pinch-to-zoom), ignora interação com objetos
      if (e.pointerType === 'touch' && (e.isPrimary === false || (e.touches && e.touches.length > 1))) {
        this.cancelDrag(true);
        return;
      }

      const pxPos = this.getCanvasCoords(e);
      const mPos = this.getMeterCoords(pxPos);
      const ppm = state.scene.dimensions.pixels_per_meter || 60;

      // Tolerâncias ergonômicas de toque calibradas contra falsos toques no mobile
      const isTouch = (e.pointerType === 'touch') || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 768);
      const vertexHitRadius = isTouch ? 20 : 12;
      const rotateHandleHitM = isTouch ? 0.35 : 0.25;
      const hitMarginM = isTouch ? 0.18 : 0.15;
      const wallHitMarginM = isTouch ? 0.20 : 0.15;

      this.pointerDownPos = { px: pxPos, m: mPos, time: Date.now(), isTouch };
      this.hasMovedSignificantly = false;

      // 1. Ferramenta de desenho de parede
      if (state.activeTool === 'wall') {
        this.dragMode = 'draw_wall';
        this.pendingWallStart = mPos;
        this.pendingWallCurrent = mPos;
        this.activeSnap = null;
        return;
      }

      // 2. Se já houver dispositivo selecionado, verifica se clicou na alça de rotação angular
      // (Portas e Janelas não possuem alça de rotação manual, pois acompanham a rotação da parede hospedeira)
      if (state.selectedItem && state.selectedItem.type === 'device') {
        const dev = state.scene.devices.find((d) => d.id === state.selectedItem.id);
        if (dev && dev.type !== 'door' && dev.type !== 'window') {
          const Geometry = window.WifiSim?.Core?.Geometry;
          const handlePos = Geometry?.getRotationHandlePositionM
            ? Geometry.getRotationHandlePositionM(dev, ppm, this.canvas?.height)
            : null;

          const hx = handlePos ? handlePos.x : (dev.position.x + ((dev.size.height_m || 0.5) / 2 + 24 / ppm) * Math.sin(((dev.rotation_deg || 0) * Math.PI) / 180));
          const hy = handlePos ? handlePos.y : (dev.position.y - ((dev.size.height_m || 0.5) / 2 + 24 / ppm) * Math.cos(((dev.rotation_deg || 0) * Math.PI) / 180));

          const d = Math.hypot(mPos.x - hx, mPos.y - hy);
          if (d <= rotateHandleHitM) {
            this.isDragging = true;
            this.dragMode = 'rotate_device';
            this.dragTarget = dev;
            this.dragStartPos = { mPos, initialDeg: dev.rotation_deg || 0 };
            this.activeSnap = null;
            // Registra ângulo inicial do ponteiro e do objeto para rotação suave e contínua sem saltos angulares
            this.initialPointerAngle = (Math.atan2(mPos.y - dev.position.y, mPos.x - dev.position.x) * 180) / Math.PI;
            this.initialDeviceAngle = dev.rotation_deg || 0;
            return;
          }
        }
      }

      // 3. Se houver parede selecionada, verifica se clicou nas alças de ancoragem
      if (state.selectedItem && state.selectedItem.type === 'wall') {
        const wall = state.scene.walls.find((w) => w.id === state.selectedItem.id);
        if (wall) {
          const p1Dist = Math.hypot(pxPos.x - wall.p1.x * ppm, pxPos.y - wall.p1.y * ppm);
          const p2Dist = Math.hypot(pxPos.x - wall.p2.x * ppm, pxPos.y - wall.p2.y * ppm);

          if (p1Dist <= vertexHitRadius) {
            this.isDragging = true;
            this.dragMode = 'vertex_p1';
            this.dragTarget = wall;
            this.dragStartPos = { mPos, vertexPos: { x: wall.p1.x, y: wall.p1.y } };
            this.activeSnap = null;
            return;
          } else if (p2Dist <= vertexHitRadius) {
            this.isDragging = true;
            this.dragMode = 'vertex_p2';
            this.dragTarget = wall;
            this.dragStartPos = { mPos, vertexPos: { x: wall.p2.x, y: wall.p2.y } };
            this.activeSnap = null;
            return;
          }
        }
      }

      // 4. Verifica clique sobre dispositivos, móveis e obstáculos (Oriented Bounding Box)
      for (let i = state.scene.devices.length - 1; i >= 0; i--) {
        const dev = state.scene.devices[i];
        const dx = mPos.x - dev.position.x;
        const dy = mPos.y - dev.position.y;
        const rad = -((dev.rotation_deg || 0) * Math.PI) / 180;
        const localX = dx * Math.cos(rad) - dy * Math.sin(rad);
        const localY = dx * Math.sin(rad) + dy * Math.cos(rad);
        const halfW = (dev.size.width_m || 0.5) / 2;
        const halfH = (dev.size.height_m || 0.5) / 2;

        let hit = false;
        if (dev.type === 'door') {
          // Para portas, a área de clique abrange o vão na parede, a folha e o arco de abertura
          const isOutward = dev.swing_direction === 'outward' || dev.flip_swing === true;
          const doorW = dev.size.width_m || 0.9;
          const minY = isOutward ? -doorW - hitMarginM : -halfH - hitMarginM;
          const maxY = isOutward ? halfH + hitMarginM : doorW + hitMarginM;
          hit = Math.abs(localX) <= halfW + hitMarginM && localY >= minY && localY <= maxY;
        } else {
          hit = Math.abs(localX) <= halfW + hitMarginM && Math.abs(localY) <= halfH + hitMarginM;
        }

        if (hit) {
          const isDoor = dev.type === 'door';
          const isElectronic = (state && typeof state.isElectronicDevice === 'function')
            ? state.isElectronicDevice(dev)
            : (dev.category === 'transmitter' || dev.category === 'receiver' || dev.category === 'noise_source');
          const wasAlreadySelected = !!(state.selectedItem && state.selectedItem.type === 'device' && state.selectedItem.id === dev.id);
          this.clickedOnSelectedDoor = isDoor && wasAlreadySelected;
          this.clickedOnSelectedElectronic = isElectronic && wasAlreadySelected;

          state.select('device', dev.id);
          this.isDragging = true;
          this.dragMode = 'move_device';
          this.dragTarget = dev;
          this.dragStartPos = { mPos, devPos: { x: dev.position.x, y: dev.position.y } };
          this.dragOffset = { x: mPos.x - dev.position.x, y: mPos.y - dev.position.y };
          this.activeSnap = null;
          return;
        }
      }

      // 5. Verifica clique sobre paredes
      const Geometry = window.WifiSim.Core.Geometry;
      if (Geometry) {
        for (const wall of state.scene.walls) {
          const dist = Geometry.distanceToSegment(mPos, wall.p1, wall.p2);
          if (dist <= (wall.thickness_m || 0.15) + wallHitMarginM) {
            state.select('wall', wall.id);
            this.isDragging = true;
            this.dragMode = 'wall_body';
            this.dragTarget = wall;
            this.dragStartPos = { mPos, p1: { ...wall.p1 }, p2: { ...wall.p2 } };
            this.activeSnap = null;
            return;
          }
        }
      }

      // Clicou no vazio: desmarca
      state.clearSelection();
      this.activeSnap = null;
    }

    onPointerMove(e) {
      if (!this.isDragging && this.dragMode !== 'draw_wall') return;

      // Se o usuário estiver fazendo gesto de pinça ou no cooldown pós-pinça, aborta imediatamente o drag
      if (this.isPinching || Date.now() < this.pinchCooldownUntil) {
        this.cancelDrag(true);
        return;
      }

      // Se for touch secundário ou multitoque detectado, cancela qualquer drag de objeto
      if (e.pointerType === 'touch' && (e.isPrimary === false || (e.touches && e.touches.length > 1))) {
        this.cancelDrag(true);
        return;
      }

      const state = window.WifiSim.State;
      if (!state || !state.scene) return;

      const pxPos = this.getCanvasCoords(e);
      const mPos = this.getMeterCoords(pxPos);
      const Geometry = window.WifiSim.Core.Geometry;

      // Monitora distância percorrida para discernir clique estático / pinça de arraste deliberado
      // No mouse 5px é suficiente. No touch, 18px evita tremor involuntário do dedo e falsos arrastes ao iniciar pinça
      const isTouch = (e.pointerType === 'touch') || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 768);
      const dragThresholdPx = isTouch ? 18 : 5;

      if (this.pointerDownPos) {
        const pxDist = Math.hypot(pxPos.x - this.pointerDownPos.px.x, pxPos.y - this.pointerDownPos.px.y);
        if (pxDist > dragThresholdPx) {
          this.hasMovedSignificantly = true;
        }
      }

      // Se ainda não se moveu significativamente além do limiar, preserva a posição original
      if (!this.hasMovedSignificantly && (this.dragMode === 'move_device' || this.dragMode === 'wall_body' || this.dragMode === 'vertex_p1' || this.dragMode === 'vertex_p2' || this.dragMode === 'rotate_device')) {
        return;
      }

      if (this.dragMode === 'move_device' && this.dragTarget) {
        // Regra Especial de Portas e Janelas:
        // 1. Não podem ser posicionadas fora de paredes
        // 2. Seguem exatamente a rotação da parede onde estão
        // 3. Se o mouse for arrastado para fora da parede, posicionam-se na parede mais próxima com o ângulo exato da mesma
        if (this.dragTarget.type === 'door' || this.dragTarget.type === 'window') {
          const walls = state.scene.walls;
          if (walls && walls.length > 0 && Geometry && Geometry.findClosestWall) {
            const margin = (this.dragTarget.size?.width_m || 0.9) / 2;
            const closest = Geometry.findClosestWall(mPos, walls, margin);
            if (closest) {
              this.dragTarget.position.x = closest.point.x;
              this.dragTarget.position.y = closest.point.y;
              this.dragTarget.rotation_deg = closest.angleDeg;
              this.dragTarget.wall_id = closest.wall.id;
              this.dragTarget.size.height_m = closest.wall.thickness_m || 0.15;
              this.activeSnap = {
                type: 'aperture_wall',
                wall: closest.wall,
                aperture: this.dragTarget
              };
            }
          }
          state.notify('device_moved');
          return;
        }

        const rawTargetX = mPos.x - (this.dragOffset ? this.dragOffset.x : 0);
        const rawTargetY = mPos.y - (this.dragOffset ? this.dragOffset.y : 0);

        let finalX = rawTargetX;
        let finalY = rawTargetY;

        // Snap magnético contra paredes próximas:
        // Encosta suavemente na face da parede quando perto, mas solta com uma leve puxada além do limiar.
        if (Geometry && Geometry.snapDeviceToWalls && state.scene.walls && state.scene.walls.length > 0) {
          const snap = Geometry.snapDeviceToWalls(
            { x: rawTargetX, y: rawTargetY },
            this.dragTarget.size || { width_m: 0.5, height_m: 0.5 },
            this.dragTarget.rotation_deg || 0,
            state.scene.walls,
            0.20 // 20 cm de tolerância de atração
          );
          if (snap.isSnapped) {
            finalX = snap.x;
            finalY = snap.y;
            this.activeSnap = {
              type: 'device_wall',
              wallId: snap.wallId,
              wall: snap.wall,
              device: this.dragTarget
            };
          } else {
            this.activeSnap = null;
          }
        } else {
          this.activeSnap = null;
        }

        const maxX = state.scene.dimensions.width_m - 0.2;
        const maxY = state.scene.dimensions.height_m - 0.2;
        this.dragTarget.position.x = Number(Math.max(0.2, Math.min(maxX, finalX)).toFixed(2));
        this.dragTarget.position.y = Number(Math.max(0.2, Math.min(maxY, finalY)).toFixed(2));
        state.notify('device_moved');
      } else if (this.dragMode === 'rotate_device' && this.dragTarget) {
        const currentPointerAngle = (Math.atan2(mPos.y - this.dragTarget.position.y, mPos.x - this.dragTarget.position.x) * 180) / Math.PI;
        const delta = currentPointerAngle - (this.initialPointerAngle !== null ? this.initialPointerAngle : currentPointerAngle);
        let deg = ((this.initialDeviceAngle !== null ? this.initialDeviceAngle : (this.dragTarget.rotation_deg || 0)) + delta) % 360;
        if (deg < 0) deg += 360;

        if (e.shiftKey) {
          deg = Math.round(deg / 15) * 15;
          this.activeSnap = { type: 'rotation', isSnapped: true, deg };
        } else if (Geometry && Geometry.snapAngle90) {
          // Snap em múltiplos de 90° (0°, 90°, 180°, 270°) com rotação livre fora da tolerância
          const snapped = Geometry.snapAngle90(deg, 6);
          const normalized = ((deg % 360) + 360) % 360;
          const isSnapped = snapped % 90 === 0 && Math.abs(normalized - snapped) <= 6;
          deg = snapped;
          this.activeSnap = isSnapped ? { type: 'rotation', isSnapped: true, deg } : null;
        } else {
          deg = Math.round(deg);
          this.activeSnap = null;
        }

        this.dragTarget.rotation_deg = deg % 360;
        this.hasMovedSignificantly = true;
        state.notify('device_moved');
      } else if (this.dragMode === 'vertex_p1' && this.dragTarget) {
        let finalPos = mPos;
        if (Geometry && Geometry.snapPointOrthogonal && !e.shiftKey) {
          const snap = Geometry.snapPointOrthogonal(this.dragTarget.p2, mPos, 5);
          finalPos = { x: snap.x, y: snap.y };
          this.activeSnap = snap.isSnapped ? { type: 'wall_vertex', axis: snap.axis, anchor: this.dragTarget.p2, point: finalPos } : null;
        } else {
          this.activeSnap = null;
        }
        this.dragTarget.p1.x = Number(finalPos.x.toFixed(2));
        this.dragTarget.p1.y = Number(finalPos.y.toFixed(2));
        state.notify('wall_modified');
      } else if (this.dragMode === 'vertex_p2' && this.dragTarget) {
        let finalPos = mPos;
        if (Geometry && Geometry.snapPointOrthogonal && !e.shiftKey) {
          const snap = Geometry.snapPointOrthogonal(this.dragTarget.p1, mPos, 5);
          finalPos = { x: snap.x, y: snap.y };
          this.activeSnap = snap.isSnapped ? { type: 'wall_vertex', axis: snap.axis, anchor: this.dragTarget.p1, point: finalPos } : null;
        } else {
          this.activeSnap = null;
        }
        this.dragTarget.p2.x = Number(finalPos.x.toFixed(2));
        this.dragTarget.p2.y = Number(finalPos.y.toFixed(2));
        state.notify('wall_modified');
      } else if (this.dragMode === 'wall_body' && this.dragTarget && this.dragStartPos) {
        const dx = mPos.x - this.dragStartPos.mPos.x;
        const dy = mPos.y - this.dragStartPos.mPos.y;
        this.dragTarget.p1.x = Number((this.dragStartPos.p1.x + dx).toFixed(2));
        this.dragTarget.p1.y = Number((this.dragStartPos.p1.y + dy).toFixed(2));
        this.dragTarget.p2.x = Number((this.dragStartPos.p2.x + dx).toFixed(2));
        this.dragTarget.p2.y = Number((this.dragStartPos.p2.y + dy).toFixed(2));
        this.activeSnap = null;
        state.notify('wall_modified');
      } else if (this.dragMode === 'draw_wall' && this.pendingWallStart) {
        let finalPos = mPos;
        if (Geometry && Geometry.snapPointOrthogonal && !e.shiftKey) {
          const snap = Geometry.snapPointOrthogonal(this.pendingWallStart, mPos, 5);
          finalPos = { x: snap.x, y: snap.y };
          this.activeSnap = snap.isSnapped ? { type: 'wall_draw', axis: snap.axis, anchor: this.pendingWallStart, point: finalPos } : null;
        } else {
          this.activeSnap = null;
        }
        this.pendingWallCurrent = finalPos;
      }
    }

    onPointerUp(e) {
      const state = window.WifiSim.State;

      // Se deu apenas um clique (sem arraste significativo) em uma porta que já estava previamente selecionada,
      // avança o ciclo de abertura (para dentro/fora e esquerda/direita)
      if (this.dragTarget && this.dragTarget.type === 'door' && !this.hasMovedSignificantly && state) {
        if (this.clickedOnSelectedDoor) {
          state.cycleDoorSwing(this.dragTarget.id);
        }
      }

      // Se deu apenas um clique (sem arraste significativo) em um aparelho eletrônico já selecionado,
      // alterna o estado ligado / desligado (power toggle)
      if (this.dragTarget && !this.hasMovedSignificantly && this.clickedOnSelectedElectronic && state) {
        state.toggleDevicePower(this.dragTarget.id);
      }

      if (this.dragMode === 'draw_wall' && this.pendingWallStart && state) {
        const pxPos = this.getCanvasCoords(e);
        const mPos = this.getMeterCoords(pxPos);
        let finalPos = mPos;
        const Geometry = window.WifiSim.Core.Geometry;
        if (Geometry && Geometry.snapPointOrthogonal && !e.shiftKey) {
          const snap = Geometry.snapPointOrthogonal(this.pendingWallStart, mPos, 5);
          finalPos = { x: snap.x, y: snap.y };
        }

        const dist = Math.hypot(finalPos.x - this.pendingWallStart.x, finalPos.y - this.pendingWallStart.y);
        if (dist >= 0.5) {
          state.addWall(this.pendingWallStart, finalPos, state.currentMaterial);
        }
        this.pendingWallStart = null;
        this.pendingWallCurrent = null;
      }

      if (this.dragMode === 'rotate_device' && this.dragTarget && state) {
        state.saveToStorage();
        state.notify('device_moved');
      }

      if (this.hasMovedSignificantly && state) {
        state.saveToStorage();
      }

      this.isDragging = false;
      this.dragMode = null;
      this.dragTarget = null;
      this.dragStartPos = null;
      this.dragOffset = null;
      this.activeSnap = null;
      this.pointerDownPos = null;
      this.hasMovedSignificantly = false;
      this.clickedOnSelectedDoor = false;
      this.clickedOnSelectedElectronic = false;
      this.initialPointerAngle = null;
      this.initialDeviceAngle = null;
    }

    /**
     * Cancela qualquer operação de arraste ou rotação em andamento e restaura a posição original.
     * Crucial para abortar falsos toques durante gestos de pinça (pinch-to-zoom) no celular.
     */
    cancelDrag(restoreOriginalPosition = true) {
      if (this.isDragging && this.dragTarget && restoreOriginalPosition && this.dragStartPos) {
        const state = window.WifiSim?.State;
        if (this.dragMode === 'move_device' && this.dragStartPos.devPos) {
          this.dragTarget.position.x = this.dragStartPos.devPos.x;
          this.dragTarget.position.y = this.dragStartPos.devPos.y;
          if (state) state.notify('device_moved');
        } else if (this.dragMode === 'wall_body' && this.dragStartPos.p1 && this.dragStartPos.p2) {
          this.dragTarget.p1.x = this.dragStartPos.p1.x;
          this.dragTarget.p1.y = this.dragStartPos.p1.y;
          this.dragTarget.p2.x = this.dragStartPos.p2.x;
          this.dragTarget.p2.y = this.dragStartPos.p2.y;
          if (state) state.notify('wall_modified');
        } else if (this.dragMode === 'vertex_p1' && this.dragStartPos.vertexPos) {
          this.dragTarget.p1.x = this.dragStartPos.vertexPos.x;
          this.dragTarget.p1.y = this.dragStartPos.vertexPos.y;
          if (state) state.notify('wall_modified');
        } else if (this.dragMode === 'vertex_p2' && this.dragStartPos.vertexPos) {
          this.dragTarget.p2.x = this.dragStartPos.vertexPos.x;
          this.dragTarget.p2.y = this.dragStartPos.vertexPos.y;
          if (state) state.notify('wall_modified');
        } else if (this.dragMode === 'rotate_device' && this.dragStartPos.initialDeg !== undefined) {
          this.dragTarget.rotation_deg = this.dragStartPos.initialDeg;
          if (state) state.notify('device_moved');
        }
      }

      this.isDragging = false;
      this.dragMode = null;
      this.dragTarget = null;
      this.dragStartPos = null;
      this.dragOffset = null;
      this.activeSnap = null;
      this.pointerDownPos = null;
      this.hasMovedSignificantly = false;
      this.clickedOnSelectedDoor = false;
      this.clickedOnSelectedElectronic = false;
      this.initialPointerAngle = null;
      this.initialDeviceAngle = null;
      this.pendingWallStart = null;
      this.pendingWallCurrent = null;
    }
  }

  window.WifiSim.UI.Interaction = new InteractionHandler();
})();
