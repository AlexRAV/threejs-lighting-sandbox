import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { SceneManager } from '../../utils/SceneManager.js';

interface EnvironmentSettings {
  preset: string;
  toneMappingExposure: number;
  toneMapping: THREE.ToneMapping;
}

export class EnvironmentController {
  private containerId: string;
  private container: HTMLElement;
  private sceneManager: SceneManager;
  private currentSettings: EnvironmentSettings;
  private rgbeLoader: RGBELoader;
  
  private baseHDRPath = 'https://raw.githack.com/pmndrs/drei-assets/456060a26bbeb8fdf79326f224b6d99b8bcce736/hdri/';
  
  private hdrPresets = {
    none: '',
    apartment: 'lebombo_1k.hdr',
    city: 'potsdamer_platz_1k.hdr',
    dawn: 'kiara_1_dawn_1k.hdr',
    forest: 'forest_slope_1k.hdr',
    lobby: 'st_fagans_interior_1k.hdr',
    night: 'dikhololo_night_1k.hdr',
    park: 'rooitou_park_1k.hdr',
    studio: 'studio_small_03_1k.hdr',
    sunset: 'venice_sunset_1k.hdr',
    warehouse: 'empty_warehouse_01_1k.hdr'
  };
  
  private toneMappingOptions = [
    { name: 'None', value: THREE.NoToneMapping },
    { name: 'Linear', value: THREE.LinearToneMapping },
    { name: 'Reinhard', value: THREE.ReinhardToneMapping },
    { name: 'Cineon', value: THREE.CineonToneMapping },
    { name: 'ACESFilmic', value: THREE.ACESFilmicToneMapping }
  ];

