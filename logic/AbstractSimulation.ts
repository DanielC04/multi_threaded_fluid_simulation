// abstracts away the standard procedures of storing and updating common variables shared of Simulationlogic and SectionSupervisor

import { default_settings, Dimension, SharedMemoryMap, SimulationSettings } from "../types";

type FloatOrIntArray = Float32Array | Uint32Array;

// e.g. both need access to dimensions, number_of_particles, shared_memory buffers and memory views
export abstract class AbstractSimulation{
  number_of_particles: number;
  dimensions: Dimension;
  simulation_settings: SimulationSettings;
  shared_memory: SharedMemoryMap;
  views: { [key: string]: FloatOrIntArray };

  constructor(number_of_particles: number, dimensions: Dimension, shared_memory: SharedMemoryMap){
    this.number_of_particles = number_of_particles;
    this.dimensions = dimensions;
    this.simulation_settings = default_settings;
    this.setup_arrays_and_views(shared_memory)
    this.reset();
  }

  setup_arrays_and_views(shared_memory: SharedMemoryMap) {
    this.shared_memory = {};
    this.shared_memory["positions"] = shared_memory["positions"];
    this.shared_memory["colors"] = shared_memory["colors"];
    if (!this.shared_memory["densities"]){
        this.shared_memory["densities"] = new SharedArrayBuffer(this.number_of_particles * 4);
        this.shared_memory["velocities"] = new SharedArrayBuffer(this.number_of_particles * this.dimensions * 4);
        this.shared_memory["pressure_forces"] = new SharedArrayBuffer(this.number_of_particles * this.dimensions * 4);
    }
    this.views = {};
    this.views["positions"] = new Float32Array(this.shared_memory["positions"]);
    this.views["colors"] = new Uint32Array(this.shared_memory["colors"]);
    this.views["densities"] = new Float32Array(this.shared_memory["density"]);
    this.views["velocities"] = new Float32Array(this.shared_memory["velocities"]);
    this.views["pressure_forces"] = new Float32Array(this.shared_memory["pressure_forces"]);
  }

  reset() {
    const n = this.number_of_particles;
    this.setup_arrays_and_views(this.shared_memory);
    // initialize positions in cube
    const cube_size = Math.ceil(Math.pow(n, 1. / this.dimensions));
    const dist_between_particles = 1.0 / cube_size;
    for (let i = 0; i < n; i++) {
      let x = i % cube_size;
      let y = (i - x) / cube_size % cube_size;
      let z = (i - x - y * cube_size) / (cube_size * cube_size) % cube_size;
      this.views["positions"][i * 3] = x * dist_between_particles;
      this.views["positions"][i * 3 + 1] = this.dimensions === 3 ? z * dist_between_particles : 0.0;
      this.views["positions"][i * 3 + 2] = y * dist_between_particles;
    }
  }
}