import { SimulationLogic } from "./Simulationlogic";

let simulation: SimulationLogic | undefined;

onmessage = function(e) {
  const message = e.data;
  if (message.type === "init") simulation = new SimulationLogic(message.number_of_particles, message.dimension, message.shared_memory);
  else if (message.type === "update_settings") simulation.update_settings(message.settings);
  else if (message.type === "step") simulation.step(1. / 60);
  else if (message.type === "kill") if (simulation) simulation.destroy_subworkers_and_self();
}
