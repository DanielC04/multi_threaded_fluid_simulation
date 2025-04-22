import { setup_simulation } from "./util";
import * as THREE from "three";
import { Dimension, WORLD_SIZE  } from "../types";
import { SettingUI } from "./SettingUI";


export class Simulation {
  scene: THREE.Scene;
  renderer: THREE.Renderer;
  camera: THREE.PerspectiveCamera;
  last_time: DOMHighResTimeStamp = 0.0;
  frame_count: number = 0;
  dimensions: Dimension;
  particle_mesh: THREE.InstancedMesh;
  matrix: THREE.Matrix4 = new THREE.Matrix4();
  translation_vector: THREE.Vector3 = new THREE.Vector3();
  sphere_color: THREE.Color;
  number_of_particles: number = 1000;
  logic_worker: Worker;
  settingUI: SettingUI;
  shared_position_memory: SharedArrayBuffer;
  shared_position_view: Float32Array;
  shared_color_memory: SharedArrayBuffer;
  shared_color_view: Uint32Array;

  constructor(dimensions: Dimension, number_of_particles: number = 1000) {
    this.number_of_particles = number_of_particles;
    this.dimensions = dimensions;
    this.shared_position_memory = new SharedArrayBuffer(this.number_of_particles * this.dimensions * 4);
    this.shared_position_view = new Float32Array(this.shared_position_memory);
    this.shared_color_memory = new SharedArrayBuffer(this.number_of_particles * 4);
    this.shared_color_view = new Uint32Array(this.shared_color_memory);

    // setup logic worker
    this.logic_worker = new Worker("./logic/logic_worker.ts", { type: "module" });
    this.logic_worker.postMessage(
      {
        type: "init",
        dimension: this.dimensions,
        number_of_particles: this.number_of_particles,
        shared_memory: {
          "positions": this.shared_position_memory,
          "colors": this.shared_color_memory
        }
      });

    // setup the THREEJS Scene
    let { scene, renderer, camera } = setup_simulation(dimensions);
    this.scene = scene;
    this.renderer = renderer;
    this.camera = camera;

    // setup particle geometry
    const particle_geometry = new THREE.SphereGeometry(0.03, 7, 7);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.sphere_color = new THREE.Color();
    this.particle_mesh = new THREE.InstancedMesh(particle_geometry, material, this.number_of_particles);
    this.scene.add(this.particle_mesh);

    // make sure all workers are destroyed before reload
    // window.addEventListener('beforeunload', () => {
    //   this.logic_worker.postMessage({ "type": "kill" })
    // });

    // setup controls to change simulation settings
    this.settingUI = new SettingUI(this.logic_worker, this.dimensions);

    // start animating
    window.requestAnimationFrame(timestamp => this.animate(timestamp));
  }

  animate(timestamp: DOMHighResTimeStamp) {
    this.settingUI.stats.begin();
    let time_elapsed = (timestamp - this.last_time) / 1000.;
    if (time_elapsed > 0.15) {
      time_elapsed = 1. / 60;
    }
    this.frame_count++;
    this.last_time = timestamp;

    // if (this.simulation_settings.should_draw_frame()) this.draw_frame();
    // draw frame
    if (this.settingUI.settings.is_focused) {
      this.renderer.render(this.scene, this.camera);
      // update positions and colors
      this.update_positions_from_shared_memory();
      this.update_colors_from_shared_memory();
    }
    window.requestAnimationFrame(timestamp => this.animate(timestamp));
    this.settingUI.stats.end();
  }

  update_positions_from_shared_memory() {
    // console.log(view)
    for (let i = 0; i < this.number_of_particles; i++) {
      this.particle_mesh.getMatrixAt(i, this.matrix);
      this.translation_vector.x = (this.shared_position_view[i * 3] - 0.5) * WORLD_SIZE[0];
      this.translation_vector.y = (this.shared_position_view[i * 3 + 1] - 0.5) * WORLD_SIZE[1];
      this.translation_vector.z = (this.shared_position_view[i * 3 + 2] - 0.5) * WORLD_SIZE[2];

      this.matrix.makeTranslation(this.translation_vector);

      this.particle_mesh.setMatrixAt(i, this.matrix);
    }
    this.particle_mesh.instanceMatrix.needsUpdate = true;
  }

  update_colors_from_shared_memory() {
    for (let i = 0; i < this.shared_color_view.length; i++) {
      this.particle_mesh.setColorAt(i, this.sphere_color.setHex(this.shared_color_view[i]));
    }
    this.particle_mesh.instanceColor.needsUpdate = true;
  }
}
