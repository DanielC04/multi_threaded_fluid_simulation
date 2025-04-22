import { SectionSupervisor } from "./SectionSupervisor";

let section_supervisor: SectionSupervisor | undefined;

onmessage = function(e) {
  const message = e.data;
  if (message.type === "init") section_supervisor = new SectionSupervisor(message.id, message.number_of_particles, message.dimension, message.shared_memory);
  else if (message.type === "update_settings") section_supervisor.simulation_settings = message.settings;
  else if (message.type === "step") section_supervisor.step(message.dt);
  else if (message.type === "update_particles_in_sections") section_supervisor.sections = message.sections;
  else console.error("Subworker received unimplemented message ", message);
}