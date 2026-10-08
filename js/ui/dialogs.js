/**
 * Simulador Wi-Fi - Diálogos, Modais e Mensagens Visuais
 * Camada: UI (WifiSim.UI.Dialogs)
 * Zero dependências externas - ECMAScript 2020+
 */

(function () {
  'use strict';

  window.WifiSim = window.WifiSim || {};
  window.WifiSim.UI = window.WifiSim.UI || {};

  const Dialogs = {
    /**
     * Exibe o modal de seleção de templates residenciais
     */
    showTemplatesModal() {
      const modal = document.getElementById('modal-templates');
      if (modal) {
        modal.classList.add('active');
      }
    },

    /**
     * Fecha qualquer modal aberto
     */
    closeModals() {
      const activeModals = document.querySelectorAll('.modal-overlay.active');
      activeModals.forEach((m) => m.classList.remove('active'));
    },

    /**
     * Exibe o modal de diagnóstico do sistema
     */
    showDiagnosticsModal() {
      const modal = document.getElementById('modal-diagnostics');
      if (modal) {
        modal.classList.add('active');
      }
    },

    /**
     * Exporta o cenário ativo como um arquivo JSON baixável
     */
    exportSceneJSON() {
      const state = window.WifiSim.State;
      if (!state || !state.scene) return;

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state.scene, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `simulador-wifi-${state.scene.name || 'cenario'}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }
  };

  window.WifiSim.UI.Dialogs = Dialogs;
})();
