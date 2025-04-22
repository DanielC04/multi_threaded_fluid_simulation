import { Dimension, NUMBER_OF_SUBWORKERS, SectionIndex, SharedMemoryMap, SimulationSettings } from "../types";
import { AbstractSimulation } from "./AbstractSimulation";
import { apply_gravity, keep_particles_in_bound, move_particles, update_densities } from "./physics";
import { NUMBER_OF_SECTIONS, NUMBER_OF_SECTIONS_PER_DIMENSION } from "../types";

export class SectionSupervisor extends AbstractSimulation{
	supervisor_id: number
	sections: SectionIndex = {};

	constructor(supervisor_id: number, number_of_particles: number, dimensions: Dimension, shared_memory: SharedMemoryMap) {
		super(number_of_particles, dimensions, shared_memory);
		this.supervisor_id = supervisor_id
	}

	step(dt){
		for (let section_id = 0; section_id < NUMBER_OF_SECTIONS; section_id ++){
			if((section_id % NUMBER_OF_SUBWORKERS) != this.supervisor_id) continue;
			const particles = this.sections[section_id];
			if (!particles || particles.length == 0) continue;
			const positions = this.views["positions"] as Float32Array;
			const velocities = this.views["velocities"] as Float32Array;
			update_densities(this.sections, section_id, positions, this.views["densities"] as Float32Array, this.simulation_settings);
			apply_gravity(particles, velocities, this.simulation_settings, dt);
			// update_pressure_forces(this.positions, this.densities, this.pressure_forces, this.simulation_settings);
			// apply_pressure_forces(dt, this.velocities, this.pressure_forces, this.densities);
			move_particles(particles, positions, velocities, dt);
			keep_particles_in_bound(particles, positions, velocities);
		}
	}
}