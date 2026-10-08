/**
 * Simulador Wi-Fi - Módulo de Geometria 2D
 * Camada: Core (WifiSim.Core.Geometry)
 * Zero dependências externas - ECMAScript 2020+
 */

(function () {
  'use strict';

  window.WifiSim = window.WifiSim || {};
  window.WifiSim.Core = window.WifiSim.Core || {};

  const Geometry = {
    /**
     * Calcula a distância euclidiana entre dois pontos (em metros ou pixels)
     */
    distance(p1, p2) {
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      return Math.sqrt(dx * dx + dy * dy);
    },

    /**
     * Converte graus para radianos
     */
    degToRad(deg) {
      return (deg * Math.PI) / 180;
    },

    /**
     * Converte radianos para graus
     */
    radToDeg(rad) {
      return (rad * 180) / Math.PI;
    },

    /**
     * Testa e calcula a interseção entre dois segmentos de reta:
     * Segmento 1: de P1(x1, y1) a P2(x2, y2)
     * Segmento 2: de P3(x3, y3) a P4(x4, y4)
     *
     * Conforme TRD Seção 5.2:
     * D = (P2x - P1x)(P4y - P3y) - (P2y - P1y)(P4x - P3x)
     */
    intersectSegments(p1, p2, p3, p4) {
      const dx1 = p2.x - p1.x;
      const dy1 = p2.y - p1.y;
      const dx2 = p4.x - p3.x;
      const dy2 = p4.y - p3.y;

      const D = dx1 * dy2 - dy1 * dx2;

      // Retas paralelas ou coincidentes
      if (Math.abs(D) < 1e-8) {
        return { hit: false, point: null, t: 0, u: 0 };
      }

      const t = ((p3.x - p1.x) * dy2 - (p3.y - p1.y) * dx2) / D;
      const u = ((p3.x - p1.x) * dy1 - (p3.y - p1.y) * dx1) / D;

      if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        return {
          hit: true,
          point: {
            x: p1.x + t * dx1,
            y: p1.y + t * dy1
          },
          t,
          u
        };
      }

      return { hit: false, point: null, t, u };
    },

    /**
     * Verifica se um raio emitido de uma fonte (origem) em direção a um ponto de teste
     * intercepta o segmento de uma parede.
     */
    rayIntersectsWall(origin, target, wall) {
      if (!wall || !wall.p1 || !wall.p2) return false;
      return this.intersectSegments(origin, target, wall.p1, wall.p2).hit;
    },

    /**
     * Verifica se um ponto está contido em uma caixa delimitadora (AABB)
     */
    pointInBox(point, box) {
      return (
        point.x >= box.x &&
        point.x <= box.x + box.width &&
        point.y >= box.y &&
        point.y <= box.y + box.height
      );
    },

    /**
     * Projeta um ponto sobre um segmento de reta e retorna a distância mínima
     */
    distanceToSegment(point, p1, p2) {
      const l2 = (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2;
      if (l2 === 0) return this.distance(point, p1);

      let t = ((point.x - p1.x) * (p2.x - p1.x) + (point.y - p1.y) * (p2.y - p1.y)) / l2;
      t = Math.max(0, Math.min(1, t));

      const projection = {
        x: p1.x + t * (p2.x - p1.x),
        y: p1.y + t * (p2.y - p1.y)
      };

      return this.distance(point, projection);
    },

    /**
     * Calcula os 4 vértices (cantos) de uma caixa orientada (OBB) no espaço 2D
     */
    getBoxCorners(center, size, rotationDeg = 0) {
      const hw = (size.width_m || 0.5) / 2;
      const hh = (size.height_m || 0.5) / 2;
      const rad = this.degToRad(rotationDeg);
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      const localOffsets = [
        { x: -hw, y: -hh },
        { x: hw, y: -hh },
        { x: hw, y: hh },
        { x: -hw, y: hh }
      ];

      return localOffsets.map((offset) => ({
        x: center.x + offset.x * cos - offset.y * sin,
        y: center.y + offset.x * sin + offset.y * cos
      }));
    },

    /**
     * Testa se um ponto está dentro de uma caixa retangular orientada
     */
    pointInOrientedBox(point, center, size, rotationDeg = 0) {
      const hw = (size.width_m || 0.5) / 2;
      const hh = (size.height_m || 0.5) / 2;
      const rad = this.degToRad(rotationDeg);
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      const dx = point.x - center.x;
      const dy = point.y - center.y;

      const localX = dx * cos + dy * sin;
      const localY = -dx * sin + dy * cos;

      return Math.abs(localX) <= hw && Math.abs(localY) <= hh;
    },

    /**
     * Testa se um segmento de reta (raio RF) cruza uma caixa retangular orientada (OBB)
     */
    rayIntersectsOrientedBox(origin, target, center, size, rotationDeg = 0) {
      if (!origin || !target || !center || !size) return false;

      // 1. Se a origem ou o destino estiver dentro da caixa, há interseção
      if (this.pointInOrientedBox(origin, center, size, rotationDeg) ||
          this.pointInOrientedBox(target, center, size, rotationDeg)) {
        return true;
      }

      // 2. Testa contra as 4 arestas da caixa
      const corners = this.getBoxCorners(center, size, rotationDeg);
      for (let i = 0; i < 4; i++) {
        const next = (i + 1) % 4;
        if (this.intersectSegments(origin, target, corners[i], corners[next]).hit) {
          return true;
        }
      }

      return false;
    },

    /**
     * Aplica ponto de parada (snap) em ângulos múltiplos de 90 graus (0°, 90°, 180°, 270°).
     * Mantém rotação livre caso o ângulo esteja fora da faixa de tolerância.
     */
    snapAngle90(deg, toleranceDeg = 6) {
      const normalized = ((deg % 360) + 360) % 360;
      const snaps = [0, 90, 180, 270, 360];
      for (const snap of snaps) {
        if (Math.abs(normalized - snap) <= toleranceDeg) {
          return snap % 360;
        }
      }
      return Math.round(normalized);
    },

    /**
     * Aplica snap ortogonal suave (horizontal ou vertical, múltiplos de 90°)
     * ao movimentar vértices de parede em relação à âncora fixa.
     * Fora da tolerância, permite paredes inclinadas em qualquer ângulo livre.
     */
    snapPointOrthogonal(anchor, target, toleranceDeg = 5) {
      const dx = target.x - anchor.x;
      const dy = target.y - anchor.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 0.2) {
        return { x: target.x, y: target.y, isSnapped: false, axis: null };
      }

      const angleDeg = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;

      // 0° (direita) ou 180° (esquerda) -> Parede perfeitamente horizontal
      if (
        Math.abs(angleDeg - 0) <= toleranceDeg ||
        Math.abs(angleDeg - 360) <= toleranceDeg ||
        Math.abs(angleDeg - 180) <= toleranceDeg
      ) {
        return { x: target.x, y: anchor.y, isSnapped: true, axis: 'horizontal' };
      }

      // 90° (baixo) ou 270° (cima) -> Parede perfeitamente vertical
      if (
        Math.abs(angleDeg - 90) <= toleranceDeg ||
        Math.abs(angleDeg - 270) <= toleranceDeg
      ) {
        return { x: anchor.x, y: target.y, isSnapped: true, axis: 'vertical' };
      }

      return { x: target.x, y: target.y, isSnapped: false, axis: null };
    },

    /**
     * Aplica snap magnético de objetos (dispositivos, móveis, obstáculos) contra paredes próximas.
     * Encosta suavemente a borda do objeto na face da parede quando dentro do limiar de atração (thresholdM),
     * permitindo que o objeto se descole facilmente com uma leve puxada do mouse além do limiar.
     */
    snapDeviceToWalls(targetPos, size, rotationDeg = 0, walls = [], thresholdM = 0.20) {
      if (!walls || walls.length === 0) {
        return { x: targetPos.x, y: targetPos.y, isSnapped: false, wallId: null };
      }

      const hw = (size.width_m || 0.5) / 2;
      const hh = (size.height_m || 0.5) / 2;
      const rad = this.degToRad(rotationDeg || 0);
      const cosR = Math.cos(rad);
      const sinR = Math.sin(rad);

      let bestCandidate = null;
      let minGapAbs = Infinity;

      for (const wall of walls) {
        if (!wall.p1 || !wall.p2) continue;

        const wdx = wall.p2.x - wall.p1.x;
        const wdy = wall.p2.y - wall.p1.y;
        const wallLenSq = wdx * wdx + wdy * wdy;
        if (wallLenSq < 1e-4) continue;
        const wallLen = Math.sqrt(wallLenSq);

        // Projeção paramétrica t do centro do objeto sobre o segmento da parede
        const t = ((targetPos.x - wall.p1.x) * wdx + (targetPos.y - wall.p1.y) * wdy) / wallLenSq;

        // Limita o contato ao comprimento físico da parede com pequena tolerância nas pontas
        if (t < -0.05 || t > 1.05) continue;
        const tClamped = Math.max(0, Math.min(1, t));

        // Ponto projetado no eixo central da parede
        const projX = wall.p1.x + tClamped * wdx;
        const projY = wall.p1.y + tClamped * wdy;

        // Vetor do ponto projetado até a posição pretendida do objeto
        let vx = targetPos.x - projX;
        let vy = targetPos.y - projY;
        let distCenter = Math.hypot(vx, vy);

        let vux = 0;
        let vuy = 0;
        if (distCenter > 1e-4) {
          vux = vx / distCenter;
          vuy = vy / distCenter;
        } else {
          // Se o centro coincidir com o eixo central da parede, usa a normal
          vux = -wdy / wallLen;
          vuy = wdx / wallLen;
        }

        // Projeção da caixa orientada (OBB) do objeto na direção normal da parede
        const localX = cosR * vux + sinR * vuy;
        const localY = -sinR * vux + cosR * vuy;
        const halfExtent = hw * Math.abs(localX) + hh * Math.abs(localY);

        const wallHalfThickness = (wall.thickness_m || 0.15) / 2;
        const contactDist = wallHalfThickness + halfExtent;

        // Folga entre a borda do objeto e a face da parede
        const gap = distCenter - contactDist;

        // Permite atração magnética quando o objeto se aproxima (gap <= thresholdM)
        // ou se penetrar ligeiramente (gap >= -0.10)
        if (gap >= -0.10 && gap <= thresholdM) {
          const gapAbs = Math.abs(gap);
          if (gapAbs < minGapAbs) {
            minGapAbs = gapAbs;
            bestCandidate = {
              x: projX + vux * contactDist,
              y: projY + vuy * contactDist,
              isSnapped: true,
              wallId: wall.id,
              wall: wall,
              proj: { x: projX, y: projY },
              normal: { x: vux, y: vuy }
            };
          }
        }
      }

      if (bestCandidate) {
        return bestCandidate;
      }

      return { x: targetPos.x, y: targetPos.y, isSnapped: false, wallId: null };
    },

    /**
     * Projeta um ponto sobre o segmento de uma parede, restringindo a posição dentro
     * das margens mínimas das pontas (marginM) e calculando o ângulo de rotação exato.
     */
    projectPointToWall(point, wall, marginM = 0.45) {
      if (!wall || !wall.p1 || !wall.p2) return null;
      const dx = wall.p2.x - wall.p1.x;
      const dy = wall.p2.y - wall.p1.y;
      const lenSq = dx * dx + dy * dy;
      if (lenSq < 1e-6) {
        return {
          point: { x: wall.p1.x, y: wall.p1.y },
          distance: this.distance(point, wall.p1),
          angleDeg: 0,
          t: 0,
          wallLen: 0
        };
      }

      const len = Math.sqrt(lenSq);
      const rawT = ((point.x - wall.p1.x) * dx + (point.y - wall.p1.y) * dy) / lenSq;
      const marginT = len > marginM * 2 ? marginM / len : 0;
      const t = Math.max(marginT, Math.min(1 - marginT, rawT));

      const projX = wall.p1.x + t * dx;
      const projY = wall.p1.y + t * dy;
      const dist = Math.hypot(point.x - projX, point.y - projY);

      let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
      if (angleDeg < 0) angleDeg += 360;

      return {
        point: { x: Number(projX.toFixed(2)), y: Number(projY.toFixed(2)) },
        distance: dist,
        angleDeg: Math.round(angleDeg),
        t,
        wallLen: len
      };
    },

    /**
     * Encontra a parede mais próxima de um ponto fornecido e projeta a posição e ângulo
     * sobre ela com respeito à margem das extremidades.
     */
    findClosestWall(point, walls = [], marginM = 0.45) {
      if (!walls || walls.length === 0) return null;
      let best = null;
      let minDistance = Infinity;

      for (const wall of walls) {
        const proj = this.projectPointToWall(point, wall, marginM);
        if (proj && proj.distance < minDistance) {
          minDistance = proj.distance;
          best = {
            wall,
            ...proj
          };
        }
      }

      return best;
    },

    /**
     * Determina se a alça de rotação de um dispositivo deve ser reposicionada para o lado oposto (pra cima)
     * para evitar que a bolinha de rotação fique atrás da etiqueta com o nome do objeto (master badge).
     *
     * @param {Object} dev Dispositivo com size, position e rotation_deg
     * @param {number} canvasHeight Altura do canvas em pixels (opcional, padrão 800)
     * @param {number} ppm Pixels por metro (opcional, padrão 60)
     * @returns {boolean} true se a alça deve ser invertida para o lado oposto
     */
    isRotationHandleFlipped(dev, canvasHeight = 800, ppm = 60) {
      if (!dev || dev.type === 'door' || dev.type === 'window') return false;

      const rot = ((dev.rotation_deg || 0) % 360 + 360) % 360;
      const rad = (rot * Math.PI) / 180;
      const cos = Math.cos(rad);

      // Calcula a altura da caixa delimitadora orientada (AABB)
      const w = (dev.size?.width_m || 0.5) * ppm;
      const h = (dev.size?.height_m || 0.5) * ppm;
      const sinAbs = Math.abs(Math.sin(rad));
      const cosAbs = Math.abs(Math.cos(rad));
      const aabbHalfH = (w * sinAbs + h * cosAbs) / 2;

      // Posição vertical do centro e do badge no espaço da tela
      const cy = (dev.position?.y || 0) * ppm;
      const bgH = 22;
      const badgeY = Math.round(cy + aabbHalfH + 16);

      // Verifica se o badge está posicionado abaixo ou acima do objeto
      // (inverte para cima apenas se encostar na borda inferior do canvas)
      const isBadgeBelow = !canvasHeight || (badgeY + bgH / 2 <= canvasHeight - 8);

      if (isBadgeBelow) {
        // Quando a etiqueta está abaixo do objeto:
        // A alça padrão apontaria para baixo quando cos < 0 (isto é, ângulos entre 90° e 270°).
        // Nesses casos, reposiciona para o lado oposto (pra cima na tela).
        return cos < -0.01;
      } else {
        // Caso raro: etiqueta precisou ir para cima (perto da borda inferior da tela)
        // A alça padrão apontaria para cima quando cos > 0. Nesses casos, inverte para baixo.
        return cos > 0.01;
      }
    },

    /**
     * Calcula as coordenadas globais (em metros) da alça de rotação de um dispositivo,
     * levando em conta a inversão automática quando a alça ficaria atrás da etiqueta.
     *
     * @param {Object} dev
     * @param {number} ppm
     * @param {number} canvasHeight
     * @returns {{ x: number, y: number, isFlipped: boolean }}
     */
    getRotationHandlePositionM(dev, ppm = 60, canvasHeight = 800) {
      if (!dev) return { x: 0, y: 0, isFlipped: false };
      const isFlipped = this.isRotationHandleFlipped(dev, canvasHeight, ppm);
      const rad = ((dev.rotation_deg || 0) * Math.PI) / 180;
      const handleOffsetM = (dev.size?.height_m || 0.5) / 2 + 24 / ppm;

      return {
        x: isFlipped ? dev.position.x - handleOffsetM * Math.sin(rad) : dev.position.x + handleOffsetM * Math.sin(rad),
        y: isFlipped ? dev.position.y + handleOffsetM * Math.cos(rad) : dev.position.y - handleOffsetM * Math.cos(rad),
        isFlipped
      };
    }
  };

  window.WifiSim.Core.Geometry = Geometry;
})();
