import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { SceneManager } from '../../utils/SceneManager';

// Types for progress and error callbacks
interface ProgressEvent {
  loaded: number;
  total: number;
}

interface ErrorEvent {
  message: string;
}

interface ObjectData {
  id: string;
  type: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  color: string;
  roughness: number;
  metalness: number;
  isCustomModel?: boolean;
  modelUrl?: string;
}

export class ObjectController {
  private containerId: string;
  private container: HTMLElement;
  private sceneManager: SceneManager;
  private objects: Map<string, ObjectData>;
  private objectCounter: number;
  private modelCounter: number;
  private gltfLoader: GLTFLoader;
  private dracoLoader: DRACOLoader;

  constructor(containerId: string, sceneManager: SceneManager) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId) as HTMLElement;
    if (!this.container) {
      throw new Error(`Container with ID ${containerId} not found`);
    }

    this.sceneManager = sceneManager;
    this.objects = new Map();
    this.objectCounter = 0;
    this.modelCounter = 0;
    
    // Setup DRACO loader
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('/draco/');
    this.dracoLoader.setDecoderConfig({ type: 'js' });
    
    // Setup GLTF loader with DRACO support
    this.gltfLoader = new GLTFLoader();
    this.gltfLoader.setDRACOLoader(this.dracoLoader);
  }

  init() {
    this.renderUI();
  }

  private renderUI() {
    this.container.innerHTML = '';
    
    const objectControlsHeader = document.createElement('div');
    objectControlsHeader.className = 'control-group';
    
    const heading = document.createElement('h2');
    heading.textContent = 'Object Controls';
    objectControlsHeader.appendChild(heading);
    
    const addButtonsWrapper = document.createElement('div');
    addButtonsWrapper.style.display = 'grid';
    addButtonsWrapper.style.gridTemplateColumns = 'repeat(2, 1fr)';
    addButtonsWrapper.style.gap = '8px';
    
    const objectTypes = [
      { name: 'Box', type: 'box' },
      { name: 'Sphere', type: 'sphere' },
      { name: 'Cylinder', type: 'cylinder' },
      { name: 'Torus', type: 'torus' }
    ];
    
    objectTypes.forEach(objType => {
      const button = document.createElement('button');
      button.textContent = `Add ${objType.name}`;
      button.onclick = () => this.addObject(objType.type);
      addButtonsWrapper.appendChild(button);
    });
    
    objectControlsHeader.appendChild(addButtonsWrapper);
    
    const modelUploadSection = document.createElement('div');
    modelUploadSection.className = 'control-item';
    modelUploadSection.style.marginTop = '12px';
    
    const modelUploadLabel = document.createElement('h3');
    modelUploadLabel.textContent = 'Import 3D Model';
    modelUploadLabel.style.margin = '8px 0';
    modelUploadSection.appendChild(modelUploadLabel);
    
    const modelUploadDescription = document.createElement('p');
    modelUploadDescription.textContent = 'Upload a GLTF/GLB file (.glb, .gltf)';
    modelUploadDescription.style.fontSize = '0.9rem';
    modelUploadDescription.style.color = '#666';
    modelUploadDescription.style.marginBottom = '8px';
    modelUploadSection.appendChild(modelUploadDescription);
    
    const modelUploadInput = document.createElement('input');
    modelUploadInput.type = 'file';
    modelUploadInput.id = 'model-upload';
    modelUploadInput.accept = '.glb,.gltf';
    modelUploadInput.style.display = 'none';
    
    const modelUploadButton = document.createElement('button');
    modelUploadButton.textContent = 'Upload Model';
    modelUploadButton.onclick = () => modelUploadInput.click();
    
    modelUploadInput.onchange = (e: Event) => {
      const input = e.target as HTMLInputElement;
      if (input.files && input.files.length > 0) {
        this.handleModelUpload(input.files[0]);
      }
    };
    
    modelUploadSection.appendChild(modelUploadInput);
    modelUploadSection.appendChild(modelUploadButton);
    
    objectControlsHeader.appendChild(modelUploadSection);
    this.container.appendChild(objectControlsHeader);
    
    const objectsContainer = document.createElement('div');
    objectsContainer.id = 'objects-container';
    this.container.appendChild(objectsContainer);
    
    this.renderObjects(objectsContainer);
  }

  private renderObjects(container: HTMLElement) {
    container.innerHTML = '';
    
    if (this.objects.size === 0) {
      const noObjectsMsg = document.createElement('p');
      noObjectsMsg.textContent = 'No custom objects added. Add an object to get started.';
      noObjectsMsg.style.color = '#888';
      noObjectsMsg.style.fontStyle = 'italic';
      noObjectsMsg.style.margin = '20px 0';
      container.appendChild(noObjectsMsg);
      return;
    }
    
    this.objects.forEach((objectData, id) => {
      const objectElement = this.createObjectElement(objectData);
      container.appendChild(objectElement);
    });
  }

  private createObjectElement(objectData: ObjectData) {
    const objectElement = document.createElement('div');
    objectElement.className = 'control-group';
    objectElement.style.border = '1px solid #ddd';
    objectElement.style.borderRadius = '4px';
    objectElement.style.padding = '12px';
    objectElement.style.marginBottom = '16px';
    
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '12px';
    
    const title = document.createElement('h3');
    const displayName = objectData.isCustomModel ? 'Custom Model' : objectData.type.charAt(0).toUpperCase() + objectData.type.slice(1);
    title.textContent = displayName;
    title.style.margin = '0';
    header.appendChild(title);
    
    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.style.width = 'auto';
    removeButton.style.padding = '4px 8px';
    removeButton.style.backgroundColor = '#e74c3c';
    removeButton.onclick = () => this.removeObject(objectData.id);
    header.appendChild(removeButton);
    
    objectElement.appendChild(header);
    
    if (!objectData.isCustomModel) {
      const materialControls = document.createElement('div');
      materialControls.className = 'control-item';
      
      const materialTitle = document.createElement('h4');
      materialTitle.textContent = 'Material';
      materialTitle.style.margin = '0 0 8px 0';
      materialControls.appendChild(materialTitle);
      
      const colorControl = this.createColorControl(objectData);
      const roughnessControl = this.createRoughnessControl(objectData);
      const metalnessControl = this.createMetalnessControl(objectData);
      
      materialControls.appendChild(colorControl);
      materialControls.appendChild(roughnessControl);
      materialControls.appendChild(metalnessControl);
      
      objectElement.appendChild(materialControls);
    }
    
    const positionControls = this.createPositionControls(objectData);
    objectElement.appendChild(positionControls);
    
    const rotationControls = this.createRotationControls(objectData);
    objectElement.appendChild(rotationControls);
    
    const scaleControls = this.createScaleControls(objectData);
    objectElement.appendChild(scaleControls);
    
    return objectElement;
  }

  private createColorControl(objectData: ObjectData) {
    const controlWrapper = document.createElement('div');
    controlWrapper.style.marginBottom = '8px';
    
    const label = document.createElement('label');
    label.textContent = 'Color';
    controlWrapper.appendChild(label);
    
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = objectData.color;
    colorInput.onchange = (e) => {
      const newColor = (e.target as HTMLInputElement).value;
      this.updateObjectColor(objectData.id, newColor);
    };
    controlWrapper.appendChild(colorInput);
    
    return controlWrapper;
  }

  private createRoughnessControl(objectData: ObjectData) {
    const controlWrapper = document.createElement('div');
    controlWrapper.style.marginBottom = '8px';
    
    const label = document.createElement('label');
    label.textContent = 'Roughness';
    controlWrapper.appendChild(label);
    
    const sliderWrapper = document.createElement('div');
    sliderWrapper.style.display = 'flex';
    sliderWrapper.style.alignItems = 'center';
    sliderWrapper.style.gap = '10px';
    
    const roughnessInput = document.createElement('input');
    roughnessInput.type = 'range';
    roughnessInput.min = '0';
    roughnessInput.max = '1';
    roughnessInput.step = '0.05';
    roughnessInput.value = objectData.roughness.toString();
    roughnessInput.style.flex = '1';
    
    const roughnessValue = document.createElement('span');
    roughnessValue.textContent = objectData.roughness.toFixed(2);
    roughnessValue.style.minWidth = '30px';
    roughnessValue.style.textAlign = 'right';
    
    roughnessInput.oninput = (e) => {
      const newRoughness = parseFloat((e.target as HTMLInputElement).value);
      roughnessValue.textContent = newRoughness.toFixed(2);
      this.updateObjectRoughness(objectData.id, newRoughness);
    };
    
    sliderWrapper.appendChild(roughnessInput);
    sliderWrapper.appendChild(roughnessValue);
    controlWrapper.appendChild(sliderWrapper);
    
    return controlWrapper;
  }

  private createMetalnessControl(objectData: ObjectData) {
    const controlWrapper = document.createElement('div');
    controlWrapper.style.marginBottom = '8px';
    
    const label = document.createElement('label');
    label.textContent = 'Metalness';
    controlWrapper.appendChild(label);
    
    const sliderWrapper = document.createElement('div');
    sliderWrapper.style.display = 'flex';
    sliderWrapper.style.alignItems = 'center';
    sliderWrapper.style.gap = '10px';
    
    const metalnessInput = document.createElement('input');
    metalnessInput.type = 'range';
    metalnessInput.min = '0';
    metalnessInput.max = '1';
    metalnessInput.step = '0.05';
    metalnessInput.value = objectData.metalness.toString();
    metalnessInput.style.flex = '1';
    
    const metalnessValue = document.createElement('span');
    metalnessValue.textContent = objectData.metalness.toFixed(2);
    metalnessValue.style.minWidth = '30px';
    metalnessValue.style.textAlign = 'right';
    
    metalnessInput.oninput = (e) => {
      const newMetalness = parseFloat((e.target as HTMLInputElement).value);
      metalnessValue.textContent = newMetalness.toFixed(2);
      this.updateObjectMetalness(objectData.id, newMetalness);
    };
    
    sliderWrapper.appendChild(metalnessInput);
    sliderWrapper.appendChild(metalnessValue);
    controlWrapper.appendChild(sliderWrapper);
    
    return controlWrapper;
  }

  private createPositionControls(objectData: ObjectData) {
    const controlGroup = document.createElement('div');
    controlGroup.className = 'control-item';
    
    const title = document.createElement('h4');
    title.textContent = 'Position';
    title.style.margin = '12px 0 8px 0';
    controlGroup.appendChild(title);
    
    const axes = [
      { name: 'X', value: objectData.position.x },
      { name: 'Y', value: objectData.position.y },
      { name: 'Z', value: objectData.position.z }
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
          index === 0 ? newValue : objectData.position.x,
          index === 1 ? newValue : objectData.position.y,
          index === 2 ? newValue : objectData.position.z
        );
        
        this.updateObjectPosition(objectData.id, newPosition);
      };
      
      axisWrapper.appendChild(axisLabel);
      axisWrapper.appendChild(axisInput);
      axisWrapper.appendChild(axisValue);
      controlGroup.appendChild(axisWrapper);
    });
    
    return controlGroup;
  }

  private createRotationControls(objectData: ObjectData) {
    const controlGroup = document.createElement('div');
    controlGroup.className = 'control-item';
    
    const title = document.createElement('h4');
    title.textContent = 'Rotation';
    title.style.margin = '12px 0 8px 0';
    controlGroup.appendChild(title);
    
    const angles = [
      { name: 'X', value: objectData.rotation.x * (180 / Math.PI) },
      { name: 'Y', value: objectData.rotation.y * (180 / Math.PI) },
      { name: 'Z', value: objectData.rotation.z * (180 / Math.PI) }
    ];
    
    angles.forEach((angle, index) => {
      const angleWrapper = document.createElement('div');
      angleWrapper.style.display = 'flex';
      angleWrapper.style.alignItems = 'center';
      angleWrapper.style.gap = '10px';
      angleWrapper.style.marginBottom = '5px';
      
      const angleLabel = document.createElement('span');
      angleLabel.textContent = angle.name;
      angleLabel.style.minWidth = '15px';
      
      const angleInput = document.createElement('input');
      angleInput.type = 'range';
      angleInput.min = '-180';
      angleInput.max = '180';
      angleInput.step = '5';
      angleInput.value = angle.value.toString();
      angleInput.style.flex = '1';
      
      const angleValue = document.createElement('span');
      angleValue.textContent = angle.value.toFixed(0);
      angleValue.style.minWidth = '30px';
      angleValue.style.textAlign = 'right';
      
      angleInput.oninput = (e) => {
        const newValue = parseFloat((e.target as HTMLInputElement).value);
        angleValue.textContent = newValue.toFixed(0);
        
        const newRotation = new THREE.Euler(
          index === 0 ? newValue * (Math.PI / 180) : objectData.rotation.x,
          index === 1 ? newValue * (Math.PI / 180) : objectData.rotation.y,
          index === 2 ? newValue * (Math.PI / 180) : objectData.rotation.z
        );
        
        this.updateObjectRotation(objectData.id, newRotation);
      };
      
      angleWrapper.appendChild(angleLabel);
      angleWrapper.appendChild(angleInput);
      angleWrapper.appendChild(angleValue);
      controlGroup.appendChild(angleWrapper);
    });
    
    return controlGroup;
  }

  private createScaleControls(objectData: ObjectData) {
    const controlGroup = document.createElement('div');
    controlGroup.className = 'control-item';
    
    const title = document.createElement('h4');
    title.textContent = 'Scale';
    title.style.margin = '12px 0 8px 0';
    controlGroup.appendChild(title);
    
    const scales = [
      { name: 'X', value: objectData.scale.x },
      { name: 'Y', value: objectData.scale.y },
      { name: 'Z', value: objectData.scale.z }
    ];
    
    scales.forEach((scale, index) => {
      const scaleWrapper = document.createElement('div');
      scaleWrapper.style.display = 'flex';
      scaleWrapper.style.alignItems = 'center';
      scaleWrapper.style.gap = '10px';
      scaleWrapper.style.marginBottom = '5px';
      
      const scaleLabel = document.createElement('span');
      scaleLabel.textContent = scale.name;
      scaleLabel.style.minWidth = '15px';
      
      const scaleInput = document.createElement('input');
      scaleInput.type = 'range';
      scaleInput.min = '0.1';
      scaleInput.max = '5';
      scaleInput.step = '0.1';
      scaleInput.value = scale.value.toString();
      scaleInput.style.flex = '1';
      
      const scaleValue = document.createElement('span');
      scaleValue.textContent = scale.value.toFixed(1);
      scaleValue.style.minWidth = '30px';
      scaleValue.style.textAlign = 'right';
      
      scaleInput.oninput = (e) => {
        const newValue = parseFloat((e.target as HTMLInputElement).value);
        scaleValue.textContent = newValue.toFixed(1);
        
        const newScale = new THREE.Vector3(
          index === 0 ? newValue : objectData.scale.x,
          index === 1 ? newValue : objectData.scale.y,
          index === 2 ? newValue : objectData.scale.z
        );
        
        this.updateObjectScale(objectData.id, newScale);
      };
      
      scaleWrapper.appendChild(scaleLabel);
      scaleWrapper.appendChild(scaleInput);
      scaleWrapper.appendChild(scaleValue);
      controlGroup.appendChild(scaleWrapper);
    });
    
    return controlGroup;
  }

  private addObject(type: string) {
    this.objectCounter++;
    const id = `${type}_${this.objectCounter}`;
    
    let geometry: THREE.BufferGeometry;
    
    switch (type) {
      case 'box':
        geometry = new THREE.BoxGeometry(1, 1, 1);
        break;
      case 'sphere':
        geometry = new THREE.SphereGeometry(0.5, 32, 32);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
        break;
      case 'torus':
        geometry = new THREE.TorusGeometry(0.5, 0.2, 16, 32);
        break;
      default:
        throw new Error(`Unsupported object type: ${type}`);
    }
    
    const position = new THREE.Vector3(
      Math.random() * 4 - 2,
      type === 'cylinder' || type === 'box' ? 0.5 : 0.5,
      Math.random() * 4 - 2
    );
    
    const rotation = new THREE.Euler(0, 0, 0);
    const scale = new THREE.Vector3(1, 1, 1);
    
    const material = new THREE.MeshStandardMaterial({
      color: 0x1a75ff,
      roughness: 0.5,
      metalness: 0.2
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.rotation.copy(rotation);
    mesh.scale.copy(scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    this.sceneManager.addObject(id, mesh);
    
    const objectData: ObjectData = {
      id,
      type,
      position: position.clone(),
      rotation: rotation.clone(),
      scale: scale.clone(),
      color: '#1a75ff',
      roughness: 0.5,
      metalness: 0.2
    };
    
    this.objects.set(id, objectData);
    this.renderUI();
  }

  removeObject(id: string) {
    const objectData = this.objects.get(id);
    if (objectData) {
      this.sceneManager.removeObject(id);
      this.objects.delete(id);
      
      if (objectData.isCustomModel && objectData.modelUrl) {
        URL.revokeObjectURL(objectData.modelUrl);
      }
      
      this.renderUI();
    }
  }

  private updateObjectColor(id: string, color: string) {
    const object = this.sceneManager.getObject(id);
    const objectData = this.objects.get(id);
    
    if (object && objectData && object instanceof THREE.Mesh) {
      const material = object.material as THREE.MeshStandardMaterial;
      material.color.set(color);
      objectData.color = color;
    }
  }

  private updateObjectRoughness(id: string, roughness: number) {
    const object = this.sceneManager.getObject(id);
    const objectData = this.objects.get(id);
    
    if (object && objectData && object instanceof THREE.Mesh) {
      const material = object.material as THREE.MeshStandardMaterial;
      material.roughness = roughness;
      objectData.roughness = roughness;
    }
  }

  private updateObjectMetalness(id: string, metalness: number) {
    const object = this.sceneManager.getObject(id);
    const objectData = this.objects.get(id);
    
    if (object && objectData && object instanceof THREE.Mesh) {
      const material = object.material as THREE.MeshStandardMaterial;
      material.metalness = metalness;
      objectData.metalness = metalness;
    }
  }

  private updateObjectPosition(id: string, position: THREE.Vector3) {
    const object = this.sceneManager.getObject(id);
    const objectData = this.objects.get(id);
    
    if (object && objectData) {
      object.position.copy(position);
      objectData.position = position.clone();
    }
  }

  private updateObjectRotation(id: string, rotation: THREE.Euler) {
    const object = this.sceneManager.getObject(id);
    const objectData = this.objects.get(id);
    
    if (object && objectData) {
      object.rotation.copy(rotation);
      objectData.rotation = rotation.clone();
    }
  }

  private updateObjectScale(id: string, scale: THREE.Vector3) {
    const object = this.sceneManager.getObject(id);
    const objectData = this.objects.get(id);
    
    if (object && objectData) {
      object.scale.copy(scale);
      objectData.scale = scale.clone();
    }
  }

  private handleModelUpload(file: File) {
    const objectURL = URL.createObjectURL(file);
    this.modelCounter++;
    const id = `model_${this.modelCounter}`;
    
    // Show loading indicator
    const loadingText = document.createElement('div');
    loadingText.textContent = `Loading model ${file.name}...`;
    loadingText.style.padding = '10px';
    loadingText.style.backgroundColor = '#f8f9fa';
    loadingText.style.margin = '10px 0';
    loadingText.style.borderRadius = '4px';
    loadingText.id = `loading-${id}`;
    document.getElementById('objects-container')?.prepend(loadingText);
    
    this.gltfLoader.load(
      objectURL,
      (gltf: GLTF) => {
        // Remove loading indicator
        const loadingElement = document.getElementById(`loading-${id}`);
        if (loadingElement) loadingElement.remove();
        
        const model = gltf.scene;
        
        // Center the model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        // Set position to center at origin
        model.position.x = -center.x;
        model.position.y = -center.y + size.y / 2;
        model.position.z = -center.z;
        
        // Scale model to reasonable size if needed
        const maxDimension = Math.max(size.x, size.y, size.z);
        if (maxDimension > 5) {
          const scale = 5 / maxDimension;
          model.scale.set(scale, scale, scale);
        }
        
        // Make sure the model casts and receives shadows
        model.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        // Add to scene
        this.sceneManager.addObject(id, model);
        
        // Add to object tracker
        const objectData: ObjectData = {
          id,
          type: 'custom_model',
          position: new THREE.Vector3(0, 0, 0),
          rotation: new THREE.Euler(0, 0, 0),
          scale: new THREE.Vector3(1, 1, 1),
          color: '#ffffff', // Not used for GLTF models
          roughness: 0.5,   // Not used for GLTF models
          metalness: 0.2,   // Not used for GLTF models
          isCustomModel: true,
          modelUrl: objectURL
        };
        
        this.objects.set(id, objectData);
        this.renderUI();
      },
      (xhr: ProgressEvent) => {
        const loadingElement = document.getElementById(`loading-${id}`);
        if (loadingElement) {
          const percentComplete = xhr.loaded / xhr.total * 100;
          loadingElement.textContent = `Loading model ${file.name}... ${Math.round(percentComplete)}%`;
        }
      },
      (error: ErrorEvent) => {
        console.error('Error loading model:', error);
        const loadingElement = document.getElementById(`loading-${id}`);
        if (loadingElement) {
          loadingElement.textContent = `Error loading model: ${error.message}`;
          loadingElement.style.color = 'red';
          
          // Remove error message after 5 seconds
          setTimeout(() => {
            loadingElement.remove();
          }, 5000);
        }
      }
    );
  }
} 