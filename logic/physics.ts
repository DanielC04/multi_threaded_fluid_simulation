import { SectionIndex, SimulationSettings } from "../types";
import { dist, precalculate_neighbouring_sections_lookup_table, smoothing_kernel_spiky, smoothing_kernel_spiky_derivative } from "./math_helpers";

const COLISSION_DAMPING_FACTOR = 0.9;

const neighbouring_sections_lookup_table = precalculate_neighbouring_sections_lookup_table()

export function move_particles(particles: Array<number>, positions: Float32Array, velocities: Float32Array, dt: number) {
  for (let particle_id of particles){
    positions[3*particle_id] += velocities[3*particle_id] * dt;
    positions[3*particle_id + 1] += velocities[3*particle_id + 1] * dt;
    positions[3*particle_id + 2] += velocities[3*particle_id + 2] * dt;
  }
}

export function apply_gravity(particles: Array<number>, velocities: Float32Array, simulation_settings: SimulationSettings, dt: number) {
  for (let particle_id of particles) velocities[3 * particle_id + 1] += simulation_settings.gravity * dt;
}

export function keep_particles_in_bound(particles: Array<number>, positions: Float32Array, velocities: Float32Array) {
  for (let particle_id of particles) {
    for (let dimensions = 0; dimensions < 3; dimensions++) {
      // convention: all particles have to stay between 0.0 and 1.0
      const pos = positions[3 * particle_id + dimensions]
      if (pos > 1.0 || pos <= 0.0) {
        const index = 3 * particle_id + dimensions
        positions[index] = Math.max(Math.min(pos, 1.0), 0.0);
        velocities[index] *= -1.0 * COLISSION_DAMPING_FACTOR;
      }
    }
  }
}

export function update_densities(sections: SectionIndex, section_id: number, positions: Float32Array, densities: Float32Array, simulation_settings: SimulationSettings) {
  const neighbouring_sections = neighbouring_sections_lookup_table[section_id];
  for(let particle_index of sections[section_id]){
    let density = 0.0;
    for(let neighbouring_section of neighbouring_sections){
      for(let other_particle_index of sections[neighbouring_section]){
        const distance = dist(positions[3 * particle_index], positions[3 * particle_index + 1], positions[3 * particle_index + 2], positions[3 * other_particle_index], positions[3 * other_particle_index + 1], positions[3 * other_particle_index + 2]);
        // console.log(distance)
        density += smoothing_kernel_spiky(distance, simulation_settings.radius_of_influence);
      }
    }
    // if (density > 0.0)
    //   console.log(density * simulation_settings.mass)
    densities[particle_index] = density * simulation_settings.mass;
  }
}

export function update_pressure_forces(positions: Float32Array, densities: Float32Array, pressure_forces: Float32Array, simulation_settings: SimulationSettings) {
  const n = densities.length;
  for (let i = 0; i < n; i++) {
    let pressure_force = [0.0, 0.0, 0.0];
    for (let j = 0; j < n; j++) {
      if (i == j) continue;
      const distance = dist(positions[3 * i], positions[3 * i + 1], positions[3 * i + 2], positions[3 * j], positions[3 * j + 1], positions[3 * j + 2]);
      const pressure_1 = density_to_pressure(densities[i], simulation_settings);
      const pressure_2 = density_to_pressure(densities[j], simulation_settings);
      const average_pressure = (pressure_1 + pressure_2) / 2.0;
      for (let dimensions= 0; dimensions< 3; dimensions++) {
        if (distance == 0) continue;
        const direction = (positions[3 * j + dimensions] - positions[3 * i + dimensions]) / distance;
        pressure_force[dimensions] += average_pressure / densities[i] * direction * smoothing_kernel_spiky_derivative(distance, simulation_settings.radius_of_influence);
      }
    }
    // set the calculated forces
    for (let dimensions = 0; dimensions < 3; dimensions++)
      pressure_forces[3 * i + dimensions] = pressure_force[dimensions] * simulation_settings.mass;
  }
}

function density_to_pressure(density: number, simulation_settings: SimulationSettings) {
  return simulation_settings.pressure_multiplier * (density - simulation_settings.target_density);
}

export function apply_pressure_forces(dt: number, velocities: Float32Array, pressure_forces: Float32Array, densities: Float32Array) {
  for (let i = 0; i < densities.length; i++) {
    if (densities[i] == 0) continue;
    for (let dimensions= 0; dimensions< 3; dimensions++) {
      velocities[3 * i + dimensions] = Math.min(10., velocities[3 * i + dimensions] + pressure_forces[3 * i + dimensions] / densities[i] * dt);
    }
  }
}
