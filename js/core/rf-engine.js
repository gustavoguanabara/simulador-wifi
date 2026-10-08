/**
 * Simulador Wi-Fi - Motor de Física e Radiofrequência (RF Engine)
 * Camada: Core (WifiSim.Core.RF)
 * Zero dependências externas - ECMAScript 2020+
 */

(function () {
  'use strict';

  window.WifiSim = window.WifiSim || {};
  window.WifiSim.Core = window.WifiSim.Core || {};

  /**
   * Tabela padrão de atenuação por tipo de material (em dB)
   * Baseado em medições e normas IEEE 802.11 / TRD Seção 4.2
   */
  const MATERIAL_ATTENUATION = {
    drywall: { name: 'Drywall / Gesso', db24: 3.0, db5: 5.0, color: '#bdc3c7' },
    vidro: { name: 'Vidro Simples', db24: 2.0, db5: 4.0, color: '#74b9ff' },
    madeira: { name: 'Porta de Madeira', db24: 3.5, db5: 6.0, color: '#e17055' },
    alvenaria: { name: 'Alvenaria (Tijolo)', db24: 6.5, db5: 12.0, color: '#d63031' },
    concreto: { name: 'Concreto Armado', db24: 15.0, db5: 25.0, color: '#636e72' },
    espelho: { name: 'Espelho / Blindagem Metálica', db24: 12.0, db5: 18.0, color: '#0984e3' }
  };

  /**
   * Tabela de atenuação de componentes de mobiliário, eletrodomésticos e barreiras RF
   */
  const OBSTACLE_ATTENUATION = {
    // Mobiliário
    bed: { name: 'Cama Casal', db24: 2.5, db5: 3.5 },
    sofa: { name: 'Sofá Estofado', db24: 3.0, db5: 4.5 },
    table: { name: 'Mesa de Madeira/Vidro', db24: 1.5, db5: 2.5 },
    wardrobe: { name: 'Guarda-Roupa / Armário', db24: 5.0, db5: 8.0 },

    // Eletrodomésticos, barreiras metálicas e líquidos
    fridge: { name: 'Geladeira (Aço / Compressor)', db24: 25.0, db5: 32.0 },
    microwave: { name: 'Forno Micro-ondas (Carcaça)', db24: 20.0, db5: 28.0 },
    mirror_obj: { name: 'Espelho com Filme Metálico', db24: 14.0, db5: 20.0 },
    aquarium: { name: 'Aquário (Água / Absorção RF)', db24: 16.0, db5: 22.0 },
    cordless_phone: { name: 'Telefone Sem Fio 2.4 GHz', db24: 1.0, db5: 1.0 }
  };

  const RF = {
    MATERIALS: MATERIAL_ATTENUATION,
    OBSTACLES: OBSTACLE_ATTENUATION,

    /**
     * Calcula o Free Space Path Loss (FSPL) em dB
     * @param {number} distanceM - Distância em metros (mínimo 0.5m)
     * @param {number} freqGHz - Frequência em GHz (2.4 ou 5.0)
     */
    fspl(distanceM, freqGHz = 2.4) {
      const d = Math.max(0.5, distanceM);
      const fMHz = freqGHz * 1000;
      // Fórmula analítica: FSPL = 20*log10(d) + 20*log10(fMHz) - 27.55
      const loss = 20 * Math.log10(d) + 20 * Math.log10(fMHz) - 27.55;
      return Number(loss.toFixed(2));
    },

    /**
     * Retorna a perda em dB de uma parede com base no material e frequência
     */
    getWallAttenuation(material, freqGHz = 2.4) {
      const mat = MATERIAL_ATTENUATION[material] || MATERIAL_ATTENUATION.alvenaria;
      return freqGHz >= 5.0 ? mat.db5 : mat.db24;
    },

    /**
     * Retorna a perda em dB de um obstáculo (móvel, eletrodoméstico) com base no tipo e frequência
     */
    getObstacleAttenuation(type, freqGHz = 2.4) {
      const obs = OBSTACLE_ATTENUATION[type];
      if (!obs) return 0;
      return freqGHz >= 5.0 ? obs.db5 : obs.db24;
    },

    /**
     * Calcula o RSSI para uma portadora específica (2.4 ou 5.0 GHz)
     */
    _calculateBandRSSI(transmitter, targetPoint, walls, obstacles, freqGHz) {
      const Geometry = window.WifiSim.Core.Geometry;
      const dist = Geometry ? Geometry.distance(transmitter.position, targetPoint) : 1;
      const txConfig = transmitter.rf_config;
      const txPower = txConfig.tx_power_dbm !== undefined ? txConfig.tx_power_dbm : 20.0;
      const antennaGain = txConfig.antenna_gain_dbi !== undefined ? txConfig.antenna_gain_dbi : 3.0;

      // 1. Perda de espaço livre (FSPL)
      const pathLoss = this.fspl(dist, freqGHz);

      // 2. Perda por obstáculos lineares (paredes)
      let wallLossTotal = 0;
      if (Geometry && Array.isArray(walls)) {
        for (const wall of walls) {
          const hitRes = Geometry.intersectSegments(transmitter.position, targetPoint, wall.p1, wall.p2);
          if (hitRes && hitRes.hit && hitRes.point) {
            // Verifica se o raio cruzou exatamente pelo vão de uma porta ou janela fixada nesta parede
            let apertureLoss = null;
            if (Array.isArray(obstacles)) {
              for (const ap of obstacles) {
                if (ap && (ap.type === 'door' || ap.type === 'window') && ap.wall_id === wall.id && ap.position) {
                  const apHalfW = (ap.size?.width_m || 0.9) / 2;
                  const distToAp = Geometry.distance(hitRes.point, ap.position);
                  if (distToAp <= apHalfW) {
                    const att = ap.attenuation_db || (ap.type === 'door' ? { db24: 3.5, db5: 6.0 } : { db24: 2.0, db5: 4.0 });
                    apertureLoss = freqGHz >= 5.0 ? (att.db5 || 6.0) : (att.db24 || 3.5);
                    break;
                  }
                }
              }
            }

            if (apertureLoss !== null) {
              wallLossTotal += apertureLoss;
            } else {
              wallLossTotal += this.getWallAttenuation(wall.material, freqGHz);
            }
          }
        }
      }

      // 3. Perda por obstáculos volumétricos (Móveis, Geladeira, Aquário, Espelho, etc.)
      let obstacleLossTotal = 0;
      if (Geometry && Array.isArray(obstacles) && typeof Geometry.rayIntersectsOrientedBox === 'function') {
        for (const obs of obstacles) {
          if (!obs || obs.id === transmitter.id || !obs.position || !obs.size) continue;
          // Portas e janelas já foram tratadas no cálculo de interseção da parede
          if (obs.type === 'door' || obs.type === 'window') continue;

          const att = obs.attenuation_db || OBSTACLE_ATTENUATION[obs.type];
          if (att) {
            if (Geometry.rayIntersectsOrientedBox(transmitter.position, targetPoint, obs.position, obs.size, obs.rotation_deg || 0)) {
              obstacleLossTotal += freqGHz >= 5.0 ? (att.db5 || 3.0) : (att.db24 || 2.0);
            }
          }
        }
      }

      // 4. Penalidade por sobreposição de ruído ativo em 2.4 GHz (ex: micro-ondas ligado)
      let noisePenalty = 0;
      if (freqGHz < 4.0 && Geometry && Array.isArray(obstacles)) {
        for (const noiseSrc of obstacles) {
          if (noiseSrc && noiseSrc.category === 'noise_source' && noiseSrc.rf_config && noiseSrc.rf_config.is_active && noiseSrc.position) {
            const noiseDist = Geometry.distance(noiseSrc.position, targetPoint);
            const radius = noiseSrc.rf_config.interference_radius_m || 3.5;
            if (noiseDist <= radius) {
              noisePenalty += (1 - noiseDist / radius) * 16.0;
            }
          }
        }
      }

      return txPower + antennaGain - pathLoss - wallLossTotal - obstacleLossTotal - noisePenalty;
    },

    /**
     * Calcula o RSSI em um ponto alvo a partir de um transmissor, paredes e obstáculos físicos.
     * Suporta operação em 2.4 GHz, 5.0 GHz ou Múltiplo (Dual-Band simultâneo com seleção dinâmica da melhor portadora).
     * @param {Object} transmitter - Dispositivo emissor com rf_config e position
     * @param {Object} targetPoint - Ponto avaliado {x, y} em metros
     * @param {Array} walls - Lista de paredes da cena
     * @param {Array} obstacles - Lista de objetos/móveis/fontes de interferência
     */
    calculateRSSI(transmitter, targetPoint, walls = [], obstacles = []) {
      if (!transmitter || !transmitter.position || !transmitter.rf_config) {
        return -100;
      }

      const txConfig = transmitter.rf_config;
      if (!txConfig.is_active) {
        return -100;
      }

      const isMulti = txConfig.frequency_mode === 'multi' || txConfig.frequency_ghz === 'multi';

      let rssi;
      if (isMulti) {
        // Modo Múltiplo (Dual-Band simultâneo 2.4G + 5.0G)
        // Seleciona a portadora de melhor desempenho no ponto alvo (Band Steering)
        const rssi24 = this._calculateBandRSSI(transmitter, targetPoint, walls, obstacles, 2.4);
        const rssi50 = this._calculateBandRSSI(transmitter, targetPoint, walls, obstacles, 5.0);
        rssi = Math.max(rssi24, rssi50);
      } else {
        const freq = Number(txConfig.frequency_ghz) || 5.0;
        rssi = this._calculateBandRSSI(transmitter, targetPoint, walls, obstacles, freq);
      }

      return Number(Math.max(-100, Math.min(-20, rssi)).toFixed(1));
    },

    /**
     * Avalia o nível de qualidade e cor com base no RSSI recebido
     */
    evaluateQuality(rssi) {
      if (rssi >= -55) {
        return { level: 'excellent', label: 'Excelente / Forte', color: 'rgb(46, 204, 113)', hex: '#2ecc71' };
      } else if (rssi >= -67) {
        return { level: 'good', label: 'Bom / Médio', color: 'rgb(241, 196, 15)', hex: '#f1c40f' };
      } else if (rssi >= -78) {
        return { level: 'unstable', label: 'Instável / Fraco', color: 'rgb(230, 126, 34)', hex: '#e67e22' };
      } else if (rssi >= -88) {
        return { level: 'bad', label: 'Muito Fraco', color: 'rgb(231, 76, 60)', hex: '#e74c3c' };
      } else {
        return { level: 'none', label: 'Sem Sinal', color: 'rgb(30, 30, 35)', hex: '#1e1e23' };
      }
    }
  };

  window.WifiSim.Core.RF = RF;
})();
