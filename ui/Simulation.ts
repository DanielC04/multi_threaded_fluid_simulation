import { setup_simulation } from "./util";
import { dimension } from "./types";


export class Simulation {
  scene: THREE.Scene;
  renderer: THREE.Renderer;
  camera: THREE.PerspectiveCamera;
  last_time: DOMHighResTimeStamp = 0.0;
  frame_count: number = 0;
  is_focused: boolean = true;
  dimension: dimension;

  constructor(dimension: dimension) {
    let { scene, renderer, camera } = setup_simulation(dimension);
    this.scene = scene;
    this.renderer = renderer;
    this.camera = camera;
    this.dimension = dimension;
    window.requestAnimationFrame(timestamp => this.animate(timestamp));
  }

  animate(timestamp: DOMHighResTimeStamp) {
    // console.log(`animate ${this.dimension}`);
    // this.simulation_settings?.stats.begin();
    let time_elapsed = (timestamp - this.last_time) / 1000.;
    if (time_elapsed > 0.15) {
      time_elapsed = 1. / 60;
    }
    this.frame_count++;
    this.last_time = timestamp;

    // if (this.simulation_settings.should_draw_frame()) this.draw_frame();
    // draw frame
    this.renderer.render(this.scene, this.camera);
    window.requestAnimationFrame(timestamp => this.animate(timestamp));
    // this.simulation_settings?.stats.end();
  }
}
