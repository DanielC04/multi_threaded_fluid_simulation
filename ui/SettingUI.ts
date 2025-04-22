import { GUI } from "dat.gui";
import Stats from 'three/examples/jsm/libs/stats.module'
import { default_settings, Dimension, SimulationSettings } from "../types";

export class SettingUI {
  settings: SimulationSettings;
  gui: GUI;
  stats: Stats;
  dimensions: Dimension;
  logic_worker: Worker;

  constructor(logic_worker: Worker, dimensions: Dimension) {
    this.logic_worker = logic_worker;
    this.dimensions = dimensions;
    this.settings = { ...default_settings };
    this.setup_key_inputs();
    this.create_debug_UI();
  }


  setup_key_inputs() {
    window.addEventListener("keydown", (e) => {
      if (e.key === " " || e.code === "Space") {
        if (!this.settings.is_focused) return;
        this.settings.is_paused = !this.settings.is_paused;
        this.update_settings_in_worker();
      } else if (e.key === "s") {
        this.logic_worker.postMessage({ type: "step" })
      } else if (e.key == "D" || e.code === "KeyD") {
        // this.simulation?.logic_sim?.debug()
      }
    });
  }

  create_debug_UI() {
    this.gui = new GUI({ autoPlace: false })
    // get domElemnt where gui should be placed
    const container = document.body.querySelector(`.controls`);
    container && container.appendChild(this.gui.domElement);
    const simulationFolder = this.gui.addFolder(`Simulation ${this.dimensions}D`);
    simulationFolder.add(this.settings, 'is_paused').name('Pause simulation').listen().onChange(() => this.update_settings_in_worker())
    simulationFolder.add(this.settings, 'mass', 0.1, 10.0, 0.1).name('Particle mass').listen().onChange(() => this.update_settings_in_worker())
    simulationFolder.add(this.settings, 'target_density', 0.1, 100.0).name('Target density').listen().onChange(() => this.update_settings_in_worker())
    simulationFolder.add(this.settings, 'pressure_multiplier', 0.0, 40.0).step(0.1).name('pressure mult').listen().onChange(() => this.update_settings_in_worker())
    simulationFolder.add(this.settings, 'radius_of_influence', 0.2, 1.2).step(0.05).name('Radius of infl').listen().onChange(() => this.update_settings_in_worker())
    simulationFolder.add(this.settings, 'gravity', -10.0, 10.0).name('Gravity').onChange(() => this.update_settings_in_worker())
    simulationFolder.add(this.settings, 'viscosity', 0.0, 1.0).step(0.05).name('Viscosity strength').onChange(() => this.update_settings_in_worker())
    simulationFolder.open()

    this.stats = new Stats()
    this.stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(this.stats.dom)
  }
  set_focus(is_focused: boolean) {
    this.settings.is_focused = is_focused;
    this.update_settings_in_worker();
  }
  update_settings_in_worker() {
    this.logic_worker.postMessage({ type: "update_settings", settings: this.settings });
  }
}
