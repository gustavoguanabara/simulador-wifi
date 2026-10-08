/**
 * Simulador Wi-Fi - Motor de Renderização do Heatmap
 * Camada: Core (WifiSim.Core.Heatmap)
 * Zero dependências externas - ECMAScript 2020+
 */

(function () {
  'use strict';

  window.WifiSim = window.WifiSim || {};
  window.WifiSim.Core = window.WifiSim.Core || {};

  /**
   * Converte valor de RSSI em cor RGBA interpolada
   */
  function rssiToRgba(rssi) {
    // Escala de -90 dBm a -40 dBm
    if (rssi <= -90) {
      return [30, 30, 35, 10]; // Quase transparente
    }
    if (rssi >= -50) {
      return [46, 204, 113, 190]; // Verde forte
    }

    if (rssi >= -65) {
      // Interpola entre Amarelo (241, 196, 15) e Verde (46, 204, 113)
      const factor = (rssi - (-65)) / 15;
      const r = Math.round(241 + factor * (46 - 241));
      const g = Math.round(196 + factor * (204 - 196));
      const b = Math.round(15 + factor * (113 - 15));
      return [r, g, b, 175];
    } else if (rssi >= -78) {
      // Interpola entre Laranja (230, 126, 34) e Amarelo (241, 196, 15)
      const factor = (rssi - (-78)) / 13;
      const r = Math.round(230 + factor * (241 - 230));
      const g = Math.round(126 + factor * (196 - 126));
      const b = Math.round(34 + factor * (15 - 34));
      return [r, g, b, 160];
    } else {
      // Interpola entre Vermelho (231, 76, 60) e Laranja (230, 126, 34)
      const factor = (rssi - (-90)) / 12;
      const r = Math.round(231 + factor * (230 - 231));
      const g = Math.round(76 + factor * (126 - 76));
      const b = Math.round(60 + factor * (34 - 60));
      return [r, g, b, 140];
    }
  }

  const Heatmap = {
    /**
     * Renderiza o mapa de calor no canvas fornecido
     */
    render(canvas, scene) {
      if (!canvas || !scene) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const transmitters = (scene.devices || []).filter(
        (d) => d.category === 'transmitter' && d.rf_config && d.rf_config.is_active
      );

      if (transmitters.length === 0) {
        return;
      }

      const ppm = scene.dimensions.pixels_per_meter || 60;
      const stepMeters = scene.grid.step_m || 0.25;
      const stepPx = Math.max(12, Math.round(stepMeters * ppm));

      const cols = Math.ceil(width / stepPx);
      const rows = Math.ceil(height / stepPx);

      const RF = window.WifiSim.Core.RF;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const pixelX = c * stepPx + stepPx / 2;
          const pixelY = r * stepPx + stepPx / 2;

          const pointM = {
            x: pixelX / ppm,
            y: pixelY / ppm
          };

          // Considera o melhor sinal entre todos os transmissores ativos
          let bestRSSI = -100;
          for (const tx of transmitters) {
            const currentRSSI = RF.calculateRSSI(tx, pointM, scene.walls, scene.devices);
            if (currentRSSI > bestRSSI) {
              bestRSSI = currentRSSI;
            }
          }

          if (bestRSSI > -90) {
            const [red, green, blue, alpha] = rssiToRgba(bestRSSI);
            ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha / 255})`;
            ctx.fillRect(c * stepPx, r * stepPx, stepPx, stepPx);
          }
        }
      }
    }
  };

  window.WifiSim.Core.Heatmap = Heatmap;
})();
