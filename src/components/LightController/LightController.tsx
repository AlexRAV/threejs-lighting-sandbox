import * as THREE from 'three';
import { SceneManager } from '../../utils/SceneManager';

type LightType = 'ambient' | 'directional' | 'point' | 'spot';

interface LightData {
  id: string;
  type: LightType;
  color: string;
  intensity: number;
  position?: THREE.Vector3;
  target?: THREE.Vector3;
  castShadow?: boolean;
  helper?: THREE.Object3D;
}

export class LightController {
  private containerId: string;
  private container: HTMLElement;
  private sceneManager: SceneManager;
  private lights: Map<string, LightData>;
  private lightCounter: Map<LightType, number>;

  constructor(containerId: string, sceneManager: SceneManager) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId) as HTMLElement;
    if (!this.container) {
      throw new Error(`Container with ID ${containerId} not found`);
    }

    this.sceneManager = sceneManager;
    this.lights = new Map();
    this.lightCounter = new Map([
      ['ambient', 0],
      ['directional', 0],
      ['point', 0],
      ['spot', 0]
    ]);
  }

  init() {
    this.renderUI();
  }

  private renderUI() {
    this.container.innerHTML = '';
    
    const lightControlsHeader = document.createElement('div');
    lightControlsHeader.className = 'control-group';
    
    const heading = document.createElement('h2');
    heading.textContent = 'Light Controls';
    lightControlsHeader.appendChild(heading);
    
    const addButtonsWrapper = document.createElement('div');
    addButtonsWrapper.style.display = 'grid';
    addButtonsWrapper.style.gridTemplateColumns = 'repeat(2, 1fr)';
    addButtonsWrapper.style.gap = '8px';
    
    const lightTypes: LightType[] = ['ambient', 'directional', 'point', 'spot'];
    
    lightTypes.forEach(type => {
      const button = document.createElement('button');
      button.textContent = `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`;
      button.onclick = () => this.addLight(type);
      addButtonsWrapper.appendChild(button);
    });
    
    lightControlsHeader.appendChild(addButtonsWrapper);
    this.container.appendChild(lightControlsHeader);
    
    const lightsContainer = document.createElement('div');
    lightsContainer.id = 'lights-container';
    this.container.appendChild(lightsContainer);
    
    this.renderLights(lightsContainer);
  }

  private renderLights(container: HTMLElement) {
    container.innerHTML = '';
    
    if (this.lights.size === 0) {
      const noLightsMsg = document.createElement('p');
      noLightsMsg.textContent = 'No custom lights added. Add a light to get started.';
      noLightsMsg.style.color = '#888';
      noLightsMsg.style.fontStyle = 'italic';
      noLightsMsg.style.margin = '20px 0';
      container.appendChild(noLightsMsg);
      return;
    }
    
    this.lights.forEach((lightData, id) => {
      const lightElement = this.createLightElement(lightData);
      container.appendChild(lightElement);
    });
  }

  private createLightElement(lightData: LightData) {
    const lightElement = document.createElement('div');
    lightElement.className = 'control-group';
    lightElement.style.border = '1px solid #ddd';
    lightElement.style.borderRadius = '4px';
    lightElement.style.padding = '12px';
    lightElement.style.marginBottom = '16px';
    
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '12px';
    
    const title = document.createElement('h3');
    title.textContent = `${lightData.type.charAt(0).toUpperCase() + lightData.type.slice(1)} Light`;
    title.style.margin = '0';
    header.appendChild(title);
    
    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.style.width = 'auto';
    removeButton.style.padding = '4px 8px';
    removeButton.style.backgroundColor = '#e74c3c';
    removeButton.onclick = () => this.removeLight(lightData.id);
    header.appendChild(removeButton);
    
    lightElement.appendChild(header);
    
    // Common controls for all lights
    const colorControl = this.createColorControl(lightData);
    const intensityControl = this.createIntensityControl(lightData);
    
    lightElement.appendChild(colorControl);
    lightElement.appendChild(intensityControl);
    
    // Type-specific controls
    if (lightData.type !== 'ambient') {
      const positionControls = this.createPositionControls(lightData);
      lightElement.appendChild(positionControls);
      
      if (lightData.type === 'directional' || lightData.type === 'spot') {
        const shadowControl = this.createShadowControl(lightData);
        lightElement.appendChild(shadowControl);
      }
    }
    
    return lightElement;
  }

  private createColorControl(lightData: LightData) {
    const controlItem = document.createElement('div');
    controlItem.className = 'control-item';
    
    const label = document.createElement('label');
    label.textContent = 'Color';
    controlItem.appendChild(label);
    
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = lightData.color;
    colorInput.onchange = (e) => {
      const newColor = (e.target as HTMLInputElement).value;
      this.updateLightColor(lightData.id, newColor);
    };
    controlItem.appendChild(colorInput);
    
    return controlItem;
  }

  private createIntensityControl(lightData: LightData) {
    const controlItem = document.createElement('div');
    controlItem.className = 'control-item';
    
    const label = document.createElement('label');
    label.textContent = 'Intensity';
    controlItem.appendChild(label);
    
    const intensityWrapper = document.createElement('div');
    intensityWrapper.style.display = 'flex';
    intensityWrapper.style.alignItems = 'center';
    intensityWrapper.style.gap = '10px';
    
    const intensityInput = document.createElement('input');
    intensityInput.type = 'range';
    intensityInput.min = '0';
    intensityInput.max = '5';
    intensityInput.step = '0.1';
    intensityInput.value = lightData.intensity.toString();
    intensityInput.style.flex = '1';
    
    const intensityValue = document.createElement('span');
    intensityValue.textContent = lightData.intensity.toString();
    intensityValue.style.minWidth = '30px';
    intensityValue.style.textAlign = 'right';
    
    intensityInput.oninput = (e) => {
      const newIntensity = parseFloat((e.target as HTMLInputElement).value);
      intensityValue.textContent = newIntensity.toFixed(1);
      this.updateLightIntensity(lightData.id, newIntensity);
    };
    
    intensityWrapper.appendChild(intensityInput);
    intensityWrapper.appendChild(intensityValue);
    controlItem.appendChild(intensityWrapper);
    
    return controlItem;
  }

  private createPositionControls(lightData: LightData) {
    const controlGroup = document.createElement('div');
    controlGroup.className = 'control-item';
    
    const label = document.createElement('label');
    label.textContent = 'Position';
    controlGroup.appendChild(label);
    
    const position = lightData.position || new THREE.Vector3(0, 0, 0);
    const axes = [
      { name: 'X', value: position.x },
      { name: 'Y', value: position.y },
      { name: 'Z', value: position.z }
    ];
    
    axes.forEach((axis, index) => {
      const axisWrapper = document.createElement('div');
      axisWrapper.style.display = 'flex';
      axisWrapper.style.alignItems = 'center';
      axisWrapper.style.gap = '10px';
      axisWrapper.style.marginBottom = '5px';
      
      const axisLabel = document.createElement('span');
      axisLabel.textContent = axis.name;
      axisLabel.style.minWidth = '15px';
      
      const axisInput = document.createElement('input');
      axisInput.type = 'range';
      axisInput.min = '-10';
      axisInput.max = '10';
      axisInput.step = '0.5';
      axisInput.value = axis.value.toString();
      axisInput.style.flex = '1';
      
      const axisValue = document.createElement('span');
      axisValue.textContent = axis.value.toFixed(1);
      axisValue.style.minWidth = '30px';
      axisValue.style.textAlign = 'right';
      
      axisInput.oninput = (e) => {
        const newValue = parseFloat((e.target as HTMLInputElement).value);
        axisValue.textContent = newValue.toFixed(1);
        
        const newPosition = new THREE.Vector3(
          index === 0 ? newValue : position.x,
          index === 1 ? newValue : position.y,
          index === 2 ? newValue : position.z
        );
        
        this.updateLightPosition(lightData.id, newPosition);
      };
      
      axisWrapper.appendChild(axisLabel);
      axisWrapper.appendChild(axisInput);
      axisWrapper.appendChild(axisValue);
      controlGroup.appendChild(axisWrapper);
    });
    
    return controlGroup;
  }

  private createShadowControl(lightData: LightData) {
    const controlItem = document.createElement('div');
    controlItem.className = 'control-item';
    
    const shadowWrapper = document.createElement('div');
    shadowWrapper.style.display = 'flex';
    shadowWrapper.style.alignItems = 'center';
    shadowWrapper.style.gap = '10px';
    
    const shadowCheck = document.createElement('input');
    shadowCheck.type = 'checkbox';
    shadowCheck.id = `shadow-${lightData.id}`;
    shadowCheck.checked = !!lightData.castShadow;
    shadowCheck.style.width = 'auto';
    
    const shadowLabel = document.createElement('label');
    shadowLabel.textContent = 'Cast Shadows';
    shadowLabel.htmlFor = `shadow-${lightData.id}`;
    
    shadowCheck.onchange = (e) => {
      const shouldCastShadow = (e.target as HTMLInputElement).checked;
      this.updateShadowCasting(lightData.id, shouldCastShadow);
    };
    
    shadowWrapper.appendChild(shadowCheck);
    shadowWrapper.appendChild(shadowLabel);
    controlItem.appendChild(shadowWrapper);
    
    return controlItem;
  }

  private addLight(type: LightType) {
    const count = (this.lightCounter.get(type) || 0) + 1;
    this.lightCounter.set(type, count);
    
    const id = `${type}_${count}`;
    let light: THREE.Light;
    let helper: THREE.Object3D | undefined;
    
    const lightData: LightData = {
      id,
      type,
      color: '#ffffff',
      intensity: 1
    };
    
    switch (type) {
      case 'ambient':
        light = new THREE.AmbientLight(0xffffff, 1);
        break;
        
      case 'directional':
        light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(5, 5, 5);
        (light as THREE.DirectionalLight).castShadow = true;
        
        helper = new THREE.DirectionalLightHelper(light as THREE.DirectionalLight, 1);
        this.sceneManager.addObject(`${id}_helper`, helper);
        
        lightData.position = new THREE.Vector3(5, 5, 5);
        lightData.castShadow = true;
        break;
        
      case 'point':
        light = new THREE.PointLight(0xffffff, 1);
        light.position.set(2, 2, 2);
        
        helper = new THREE.PointLightHelper(light as THREE.PointLight, 0.5);
        this.sceneManager.addObject(`${id}_helper`, helper);
        
        lightData.position = new THREE.Vector3(2, 2, 2);
        break;
        
      case 'spot':
        light = new THREE.SpotLight(0xffffff, 1);
        light.position.set(2, 5, 2);
        (light as THREE.SpotLight).castShadow = true;
        (light as THREE.SpotLight).angle = Math.PI / 6;
        (light as THREE.SpotLight).penumbra = 0.2;
        
        helper = new THREE.SpotLightHelper(light as THREE.SpotLight);
        this.sceneManager.addObject(`${id}_helper`, helper);
        
        lightData.position = new THREE.Vector3(2, 5, 2);
        lightData.castShadow = true;
        break;
        
      default:
        throw new Error(`Unsupported light type: ${type}`);
    }
    
    this.sceneManager.addLight(id, light);
    lightData.helper = helper;
    this.lights.set(id, lightData);
    
    this.renderUI();
  }

  removeLight(id: string) {
    const lightData = this.lights.get(id);
    if (lightData) {
      if (lightData.helper) {
        this.sceneManager.removeObject(`${id}_helper`);
      }
      this.sceneManager.removeLight(id);
      this.lights.delete(id);
      this.renderUI();
    }
  }

  private updateLightColor(id: string, color: string) {
    const light = this.sceneManager.getLight(id);
    const lightData = this.lights.get(id);
    
    if (light && lightData) {
      const colorValue = new THREE.Color(color);
      
      if ('color' in light) {
        light.color = colorValue;
      }
      
      lightData.color = color;
      
      if (lightData.helper) {
        if (lightData.helper instanceof THREE.DirectionalLightHelper ||
            lightData.helper instanceof THREE.PointLightHelper ||
            lightData.helper instanceof THREE.SpotLightHelper) {
          lightData.helper.update();
        }
      }
    }
  }

  private updateLightIntensity(id: string, intensity: number) {
    const light = this.sceneManager.getLight(id);
    const lightData = this.lights.get(id);
    
    if (light && lightData) {
      light.intensity = intensity;
      lightData.intensity = intensity;
    }
  }

  private updateLightPosition(id: string, position: THREE.Vector3) {
    const light = this.sceneManager.getLight(id);
    const lightData = this.lights.get(id);
    
    if (light && lightData && light !== undefined && 'position' in light) {
      light.position.copy(position);
      lightData.position = position.clone();
      
      if (lightData.helper) {
        if (lightData.helper instanceof THREE.DirectionalLightHelper ||
            lightData.helper instanceof THREE.PointLightHelper ||
            lightData.helper instanceof THREE.SpotLightHelper) {
          lightData.helper.update();
        }
      }
    }
  }

  private updateShadowCasting(id: string, castShadow: boolean) {
    const light = this.sceneManager.getLight(id);
    const lightData = this.lights.get(id);
    
    if (light && lightData) {
      if (light instanceof THREE.DirectionalLight || 
          light instanceof THREE.SpotLight) {
        light.castShadow = castShadow;
        lightData.castShadow = castShadow;
      }
    }
  }
} 