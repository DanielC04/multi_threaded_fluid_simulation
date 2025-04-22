import { Dimension, NUMBER_OF_SECTIONS, NUMBER_OF_SECTIONS_PER_DIMENSION, NUMBER_OF_SUBWORKERS, SharedMemoryMap } from "../types";
import { AbstractSimulation } from "./AbstractSimulation";
import chroma from "chroma-js";
import { coordinates_to_box_id } from "./math_helpers";

const OPTIMAL_TIME_PER_SIMULATION_STEP = 1000 / 60.;
const color_grad = chroma.scale(['blue', 'green', 'yellow', 'red']);

const COLORS = [0x001969,0xff0000,0xffff00,0x00ff00,0x00ffff,0x0000ff,0x000fff,0xffff77,0x507a76];

export class SimulationLogic extends AbstractSimulation {
  last_time: number;
  frame_count: number = 0;
  last_fps_time: number = 0.0;
  subworkers: Array<Worker>;

  constructor(number_of_particles: number, dimensions: Dimension, shared_memory: SharedMemoryMap) {
		super(number_of_particles, dimensions, shared_memory);
    this.last_time = performance.now();
    this.create_subworkers();
    this.simulation_loop();
  }

  simulation_loop() {
    const new_time = performance.now();
    let dt = (new_time - this.last_time) / 1000.;
    if (dt > 0.35 || dt < 0.0001) {
      dt = 1. / 60;
    }
    this.last_time = new_time;
    this.frame_count++;
    if (this.frame_count % 500 == 0) {
      console.log("current fps in simulation logic: ", 500.0 / (new_time - this.last_fps_time) * 1000);
      this.last_fps_time = new_time;
    }
    this.step(dt)

    const time_left_for_this_step = Math.max(0, OPTIMAL_TIME_PER_SIMULATION_STEP - dt * 1000);
		// make sure the queue for simulation steps doesn't get too long (if we can't get even near the optimal fps)
    setTimeout(() => this.simulation_loop(), time_left_for_this_step);
  }

  step(dt: number) {
		if (this.frame_count % 100 == 0){
      // for(let i = 0; i < this.number_of_particles; i ++) console.log(this.views["positions"][i])
		}
		// if(this.frame_count % 100 == 0 && !this.simulation_settings.is_paused){
			this.sort_particles_into_supervision_sections();
		// }
    // actually calculate all the physics stuff of the step
		this.physics_step_in_subworkers(dt);

		// update positions/colors in UI, but only every nth-step:w
		if (this.frame_count % 10 == 0) {
			this.update_colors();
		}
  }



	physics_step_in_subworkers(dt: number){
    if (this.simulation_settings.is_paused) return;
		for (let subworker of this.subworkers) subworker.postMessage({ type: "step", dt: dt });
	}

	sort_particles_into_supervision_sections(){
		// at position i of the following array there are all the supervised boxes of the i-th box with their particles
		const all_sections = [];
		for(let i = 0; i < NUMBER_OF_SECTIONS; i++) all_sections.push([]);

		for(let particle_id = 0; particle_id < this.number_of_particles; particle_id++){
      const box_id = this.get_box_id_of_particle(particle_id);
      if (box_id < 0) console.log(box_id)
      // try{
        all_sections[box_id].push(particle_id);
      // } catch (error) {
      //   console.error(`Error while sorting particle ${particle_id} into section ${box_id}:`, error);
      // }
		}	

		for (let worker_id = 0; worker_id < NUMBER_OF_SUBWORKERS; worker_id ++){
			this.subworkers[worker_id].postMessage({
				type: "update_particles_in_sections",
				sections: all_sections
			});
		}
	}

  get_box_id_of_particle(particle_id: number){
      // using 0.9999 as maximum here to make sure x * NUMBERS_OF_SECTIONS_PER_DIMENSION is never equal to NUMBERS_OF_SECTIONS_PER_DIMENSION, but rather one smaller
      let x = Math.min(0.9999, Math.max(0.0, this.views["positions"][3*particle_id]));
      x = Math.floor(x * NUMBER_OF_SECTIONS_PER_DIMENSION);
      let y = Math.min(0.9999, Math.max(0.0, this.views["positions"][3*particle_id + 1]));
      y = Math.floor(y * NUMBER_OF_SECTIONS_PER_DIMENSION)
			let z = 0;
			if (this.dimensions == 3){
        z = Math.min(0.9999, Math.max(0.0, this.views["positions"][3*particle_id + 2]))
        z = Math.floor(z * NUMBER_OF_SECTIONS_PER_DIMENSION);
      }

			const box_id = coordinates_to_box_id(x, y, z);;
      if (isNaN(box_id) || isNaN(x) || isNaN(y) || isNaN(z)){
        // console.log(particle_id, box_id, x, y, z);
        return 0;
      }
      return box_id;
  }

  create_subworkers() {
    // setup logic worker
    this.subworkers = [];

    for (let i = 0; i < NUMBER_OF_SUBWORKERS; i++) {
      this.subworkers[i] = new Worker("./subworker.ts", { type: "module" });
      this.subworkers[i].postMessage(
        {
          type: "init",
          id: i,
          dimension: this.dimensions,
          number_of_particles: this.number_of_particles,
          shared_memory: this.shared_memory
        });
    }
  }

	destroy_subworkers_and_self() {
		for(let worker of this.subworkers) worker.terminate();
		self.close();
	}

  update_colors() {
    const min_density = 0.0;
    const max_density = 10.0;
    for (let i = 0; i < this.number_of_particles; i++) {
      const density = this.views["densities"][i];
      const normed = (density - min_density) / max_density;
      const [r, g, b, _] = color_grad(normed)._rgb;
      // const box_id = this.get_box_id_of_particle(i);
      // console.log(box_id)
      // this.views["colors"][i] = COLORS[box_id % NUMBER_OF_SUBWORKERS];
      this.views["colors"][i] = (r << 16) | (g << 8) | b;
    }
  }

	update_settings(settings: any) {
		this.simulation_settings = settings;
		for(let worker of this.subworkers) worker.postMessage({ "type": "update_settings", settings: settings})
	}
}
