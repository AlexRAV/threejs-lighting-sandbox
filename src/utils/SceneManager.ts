import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class SceneManager {
  private scene: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private lights: Map<string, THREE.Light>;
  private objects: Map<string, THREE.Object3D>;
  private container: HTMLElement;

  constructor(containerId: string) {
    this.container = document.getElementById(containerId) as HTMLElement;
    if (!this.container) {
      throw new Error(`Container with ID ${containerId} not found`);
    }

    this.scene = new THREE.Scene();
    this.lights = new Map();
    this.objects = new Map();
    
    this.setupCamera();
    this.setupRenderer();
    this.setupControls();
  }

  init() {
    this.setupGrid();
    this.setupDefaultLighting();
    this.setupDefaultObjects();
    window.addEventListener('resize', () => this.handleResize());
    this.handleResize();
  }

  private setupCamera() {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    this.camera.position.set(5, 5, 5);
    this.camera.lookAt(0, 0, 0);
  }

  private setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);
  }

  private setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
  }

  private setupGrid() {
    const gridHelper = new THREE.GridHelper(20, 20);
    this.scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(5);
    this.scene.add(axesHelper);
  }

  private setupDefaultLighting() {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.addLight('ambient_default', ambientLight);
  }

  private setupDefaultObjects() {
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const boxMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.5,
      metalness: 0.5
    });
    const box = new THREE.Mesh(boxGeometry, boxMaterial);
    box.castShadow = true;
    box.receiveShadow = true;
    box.position.set(0, 0.5, 0);
    this.addObject('box_default', box);

    const planeGeometry = new THREE.PlaneGeometry(20, 20);
    const planeMaterial = new THREE.MeshStandardMaterial({
      color: 0xaaaaaa,
      roughness: 0.8,
      metalness: 0.2,
      side: THREE.DoubleSide
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    this.addObject('plane_default', plane);
  }

  handleResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  update() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  addLight(id: string, light: THREE.Light) {
    this.lights.set(id, light);
    this.scene.add(light);
    return light;
  }

  removeLight(id: string) {
    const light = this.lights.get(id);
    if (light) {
      this.scene.remove(light);
      this.lights.delete(id);
      return true;
    }
    return false;
  }

  getLight(id: string) {
    return this.lights.get(id);
  }

  getLights() {
    return this.lights;
  }

  addObject(id: string, object: THREE.Object3D) {
    this.objects.set(id, object);
    this.scene.add(object);
    return object;
  }

  removeObject(id: string) {
    const object = this.objects.get(id);
    if (object) {
      this.scene.remove(object);
      this.objects.delete(id);
      return true;
    }
    return false;
  }

  getObject(id: string) {
    return this.objects.get(id);
  }

  getObjects() {
    return this.objects;
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }
} 