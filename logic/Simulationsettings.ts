import { GUI } from 'dat.gui'
import { SimulationLogic } from './Simulationlogic';

export class Simulationsettings {
  mass: number = 1.0;
  target_density: number = 5.0;
  pressure_multiplier: number = 1.0;
  radius_of_influence: number = 1.0;
  gravity: number = 0.0;
  viscosity: number = 0.10;
  is_paused: boolean = false;
  is_focused: boolean = false;
  gui: GUI;
  stats: Stats;
  simulationlogic: SimulationLogic;

  constructor(simulationlogic: SimulationLogic) {
    this.setup_key_inputs();
    this.create_debug_UI();
    this.simulationlogic = simulationlogic;
  }


  setup_key_inputs() {
    window.addEventListener("keydown", (e) => {
      if (e.key === " " || e.code === "Space") {
        this.is_paused = !this.is_paused;
      } else if (e.key === "s") {
        // this.simulation?.logic_sim?.step(1. / 60)
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
    const simulationFolder = this.gui.addFolder(`Simulation ${this.simulationlogic.dimensions}D`);
    simulationFolder.add(this, 'is_paused').name('Pause simulation').listen()
    simulationFolder.add(this, 'mass', 0.1, 10.0, 0.1).name('Particle mass').listen()
    simulationFolder.add(this, 'target_density', 0.1, 100.0).name('Target density').listen()
    simulationFolder.add(this, 'pressure_multiplier', 0.0, 40.0).step(0.1).name('pressure mult').listen()
    simulationFolder.add(this, 'radius_of_influence', 0.2, 1.2).step(0.05).name('Radius of infl').listen()
    simulationFolder.add(this, 'gravity', -10.0, 10.0).name('Gravity')
    simulationFolder.add(this, 'viscosity', 0.0, 1.0).step(0.05).name('Viscosity strength')
    simulationFolder.open()

    this.stats = new Stats()
    this.stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(this.stats.dom)
  }
}