  constructor(containerId: string, sceneManager: SceneManager) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId) as HTMLElement;
    if (!this.container) {
      throw new Error(`Container with ID ${containerId} not found`);
    }

    this.sceneManager = sceneManager;
    this.rgbeLoader = new RGBELoader();
    
    this.currentSettings = {
      preset: 'none',
      toneMappingExposure: 1.0,
      toneMapping: THREE.ACESFilmicToneMapping
    };
  }

  init() {
    this.renderUI();
    this.updateEnvironment();
  }

  private renderUI() {
    this.container.innerHTML = '';
    
    const envControlsHeader = document.createElement('div');
    envControlsHeader.className = 'control-group';
    
    const heading = document.createElement('h2');
    heading.textContent = 'Environment Settings';
    envControlsHeader.appendChild(heading);
    
    this.container.appendChild(envControlsHeader);
    
    // Preset selector
    const presetControl = document.createElement('div');
    presetControl.className = 'control-item';
    
    const presetLabel = document.createElement('label');
    presetLabel.textContent = 'Environment Preset';
    presetControl.appendChild(presetLabel);
    
    const presetSelect = document.createElement('select');
    presetSelect.id = 'env-preset';
    
    Object.keys(this.hdrPresets).forEach(preset => {
      const option = document.createElement('option');
      option.value = preset;
      option.textContent = preset.charAt(0).toUpperCase() + preset.slice(1);
      if (preset === this.currentSettings.preset) {
        option.selected = true;
      }
      presetSelect.appendChild(option);
    });
    
    presetSelect.onchange = (e) => {
      const newPreset = (e.target as HTMLSelectElement).value;
      this.currentSettings.preset = newPreset;
      this.updateEnvironment();
    };
    
    presetControl.appendChild(presetSelect);
    this.container.appendChild(presetControl);
    
    // Tone mapping selector
    const toneMappingControl = document.createElement('div');
    toneMappingControl.className = 'control-item';
    
    const toneMappingLabel = document.createElement('label');
    toneMappingLabel.textContent = 'Tone Mapping';
    toneMappingControl.appendChild(toneMappingLabel);
    
    const toneMappingSelect = document.createElement('select');
    toneMappingSelect.id = 'tone-mapping';
    
    this.toneMappingOptions.forEach(option => {
      const selectOption = document.createElement('option');
      selectOption.value = option.value.toString();
      selectOption.textContent = option.name;
      if (option.value === this.currentSettings.toneMapping) {
        selectOption.selected = true;
      }
      toneMappingSelect.appendChild(selectOption);
    });
    
    toneMappingSelect.onchange = (e) => {
      const newToneMapping = parseInt((e.target as HTMLSelectElement).value);
      this.currentSettings.toneMapping = newToneMapping;
      this.updateEnvironment();
    };
    
    toneMappingControl.appendChild(toneMappingSelect);
    this.container.appendChild(toneMappingControl);
    
    // Exposure slider
    const exposureControl = document.createElement('div');
    exposureControl.className = 'control-item';
    
    const exposureLabel = document.createElement('label');
    exposureLabel.textContent = 'Exposure';
    exposureControl.appendChild(exposureLabel);
    
    const exposureWrapper = document.createElement('div');
    exposureWrapper.style.display = 'flex';
    exposureWrapper.style.alignItems = 'center';
    exposureWrapper.style.gap = '10px';
    
    const exposureInput = document.createElement('input');
    exposureInput.type = 'range';
    exposureInput.min = '0.1';
    exposureInput.max = '3';
    exposureInput.step = '0.1';
    exposureInput.value = this.currentSettings.toneMappingExposure.toString();
    exposureInput.style.flex = '1';
    
    const exposureValue = document.createElement('span');
    exposureValue.textContent = this.currentSettings.toneMappingExposure.toFixed(1);
    exposureValue.style.minWidth = '30px';
    exposureValue.style.textAlign = 'right';
    
    exposureInput.oninput = (e) => {
      const newExposure = parseFloat((e.target as HTMLInputElement).value);
      exposureValue.textContent = newExposure.toFixed(1);
      this.currentSettings.toneMappingExposure = newExposure;
      this.updateEnvironment();
    };
    
    exposureWrapper.appendChild(exposureInput);
    exposureWrapper.appendChild(exposureValue);
    exposureControl.appendChild(exposureWrapper);
    
    this.container.appendChild(exposureControl);
  }
  
  private updateEnvironment() {
    if (this.currentSettings.preset === 'none') {
      this.sceneManager.getRenderer().toneMappingExposure = this.currentSettings.toneMappingExposure;
      this.sceneManager.getRenderer().toneMapping = this.currentSettings.toneMapping;
      this.sceneManager.getScene().environment = null;
      this.sceneManager.getScene().background = null;
      return;
    }
    
    const hdrPath = `${this.baseHDRPath}${this.hdrPresets[this.currentSettings.preset]}`;
    
    const loadingText = document.createElement('div');
    loadingText.textContent = `Loading environment...`;
    loadingText.style.padding = '10px';
    loadingText.style.backgroundColor = '#f8f9fa';
    loadingText.style.margin = '10px 0';
    loadingText.style.borderRadius = '4px';
    loadingText.id = 'loading-env';
    this.container.appendChild(loadingText);
    
    this.rgbeLoader.load(hdrPath, (hdrTexture) => {
      const pmremGenerator = new THREE.PMREMGenerator(this.sceneManager.getRenderer());
      const hdrCubeRenderTarget = pmremGenerator.fromEquirectangular(hdrTexture);
      
      hdrTexture.dispose();
      pmremGenerator.dispose();
      
      this.sceneManager.getScene().environment = hdrCubeRenderTarget.texture;
      this.sceneManager.getScene().background = hdrCubeRenderTarget.texture;
      this.sceneManager.getRenderer().toneMappingExposure = this.currentSettings.toneMappingExposure;
      this.sceneManager.getRenderer().toneMapping = this.currentSettings.toneMapping;
      
      const loadingElement = document.getElementById('loading-env');
      if (loadingElement) loadingElement.remove();
    }, 
    undefined, 
    (error) => {
      console.error('Error loading HDR environment:', error);
      const loadingElement = document.getElementById('loading-env');
      if (loadingElement) {
        loadingElement.textContent = `Error loading environment: ${error.message}`;
        loadingElement.style.color = 'red';
        
        setTimeout(() => {
          loadingElement.remove();
        }, 5000);
      }
    });
  }
} 