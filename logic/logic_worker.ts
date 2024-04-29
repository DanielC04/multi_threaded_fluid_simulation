import { Simulationlogic } from "./Simulationlogic";

let simulation: Simulationlogic | undefined;

onmessage = function(e) {
  const message = e.data;
  if (message.type === "init") {
    simulation = new Simulationlogic(message.number_of_particles, message.dimension, message.shared_position_memory, message.shared_color_memory);
  } else if (message.type === "update_settings") {
    simulation.simulation_settings = message.settings;
  } else if (message.type === "step") {
    simulation.step(1. / 60);
  }
}
