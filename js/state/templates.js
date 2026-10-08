/**
 * Simulador Wi-Fi - Modelos Prontos de Ambientes Residenciais (Templates)
 * Camada: State (WifiSim.Templates)
 * Zero dependências externas - ECMAScript 2020+
 *
 * Plantas baixas realistas com proporções arquiteturais harmoniosas,
 * inclusão de portas e janelas ancoradas nas paredes, rica variedade de dispositivos,
 * mobiliário e fontes de interferência RF, 100% livres de sobreposição.
 */

(function () {
  'use strict';

  window.WifiSim = window.WifiSim || {};

  const Templates = {
    /**
     * 0. Projeto em Branco (Espaço Limpo - 8.0m x 6.0m)
     * Sem paredes, sem objetos e sem equipamentos para criação totalmente do zero.
     */
    blank: {
      id: 'template-blank',
      name: 'Projeto em Branco',
      description: 'Espaço vazio sem paredes, objetos ou equipamentos. Ideal para desenhar e planejar sua própria planta livre totalmente do zero.',
      dimensions: { width_m: 8.0, height_m: 6.0, pixels_per_meter: 70 },
      grid: { step_m: 0.25, show_grid: true },
      walls: [],
      devices: [],
      furniture: []
    },

    /**
     * 1. Studio Compacto (45 m² - 7.5m x 6.0m)
     * Planta aberta integrada com dormitório, sala de estar, cozinha americana,
     * banheiro privativo e varanda ventilada.
     */
    studio45: {
      id: 'template-studio-45',
      name: 'Apartamento Studio (45 m²)',
      description: 'Planta integrada com estrutura principal em concreto armado e divisórias em drywall. Demonstra atenuação acentuada de sinal.',
      dimensions: { width_m: 7.5, height_m: 6.0, pixels_per_meter: 70 },
      grid: { step_m: 0.25, show_grid: true },
      walls: [
        // Perímetro externo em concreto armado (estrutura principal - espessura 0.25m)
        { id: 'w-ext-top', p1: { x: 0.5, y: 0.5 }, p2: { x: 7.0, y: 0.5 }, material: 'concreto', thickness_m: 0.25 },
        { id: 'w-ext-right', p1: { x: 7.0, y: 0.5 }, p2: { x: 7.0, y: 5.5 }, material: 'concreto', thickness_m: 0.25 },
        { id: 'w-ext-bottom', p1: { x: 7.0, y: 5.5 }, p2: { x: 0.5, y: 5.5 }, material: 'concreto', thickness_m: 0.25 },
        { id: 'w-ext-left', p1: { x: 0.5, y: 5.5 }, p2: { x: 0.5, y: 0.5 }, material: 'concreto', thickness_m: 0.25 },

        // Parede mestra do shaft hidráulico do banheiro (concreto armado)
        { id: 'w-bath-v', p1: { x: 4.8, y: 0.5 }, p2: { x: 4.8, y: 2.6 }, material: 'concreto', thickness_m: 0.2 },
        // Parede secundária do banheiro (drywall)
        { id: 'w-bath-h', p1: { x: 4.8, y: 2.6 }, p2: { x: 7.0, y: 2.6 }, material: 'drywall', thickness_m: 0.1 },

        // Divisória secundária de privacidade do dormitório (drywall)
        { id: 'w-div-bedroom', p1: { x: 0.5, y: 3.2 }, p2: { x: 3.6, y: 3.2 }, material: 'drywall', thickness_m: 0.1 }
      ],
      devices: [
        // Portas e Janelas Arquiteturais Integradas
        {
          id: 'door-entry',
          name: 'Porta de Entrada',
          category: 'aperture',
          type: 'door',
          wall_id: 'w-ext-left',
          position: { x: 0.5, y: 1.5 },
          size: { width_m: 0.85, height_m: 0.25 },
          rotation_deg: 90,
          attenuation_db: { db24: 3.5, db5: 6.0 },
          swing_direction: 'inward',
          flip_swing: false
        },
        {
          id: 'door-bath',
          name: 'Porta do Banheiro',
          category: 'aperture',
          type: 'door',
          wall_id: 'w-bath-h',
          position: { x: 5.7, y: 2.6 },
          size: { width_m: 0.75, height_m: 0.1 },
          rotation_deg: 0,
          attenuation_db: { db24: 3.5, db5: 6.0 },
          swing_direction: 'inward',
          flip_swing: false
        },
        {
          id: 'win-kitchen',
          name: 'Janela da Cozinha',
          category: 'aperture',
          type: 'window',
          wall_id: 'w-ext-top',
          position: { x: 2.5, y: 0.5 },
          size: { width_m: 1.2, height_m: 0.25 },
          rotation_deg: 0,
          attenuation_db: { db24: 2.0, db5: 4.0 }
        },
        {
          id: 'win-bedroom',
          name: 'Janela do Dormitório',
          category: 'aperture',
          type: 'window',
          wall_id: 'w-ext-bottom',
          position: { x: 2.2, y: 5.5 },
          size: { width_m: 1.4, height_m: 0.25 },
          rotation_deg: 0,
          attenuation_db: { db24: 2.0, db5: 4.0 }
        },
        {
          id: 'win-bath',
          name: 'Janela do Banheiro',
          category: 'aperture',
          type: 'window',
          wall_id: 'w-ext-right',
          position: { x: 7.0, y: 1.3 },
          size: { width_m: 0.6, height_m: 0.25 },
          rotation_deg: 90,
          attenuation_db: { db24: 2.0, db5: 4.0 }
        },

        // Equipamento Transmissor Wi-Fi Central
        {
          id: 'dev-router-main',
          name: 'Roteador Wi-Fi (Sala)',
          category: 'transmitter',
          type: 'router_gateway',
          position: { x: 3.6, y: 1.2 },
          size: { width_m: 0.35, height_m: 0.3 },
          rotation_deg: 0,
          rf_config: { is_active: true, tx_power_dbm: 20.0, frequency_ghz: 5.0, channel: 36, antenna_gain_dbi: 3.0 }
        },

        // Sala de Estar e Jantar
        {
          id: 'dev-sofa-studio',
          name: 'Sofá 2 Lugares',
          category: 'furniture',
          type: 'sofa',
          position: { x: 2.0, y: 1.6 },
          size: { width_m: 1.5, height_m: 0.7 },
          rotation_deg: 0,
          attenuation_db: { db24: 3.0, db5: 4.5 }
        },
        {
          id: 'dev-tv-living',
          name: 'Smart TV 43"',
          category: 'receiver',
          type: 'tv',
          position: { x: 2.0, y: 3.05 },
          size: { width_m: 0.9, height_m: 0.15 },
          rotation_deg: 0,
          receiver_metrics: { current_rssi_dbm: -46, quality_level: 'excellent' }
        },
        {
          id: 'dev-table-studio',
          name: 'Mesa de Refeição',
          category: 'furniture',
          type: 'table',
          position: { x: 4.0, y: 2.0 },
          size: { width_m: 1.0, height_m: 0.7 },
          rotation_deg: 0,
          attenuation_db: { db24: 1.5, db5: 2.5 }
        },
        {
          id: 'dev-aquarium-studio',
          name: 'Aquário de Água Doce (80L)',
          category: 'obstacle',
          type: 'aquarium',
          position: { x: 2.8, y: 2.3 },
          size: { width_m: 0.8, height_m: 0.35 },
          rotation_deg: 0,
          attenuation_db: { db24: 16.0, db5: 22.0 }
        },
        {
          id: 'dev-phone-base-studio',
          name: 'Telefone Sem Fio 2.4 GHz',
          category: 'noise_source',
          type: 'cordless_phone',
          position: { x: 1.0, y: 1.5 },
          size: { width_m: 0.25, height_m: 0.2 },
          rotation_deg: 0,
          attenuation_db: { db24: 1.0, db5: 1.0 }
        },

        // Cozinha & Banheiro
        {
          id: 'dev-fridge-studio',
          name: 'Geladeira (Inox)',
          category: 'obstacle',
          type: 'fridge',
          position: { x: 6.4, y: 3.4 },
          size: { width_m: 0.7, height_m: 0.7 },
          rotation_deg: 0,
          attenuation_db: { db24: 25.0, db5: 32.0 }
        },
        {
          id: 'dev-micro-studio',
          name: 'Forno Micro-ondas',
          category: 'noise_source',
          type: 'microwave',
          position: { x: 6.4, y: 4.5 },
          size: { width_m: 0.5, height_m: 0.35 },
          rotation_deg: 0,
          attenuation_db: { db24: 20.0, db5: 28.0 },
          rf_config: { is_active: true, noise_level_dbm: -35.0, interference_radius_m: 3.5 }
        },
        {
          id: 'dev-mirror-bath',
          name: 'Espelho do Banheiro',
          category: 'obstacle',
          type: 'mirror_obj',
          position: { x: 5.9, y: 0.65 },
          size: { width_m: 0.8, height_m: 0.12 },
          rotation_deg: 0,
          attenuation_db: { db24: 14.0, db5: 20.0 }
        },
        {
          id: 'dev-mirror-div',
          name: 'Espelho de Parede (Blindagem Metálica)',
          category: 'obstacle',
          type: 'mirror_obj',
          position: { x: 1.8, y: 3.2 },
          size: { width_m: 1.2, height_m: 0.12 },
          rotation_deg: 0,
          attenuation_db: { db24: 14.0, db5: 20.0 }
        },

        // Dormitório
        {
          id: 'dev-bed-studio',
          name: 'Cama Casal',
          category: 'furniture',
          type: 'bed',
          position: { x: 1.8, y: 4.4 },
          size: { width_m: 1.4, height_m: 1.8 },
          rotation_deg: 0,
          attenuation_db: { db24: 2.5, db5: 3.5 }
        },
        {
          id: 'dev-wardrobe-studio',
          name: 'Guarda-Roupa',
          category: 'furniture',
          type: 'wardrobe',
          position: { x: 4.0, y: 4.5 },
          size: { width_m: 1.2, height_m: 0.5 },
          rotation_deg: 90,
          attenuation_db: { db24: 5.0, db5: 8.0 }
        },
        {
          id: 'dev-laptop-studio',
          name: 'Notebook (Trabalho)',
          category: 'receiver',
          type: 'laptop',
          position: { x: 3.0, y: 3.6 },
          size: { width_m: 0.35, height_m: 0.25 },
          rotation_deg: 0,
          receiver_metrics: { current_rssi_dbm: -54, quality_level: 'good' }
        },
        {
          id: 'dev-phone-studio',
          name: 'Smartphone',
          category: 'receiver',
          type: 'phone',
          position: { x: 0.8, y: 4.4 },
          size: { width_m: 0.2, height_m: 0.12 },
          rotation_deg: 90,
          receiver_metrics: { current_rssi_dbm: -58, quality_level: 'good' }
        }
      ],
      furniture: []
    },

    /**
     * 2. Apartamento Familiar (85 m² - 10.5m x 8.0m)
     * 3 dormitórios (1 suíte com banheiro), banheiro social, living integrado,
     * sala de jantar, cozinha americana com eletrodomésticos e corredor com espelho.
     */
    familiar85: {
      id: 'template-familiar-85',
      name: 'Apartamento Familiar (85 m²)',
      description: '3 dormitórios com suíte, estrutura principal e parede mestra em concreto armado e divisórias em drywall.',
      dimensions: { width_m: 10.5, height_m: 8.0, pixels_per_meter: 65 },
      grid: { step_m: 0.25, show_grid: true },
      walls: [
        // Perímetro externo em concreto armado (estrutura principal - espessura 0.25m)
        { id: 'w-ext-top', p1: { x: 0.5, y: 0.5 }, p2: { x: 10.0, y: 0.5 }, material: 'concreto', thickness_m: 0.25 },
        { id: 'w-ext-right', p1: { x: 10.0, y: 0.5 }, p2: { x: 10.0, y: 7.5 }, material: 'concreto', thickness_m: 0.25 },
        { id: 'w-ext-bottom', p1: { x: 10.0, y: 7.5 }, p2: { x: 0.5, y: 7.5 }, material: 'concreto', thickness_m: 0.25 },
        { id: 'w-ext-left', p1: { x: 0.5, y: 7.5 }, p2: { x: 0.5, y: 0.5 }, material: 'concreto', thickness_m: 0.25 },

        // Divisão Vertical do Corredor Mestra (Concreto armado estrutural)
        { id: 'w-hall-div', p1: { x: 5.2, y: 0.5 }, p2: { x: 5.2, y: 4.2 }, material: 'concreto', thickness_m: 0.2 },
        { id: 'w-corridor-bot', p1: { x: 5.2, y: 5.2 }, p2: { x: 5.2, y: 7.5 }, material: 'concreto', thickness_m: 0.2 },

        // Divisória secundária da Suíte Master (drywall)
        { id: 'w-suite-div', p1: { x: 5.2, y: 4.0 }, p2: { x: 10.0, y: 4.0 }, material: 'drywall', thickness_m: 0.1 },

        // Divisória secundária da Cozinha (drywall)
        { id: 'w-kitchen-div', p1: { x: 0.5, y: 4.8 }, p2: { x: 4.2, y: 4.8 }, material: 'drywall', thickness_m: 0.1 },

        // Banheiro Privativo da Suíte (drywall)
        { id: 'w-suite-bath-v', p1: { x: 7.8, y: 5.8 }, p2: { x: 7.8, y: 7.5 }, material: 'drywall', thickness_m: 0.1 },
        { id: 'w-suite-bath-h', p1: { x: 7.8, y: 5.8 }, p2: { x: 10.0, y: 5.8 }, material: 'drywall', thickness_m: 0.1 }
      ],
      devices: [
        // Portas e Janelas Arquiteturais Integradas
        {
          id: 'door-entry',
          name: 'Porta de Entrada',
          category: 'aperture',
          type: 'door',
          wall_id: 'w-ext-left',
          position: { x: 0.5, y: 1.5 },
          size: { width_m: 0.85, height_m: 0.25 },
          rotation_deg: 90,
          attenuation_db: { db24: 3.5, db5: 6.0 },
          swing_direction: 'inward',
          flip_swing: false
        },
        {
          id: 'door-suite',
          name: 'Porta da Suíte',
          category: 'aperture',
          type: 'door',
          wall_id: 'w-suite-div',
          position: { x: 6.0, y: 4.0 },
          size: { width_m: 0.8, height_m: 0.1 },
          rotation_deg: 0,
          attenuation_db: { db24: 3.5, db5: 6.0 },
          swing_direction: 'inward',
          flip_swing: false
        },
        {
          id: 'door-bed2',
          name: 'Porta do Quarto 2',
          category: 'aperture',
          type: 'door',
          wall_id: 'w-hall-div',
          position: { x: 5.2, y: 2.2 },
          size: { width_m: 0.8, height_m: 0.2 },
          rotation_deg: 90,
          attenuation_db: { db24: 3.5, db5: 6.0 },
          swing_direction: 'inward',
          flip_swing: false
        },
        {
          id: 'door-suite-bath',
          name: 'Porta Banheiro Suíte',
          category: 'aperture',
          type: 'door',
          wall_id: 'w-suite-bath-h',
          position: { x: 8.8, y: 5.8 },
          size: { width_m: 0.75, height_m: 0.1 },
          rotation_deg: 0,
          attenuation_db: { db24: 3.5, db5: 6.0 },
          swing_direction: 'inward',
          flip_swing: false
        },
        {
          id: 'win-living',
          name: 'Janela da Sala',
          category: 'aperture',
          type: 'window',
          wall_id: 'w-ext-top',
          position: { x: 2.5, y: 0.5 },
          size: { width_m: 1.4, height_m: 0.25 },
          rotation_deg: 0,
          attenuation_db: { db24: 2.0, db5: 4.0 }
        },
        {
          id: 'win-kitchen',
          name: 'Janela da Cozinha',
          category: 'aperture',
          type: 'window',
          wall_id: 'w-ext-left',
          position: { x: 0.5, y: 6.2 },
          size: { width_m: 1.0, height_m: 0.25 },
          rotation_deg: 90,
          attenuation_db: { db24: 2.0, db5: 4.0 }
        },
        {
          id: 'win-bed2',
          name: 'Janela do Quarto 2',
          category: 'aperture',
          type: 'window',
          wall_id: 'w-ext-top',
          position: { x: 8.0, y: 0.5 },
          size: { width_m: 1.2, height_m: 0.25 },
          rotation_deg: 0,
          attenuation_db: { db24: 2.0, db5: 4.0 }
        },
        {
          id: 'win-suite',
          name: 'Janela da Suíte',
          category: 'aperture',
          type: 'window',
          wall_id: 'w-ext-bottom',
          position: { x: 6.8, y: 7.5 },
          size: { width_m: 1.3, height_m: 0.25 },
          rotation_deg: 0,
          attenuation_db: { db24: 2.0, db5: 4.0 }
        },

        // Equipamento Transmissor Wi-Fi Principal
        {
          id: 'dev-router-main',
          name: 'Roteador Wi-Fi (Sala)',
          category: 'transmitter',
          type: 'router_gateway',
          position: { x: 4.5, y: 1.2 },
          size: { width_m: 0.35, height_m: 0.3 },
          rotation_deg: 0,
          rf_config: { is_active: true, tx_power_dbm: 20.0, frequency_ghz: 5.0, channel: 36, antenna_gain_dbi: 3.0 }
        },

        // Sala de Estar e Jantar
        {
          id: 'dev-sofa-fam',
          name: 'Sofá Sala Estar',
          category: 'furniture',
          type: 'sofa',
          position: { x: 2.2, y: 2.0 },
          size: { width_m: 1.8, height_m: 0.75 },
          rotation_deg: 0,
          attenuation_db: { db24: 3.0, db5: 4.5 }
        },
        {
          id: 'dev-tv-living',
          name: 'Smart TV 55"',
          category: 'receiver',
          type: 'tv',
          position: { x: 2.2, y: 0.65 },
          size: { width_m: 1.1, height_m: 0.15 },
          rotation_deg: 0,
          receiver_metrics: { current_rssi_dbm: -47, quality_level: 'excellent' }
        },
        {
          id: 'dev-console-fam',
          name: 'Console Videogame',
          category: 'receiver',
          type: 'videogame',
          position: { x: 3.2, y: 0.65 },
          size: { width_m: 0.3, height_m: 0.25 },
          rotation_deg: 0,
          receiver_metrics: { current_rssi_dbm: -49, quality_level: 'excellent' }
        },
        {
          id: 'dev-table-fam',
          name: 'Mesa de Jantar (6 Lugares)',
          category: 'furniture',
          type: 'table',
          position: { x: 2.5, y: 3.8 },
          size: { width_m: 1.3, height_m: 0.8 },
          rotation_deg: 0,
          attenuation_db: { db24: 1.5, db5: 2.5 }
        },
        {
          id: 'dev-phone-fam',
          name: 'Telefone Sem Fio 2.4 GHz',
          category: 'noise_source',
          type: 'cordless_phone',
          position: { x: 4.5, y: 3.5 },
          size: { width_m: 0.25, height_m: 0.2 },
          rotation_deg: 0,
          attenuation_db: { db24: 1.0, db5: 1.0 }
        },
        {
          id: 'dev-mirror-living-fam',
          name: 'Espelho Grande da Sala de Jantar',
          category: 'obstacle',
          type: 'mirror_obj',
          position: { x: 0.62, y: 3.8 },
          size: { width_m: 1.2, height_m: 0.12 },
          rotation_deg: 90,
          attenuation_db: { db24: 14.0, db5: 20.0 }
        },

        // Cozinha
        {
          id: 'dev-fridge-fam',
          name: 'Geladeira Duplex (Inox)',
          category: 'obstacle',
          type: 'fridge',
          position: { x: 1.2, y: 5.5 },
          size: { width_m: 0.75, height_m: 0.75 },
          rotation_deg: 0,
          attenuation_db: { db24: 25.0, db5: 32.0 }
        },
        {
          id: 'dev-micro-fam',
          name: 'Forno Micro-ondas',
          category: 'noise_source',
          type: 'microwave',
          position: { x: 2.3, y: 5.3 },
          size: { width_m: 0.5, height_m: 0.35 },
          rotation_deg: 0,
          attenuation_db: { db24: 20.0, db5: 28.0 },
          rf_config: { is_active: true, noise_level_dbm: -35.0, interference_radius_m: 3.5 }
        },
        {
          id: 'dev-cooler-fam',
          name: 'Adega Climatizada (Aço Inox)',
          category: 'obstacle',
          type: 'fridge',
          position: { x: 3.6, y: 5.3 },
          size: { width_m: 0.6, height_m: 0.6 },
          rotation_deg: 0,
          attenuation_db: { db24: 20.0, db5: 28.0 }
        },
        {
          id: 'dev-aquarium-fam',
          name: 'Aquário de Água Salgada (120L - Corredor)',
          category: 'obstacle',
          type: 'aquarium',
          position: { x: 5.2, y: 4.7 },
          size: { width_m: 0.9, height_m: 0.45 },
          rotation_deg: 0,
          attenuation_db: { db24: 16.0, db5: 22.0 }
        },

        // Corredor com Espelho
        {
          id: 'dev-mirror-hall',
          name: 'Espelho de Corredor',
          category: 'obstacle',
          type: 'mirror_obj',
          position: { x: 5.35, y: 1.3 },
          size: { width_m: 0.9, height_m: 0.12 },
          rotation_deg: 90,
          attenuation_db: { db24: 14.0, db5: 20.0 }
        },

        // Quarto 2 (Home Office / Dormitório)
        {
          id: 'dev-bed-room2',
          name: 'Cama Solteiro (Quarto 2)',
          category: 'furniture',
          type: 'bed',
          position: { x: 8.8, y: 2.0 },
          size: { width_m: 1.1, height_m: 1.9 },
          rotation_deg: 0,
          attenuation_db: { db24: 2.5, db5: 3.5 }
        },
        {
          id: 'dev-pc-room2',
          name: 'PC Desktop (Home Office)',
          category: 'receiver',
          type: 'pc',
          position: { x: 6.5, y: 1.2 },
          size: { width_m: 0.65, height_m: 0.45 },
          rotation_deg: 0,
          receiver_metrics: { current_rssi_dbm: -62, quality_level: 'good' }
        },
        {
          id: 'dev-wardrobe-room2',
          name: 'Armário Quarto 2',
          category: 'furniture',
          type: 'wardrobe',
          position: { x: 6.2, y: 3.2 },
          size: { width_m: 1.2, height_m: 0.5 },
          rotation_deg: 0,
          attenuation_db: { db24: 5.0, db5: 8.0 }
        },

        // Suíte Master
        {
          id: 'dev-bed-suite',
          name: 'Cama Queen (Suíte)',
          category: 'furniture',
          type: 'bed',
          position: { x: 6.6, y: 5.8 },
          size: { width_m: 1.5, height_m: 1.9 },
          rotation_deg: 0,
          attenuation_db: { db24: 2.5, db5: 3.5 }
        },
        {
          id: 'dev-wardrobe-suite',
          name: 'Guarda-Roupa Suíte',
          category: 'furniture',
          type: 'wardrobe',
          position: { x: 6.6, y: 4.35 },
          size: { width_m: 1.4, height_m: 0.5 },
          rotation_deg: 0,
          attenuation_db: { db24: 5.0, db5: 8.0 }
        },
        {
          id: 'dev-laptop-suite',
          name: 'Notebook (Suíte)',
          category: 'receiver',
          type: 'laptop',
          position: { x: 5.6, y: 6.5 },
          size: { width_m: 0.35, height_m: 0.25 },
          rotation_deg: 0,
          receiver_metrics: { current_rssi_dbm: -74, quality_level: 'unstable' }
        },
        {
          id: 'dev-tv-suite',
          name: 'Smart TV Suíte',
          category: 'receiver',
          type: 'tv',
          position: { x: 7.65, y: 4.9 },
          size: { width_m: 0.8, height_m: 0.15 },
          rotation_deg: 90,
          receiver_metrics: { current_rssi_dbm: -69, quality_level: 'good' }
        },
        {
          id: 'dev-mirror-suite',
          name: 'Espelho Banheiro Suíte',
          category: 'obstacle',
          type: 'mirror_obj',
          position: { x: 9.1, y: 5.95 },
          size: { width_m: 0.7, height_m: 0.12 },
          rotation_deg: 0,
          attenuation_db: { db24: 14.0, db5: 20.0 }
        }
      ],
      furniture: []
    },

    /**
     * 3. Casa Térrea com Varanda (130 m² - 13.0m x 10.0m)
     * Ampla residência com 3 quartos, sala de estar, cozinha gourmet, varanda,
     * múltiplos banheiros e rede Wi-Fi Mesh com Nó Repetidor dedicado.
     */
    casa130: {
      id: 'template-casa-130',
      name: 'Casa Térrea com Varanda (130 m²)',
      description: 'Planta ampla com perímetro e paredes mestras em concreto armado e divisórias em drywall. Perfeita para rede Mesh.',
      dimensions: { width_m: 13.0, height_m: 10.0, pixels_per_meter: 55 },
      grid: { step_m: 0.25, show_grid: true },
      walls: [
        // Perímetro externo em concreto reforçado (estrutura principal - espessura 0.25m)
        { id: 'w-ext-top', p1: { x: 0.5, y: 0.5 }, p2: { x: 12.5, y: 0.5 }, material: 'concreto', thickness_m: 0.25 },
        { id: 'w-ext-right', p1: { x: 12.5, y: 0.5 }, p2: { x: 12.5, y: 9.5 }, material: 'concreto', thickness_m: 0.25 },
        { id: 'w-ext-bottom', p1: { x: 12.5, y: 9.5 }, p2: { x: 0.5, y: 9.5 }, material: 'concreto', thickness_m: 0.25 },
        { id: 'w-ext-left', p1: { x: 0.5, y: 9.5 }, p2: { x: 0.5, y: 0.5 }, material: 'concreto', thickness_m: 0.25 },

        // Divisão Vertical Central Mestra (estrutura principal em concreto armado)
        { id: 'w-mid-v1', p1: { x: 6.5, y: 0.5 }, p2: { x: 6.5, y: 4.8 }, material: 'concreto', thickness_m: 0.2 },
        { id: 'w-mid-v2', p1: { x: 6.5, y: 6.0 }, p2: { x: 6.5, y: 9.5 }, material: 'concreto', thickness_m: 0.2 },

        // Divisão Cozinha Gourmet vs Sala de Estar (drywall)
        { id: 'w-kitchen-h', p1: { x: 0.5, y: 5.5 }, p2: { x: 5.2, y: 5.5 }, material: 'drywall', thickness_m: 0.1 },

        // Divisórias dos Quartos - Área Íntima (drywall)
        { id: 'w-bed-div-h', p1: { x: 6.5, y: 4.5 }, p2: { x: 12.5, y: 4.5 }, material: 'drywall', thickness_m: 0.1 },
        { id: 'w-bed-div-v', p1: { x: 9.5, y: 0.5 }, p2: { x: 9.5, y: 4.5 }, material: 'drywall', thickness_m: 0.1 },

        // Banheiro Privativo da Suíte (drywall)
        { id: 'w-suite-bath-h', p1: { x: 9.5, y: 7.5 }, p2: { x: 12.5, y: 7.5 }, material: 'drywall', thickness_m: 0.1 }
      ],
      devices: [
        // Portas e Janelas Arquiteturais Integradas
        {
          id: 'door-entry',
          name: 'Porta de Entrada Social',
          category: 'aperture',
          type: 'door',
          wall_id: 'w-ext-left',
          position: { x: 0.5, y: 2.0 },
          size: { width_m: 0.9, height_m: 0.25 },
          rotation_deg: 90,
          attenuation_db: { db24: 3.5, db5: 6.0 },
          swing_direction: 'inward',
          flip_swing: false
        },
        {
          id: 'door-veranda',
          name: 'Porta da Varanda',
          category: 'aperture',
          type: 'door',
          wall_id: 'w-ext-bottom',
          position: { x: 3.0, y: 9.5 },
          size: { width_m: 0.9, height_m: 0.25 },
          rotation_deg: 0,
          attenuation_db: { db24: 3.5, db5: 6.0 },
          swing_direction: 'inward',
          flip_swing: false
        },
        {
          id: 'door-bed1',
          name: 'Porta do Quarto 1',
          category: 'aperture',
          type: 'door',
          wall_id: 'w-mid-v1',
          position: { x: 6.5, y: 2.2 },
          size: { width_m: 0.8, height_m: 0.2 },
          rotation_deg: 90,
          attenuation_db: { db24: 3.5, db5: 6.0 },
          swing_direction: 'inward',
          flip_swing: false
        },
        {
          id: 'door-bed2',
          name: 'Porta do Quarto 2',
          category: 'aperture',
          type: 'door',
          wall_id: 'w-bed-div-v',
          position: { x: 9.5, y: 2.2 },
          size: { width_m: 0.8, height_m: 0.1 },
          rotation_deg: 90,
          attenuation_db: { db24: 3.5, db5: 6.0 },
          swing_direction: 'inward',
          flip_swing: false
        },
        {
          id: 'door-suite',
          name: 'Porta da Suíte Master',
          category: 'aperture',
          type: 'door',
          wall_id: 'w-mid-v2',
          position: { x: 6.5, y: 7.0 },
          size: { width_m: 0.85, height_m: 0.2 },
          rotation_deg: 90,
          attenuation_db: { db24: 3.5, db5: 6.0 },
          swing_direction: 'inward',
          flip_swing: false
        },
        {
          id: 'door-suite-bath',
          name: 'Porta Banheiro Suíte',
          category: 'aperture',
          type: 'door',
          wall_id: 'w-suite-bath-h',
          position: { x: 10.8, y: 7.5 },
          size: { width_m: 0.75, height_m: 0.1 },
          rotation_deg: 0,
          attenuation_db: { db24: 3.5, db5: 6.0 },
          swing_direction: 'inward',
          flip_swing: false
        },
        {
          id: 'win-living',
          name: 'Janela da Sala',
          category: 'aperture',
          type: 'window',
          wall_id: 'w-ext-top',
          position: { x: 3.5, y: 0.5 },
          size: { width_m: 1.5, height_m: 0.25 },
          rotation_deg: 0,
          attenuation_db: { db24: 2.0, db5: 4.0 }
        },
        {
          id: 'win-kitchen',
          name: 'Janela da Cozinha',
          category: 'aperture',
          type: 'window',
          wall_id: 'w-ext-left',
          position: { x: 0.5, y: 7.5 },
          size: { width_m: 1.2, height_m: 0.25 },
          rotation_deg: 90,
          attenuation_db: { db24: 2.0, db5: 4.0 }
        },
        {
          id: 'win-bed1',
          name: 'Janela Quarto 1',
          category: 'aperture',
          type: 'window',
          wall_id: 'w-ext-top',
          position: { x: 8.0, y: 0.5 },
          size: { width_m: 1.2, height_m: 0.25 },
          rotation_deg: 0,
          attenuation_db: { db24: 2.0, db5: 4.0 }
        },
        {
          id: 'win-bed2',
          name: 'Janela Quarto 2',
          category: 'aperture',
          type: 'window',
          wall_id: 'w-ext-top',
          position: { x: 11.0, y: 0.5 },
          size: { width_m: 1.2, height_m: 0.25 },
          rotation_deg: 0,
          attenuation_db: { db24: 2.0, db5: 4.0 }
        },
        {
          id: 'win-suite',
          name: 'Janela da Suíte',
          category: 'aperture',
          type: 'window',
          wall_id: 'w-ext-right',
          position: { x: 12.5, y: 6.0 },
          size: { width_m: 1.4, height_m: 0.25 },
          rotation_deg: 90,
          attenuation_db: { db24: 2.0, db5: 4.0 }
        },

        // Rede Wi-Fi Mesh: Roteador Principal + Nó Repetidor
        {
          id: 'dev-router-living',
          name: 'Roteador Wi-Fi (Sala)',
          category: 'transmitter',
          type: 'router_gateway',
          position: { x: 3.5, y: 2.2 },
          size: { width_m: 0.35, height_m: 0.3 },
          rotation_deg: 0,
          rf_config: { is_active: true, tx_power_dbm: 20.0, frequency_ghz: 5.0, channel: 36, antenna_gain_dbi: 3.0 }
        },
        {
          id: 'dev-mesh-veranda',
          name: 'Nó Mesh (Varanda)',
          category: 'transmitter',
          type: 'mesh_node',
          position: { x: 9.5, y: 8.5 },
          size: { width_m: 0.28, height_m: 0.28 },
          rotation_deg: 0,
          rf_config: { is_active: true, tx_power_dbm: 18.0, frequency_ghz: 5.0, channel: 36, antenna_gain_dbi: 3.0 }
        },

        // Living / Sala de Estar
        {
          id: 'dev-tv-casa',
          name: 'Smart TV 65" Sala',
          category: 'receiver',
          type: 'tv',
          position: { x: 3.5, y: 0.65 },
          size: { width_m: 1.2, height_m: 0.15 },
          rotation_deg: 0,
          receiver_metrics: { current_rssi_dbm: -48, quality_level: 'excellent' }
        },
        {
          id: 'dev-console-casa',
          name: 'Console de Videogame',
          category: 'receiver',
          type: 'videogame',
          position: { x: 4.6, y: 0.65 },
          size: { width_m: 0.3, height_m: 0.25 },
          rotation_deg: 0,
          receiver_metrics: { current_rssi_dbm: -50, quality_level: 'excellent' }
        },
        {
          id: 'dev-sofa-casa',
          name: 'Sofá Living',
          category: 'furniture',
          type: 'sofa',
          position: { x: 3.5, y: 3.5 },
          size: { width_m: 2.0, height_m: 0.8 },
          rotation_deg: 0,
          attenuation_db: { db24: 3.0, db5: 4.5 }
        },
        {
          id: 'dev-aquarium-casa',
          name: 'Aquário de Água Doce (160L - Vão dos Quartos)',
          category: 'obstacle',
          type: 'aquarium',
          position: { x: 6.5, y: 5.4 },
          size: { width_m: 1.0, height_m: 0.5 },
          rotation_deg: 90,
          attenuation_db: { db24: 16.0, db5: 22.0 }
        },
        {
          id: 'dev-phone-casa',
          name: 'Smartphone',
          category: 'receiver',
          type: 'phone',
          position: { x: 1.8, y: 3.5 },
          size: { width_m: 0.2, height_m: 0.12 },
          rotation_deg: 0,
          receiver_metrics: { current_rssi_dbm: -52, quality_level: 'excellent' }
        },

        // Cozinha Gourmet & Jantar
        {
          id: 'dev-table-casa',
          name: 'Mesa de Jantar (8 Lugares)',
          category: 'furniture',
          type: 'table',
          position: { x: 3.5, y: 6.8 },
          size: { width_m: 1.5, height_m: 0.85 },
          rotation_deg: 0,
          attenuation_db: { db24: 1.5, db5: 2.5 }
        },
        {
          id: 'dev-mirror-dining-casa',
          name: 'Espelho de Parede (Reflexão Metálica)',
          category: 'obstacle',
          type: 'mirror_obj',
          position: { x: 2.2, y: 5.5 },
          size: { width_m: 1.4, height_m: 0.12 },
          rotation_deg: 0,
          attenuation_db: { db24: 14.0, db5: 20.0 }
        },
        {
          id: 'dev-fridge-casa',
          name: 'Geladeira French Door (Inox)',
          category: 'obstacle',
          type: 'fridge',
          position: { x: 1.3, y: 6.5 },
          size: { width_m: 0.75, height_m: 0.75 },
          rotation_deg: 0,
          attenuation_db: { db24: 25.0, db5: 32.0 }
        },
        {
          id: 'dev-cooler-casa',
          name: 'Cervejeira Gourmet (Aço Inox)',
          category: 'obstacle',
          type: 'fridge',
          position: { x: 6.0, y: 8.5 },
          size: { width_m: 0.7, height_m: 0.7 },
          rotation_deg: 0,
          attenuation_db: { db24: 25.0, db5: 32.0 }
        },
        {
          id: 'dev-micro-casa',
          name: 'Forno Micro-ondas',
          category: 'noise_source',
          type: 'microwave',
          position: { x: 1.3, y: 8.2 },
          size: { width_m: 0.55, height_m: 0.35 },
          rotation_deg: 0,
          attenuation_db: { db24: 20.0, db5: 28.0 },
          rf_config: { is_active: true, noise_level_dbm: -35.0, interference_radius_m: 3.5 }
        },
        {
          id: 'dev-cordless-casa',
          name: 'Telefone Sem Fio 2.4 GHz',
          category: 'noise_source',
          type: 'cordless_phone',
          position: { x: 5.0, y: 6.0 },
          size: { width_m: 0.25, height_m: 0.2 },
          rotation_deg: 0,
          attenuation_db: { db24: 1.0, db5: 1.0 }
        },

        // Quarto 1
        {
          id: 'dev-bed-casa1',
          name: 'Cama Solteiro (Quarto 1)',
          category: 'furniture',
          type: 'bed',
          position: { x: 8.0, y: 2.5 },
          size: { width_m: 1.1, height_m: 1.9 },
          rotation_deg: 0,
          attenuation_db: { db24: 2.5, db5: 3.5 }
        },
        {
          id: 'dev-wardrobe-casa1',
          name: 'Armário Quarto 1',
          category: 'furniture',
          type: 'wardrobe',
          position: { x: 7.2, y: 4.0 },
          size: { width_m: 1.2, height_m: 0.5 },
          rotation_deg: 0,
          attenuation_db: { db24: 5.0, db5: 8.0 }
        },

        // Quarto 2 (Estação Gamer / Trabalho)
        {
          id: 'dev-pc-casa',
          name: 'PC Gamer (Quarto 2)',
          category: 'receiver',
          type: 'pc',
          position: { x: 11.0, y: 1.2 },
          size: { width_m: 0.65, height_m: 0.45 },
          rotation_deg: 0,
          receiver_metrics: { current_rssi_dbm: -64, quality_level: 'good' }
        },
        {
          id: 'dev-bed-casa2',
          name: 'Cama Solteiro (Quarto 2)',
          category: 'furniture',
          type: 'bed',
          position: { x: 11.0, y: 3.0 },
          size: { width_m: 1.1, height_m: 1.9 },
          rotation_deg: 0,
          attenuation_db: { db24: 2.5, db5: 3.5 }
        },

        // Suíte Master
        {
          id: 'dev-bed-suite-casa',
          name: 'Cama King (Suíte Master)',
          category: 'furniture',
          type: 'bed',
          position: { x: 8.2, y: 6.8 },
          size: { width_m: 1.6, height_m: 1.9 },
          rotation_deg: 0,
          attenuation_db: { db24: 2.5, db5: 3.5 }
        },
        {
          id: 'dev-tv-suite-casa',
          name: 'Smart TV Suíte',
          category: 'receiver',
          type: 'tv',
          position: { x: 8.2, y: 4.7 },
          size: { width_m: 0.9, height_m: 0.15 },
          rotation_deg: 0,
          receiver_metrics: { current_rssi_dbm: -58, quality_level: 'good' }
        },
        {
          id: 'dev-laptop-suite-casa',
          name: 'Notebook (Suíte Master)',
          category: 'receiver',
          type: 'laptop',
          position: { x: 7.2, y: 8.5 },
          size: { width_m: 0.35, height_m: 0.25 },
          rotation_deg: 0,
          receiver_metrics: { current_rssi_dbm: -60, quality_level: 'good' }
        },
        {
          id: 'dev-mirror-closet',
          name: 'Espelho Closet Suíte',
          category: 'obstacle',
          type: 'mirror_obj',
          position: { x: 9.6, y: 5.8 },
          size: { width_m: 0.8, height_m: 0.12 },
          rotation_deg: 90,
          attenuation_db: { db24: 14.0, db5: 20.0 }
        },
        {
          id: 'dev-mirror-bath-casa',
          name: 'Espelho Banheiro Suíte',
          category: 'obstacle',
          type: 'mirror_obj',
          position: { x: 11.2, y: 7.62 },
          size: { width_m: 0.7, height_m: 0.12 },
          rotation_deg: 0,
          attenuation_db: { db24: 14.0, db5: 20.0 }
        }
      ],
      furniture: []
    }
  };

  window.WifiSim.Templates = Templates;
})();
