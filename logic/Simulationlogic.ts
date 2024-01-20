import { default_settings, dimension, simulation_settings } from "../types";
import { apply_gravity, apply_pressure_forces, keep_particles_in_bound, move_particles, update_densities, update_pressure_forces } from "./physics";
import gradient from "gradient-color"

const OPTIMAL_TIME_PER_SIMULATION_STEP = 1000 / 60.;

export class Simulationlogic {
  number_of_particles: number;
  dimension: dimension;
  simulation_settings: simulation_settings;
  positions: Float32Array;
  predicted_positions: Float32Array;
  velocities: Float32Array;
  densities: Float32Array;
  pressure_forces: Float32Array;
  shared_position_view: Float32Array;
  shared_color_view: Uint32Array;
  last_time: number;
  frame_count: number = 0;

  constructor(number_of_particles: number, dimension: dimension, shared_position_memory: SharedArrayBuffer, shared_color_memory: SharedArrayBuffer) {
    this.number_of_particles = number_of_particles;
    this.dimension = dimension;
    this.simulation_settings = default_settings;
    this.shared_position_view = new Float32Array(shared_position_memory);
    this.shared_color_view = new Uint32Array(shared_color_memory);
    this.last_time = performance.now();
    this.reset();
    this.simulation_loop();
  }

  simulation_loop() {
    const new_time = performance.now();
    let dt = (new_time - this.last_time) / 1000.;
    if (dt > 0.15 || dt < 0.0001) {
      dt = 1. / 60;
    }
    this.last_time = new_time;
    this.frame_count++;
    if (this.frame_count % 100 == 0) console.log("current fps in simulation logic: ", 1.0 / dt)

    // actually calculate all the physics stuff of the step
    this.step(dt);

    const time_left_for_this_step = Math.max(0, OPTIMAL_TIME_PER_SIMULATION_STEP - dt);
    setTimeout(() => this.simulation_loop(), time_left_for_this_step);
  }

  step(dt: number) {
    if (this.simulation_settings.is_paused || !this.simulation_settings.is_focused) return;
    update_densities(this.positions, this.densities, this.simulation_settings);
    move_particles(dt, this.positions, this.velocities);
    keep_particles_in_bound(this.positions, this.velocities, this.simulation_settings.simulation_bound);
    apply_gravity(dt, this.velocities, this.simulation_settings);
    update_pressure_forces(this.positions, this.densities, this.pressure_forces, this.simulation_settings);
    apply_pressure_forces(dt, this.velocities, this.pressure_forces, this.densities);

    this.write_colors_to_shared_memory();
    this.write_positions_to_shared_memory();
  }

  reset() {
    const n = this.number_of_particles;
    this.positions = new Float32Array(n * this.dimension);
    // initialize positions in cube
    const dist_between_particles = 0.5;
    const cube_size = Math.ceil(Math.pow(n, 1. / this.dimension));
    for (let i = 0; i < n; i++) {
      let x = i % cube_size;
      let y = (i - x) / cube_size % cube_size;
      let z = (i - x - y * cube_size) / (cube_size * cube_size) % cube_size;
      this.positions[i * 3] = (x - cube_size / 2) * dist_between_particles;
      this.positions[i * 3 + 1] = this.dimension === 3 ? (z - cube_size / 2) * dist_between_particles : 0.0;
      this.positions[i * 3 + 2] = (y - cube_size / 2) * dist_between_particles;
    }
    this.predicted_positions = new Float32Array(n * this.dimension);
    this.velocities = new Float32Array(n * this.dimension);
    this.densities = new Float32Array(n);
    this.pressure_forces = new Float32Array(n * this.dimension);
    this.write_positions_to_shared_memory();
  }

  write_positions_to_shared_memory() {
    this.shared_position_view.set(this.positions);
  }

  densities_to_color_array() {
    // TODO: use proper color gradient here
    const colors = [];
    // const min_density = Math.min(...this.densities);
    // const max_density = Math.max(...this.densities);
    const min_density = 0.0;
    const max_density = 20.0;
    for (let density of this.densities) {
      const normed = (density - min_density) / max_density;
      let hex_value = 0
      // make red value
      hex_value += 256 * 256 * 256 * normed;
      // leave out green value and go to blue directly
      hex_value += 256 * (1 - normed); // a lot of blue for small values
      colors.push(hex_value);
    }
    return colors;
  }

  write_colors_to_shared_memory() {
    this.shared_color_view.set(this.densities_to_color_array());
  }
}
