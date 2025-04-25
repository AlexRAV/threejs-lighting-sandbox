import { SceneManager } from './utils/SceneManager.js';
import { LightController } from './components/LightController/index.js';
import { ObjectController } from './components/ObjectController/index.js';
import { EnvironmentController } from './components/EnvironmentController/index.js';

class App {
  private sceneManager: SceneManager;
  private lightController: LightController;
  private objectController: ObjectController;
  private environmentController: EnvironmentController;

  constructor() {
    this.sceneManager = new SceneManager('canvas-container');
    this.lightController = new LightController('light-controls', this.sceneManager);
    this.environmentController = new EnvironmentController('environment-controls', this.sceneManager);
    this.objectController = new ObjectController('object-controls', this.sceneManager);
    
    this.init();
  }

  private init() {
    this.sceneManager.init();
    this.lightController.init();
    this.environmentController.init();
    this.objectController.init();
    this.animate();
  }

  private animate() {
    requestAnimationFrame(() => this.animate());
    this.sceneManager.update();
  }
}

const app = new App(); 