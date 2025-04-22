export type Dimension = 2 | 3;
export type SimulationSettings = {
  mass: number,
  target_density: number,
  pressure_multiplier: number,
  radius_of_influence: number,
  gravity: number,
  viscosity: number,
  is_paused: boolean,
  is_focused: boolean,
}

export const default_settings: SimulationSettings = {
  mass: 1.0,
  target_density: 5.0,
  pressure_multiplier: 1.0,
  radius_of_influence: 1.0,
  gravity: 0.0,
  viscosity: 0.10,
  is_paused: false,
  is_focused: true,
}

export const NUMBER_OF_SUBWORKERS = 6;
export const NUMBER_OF_SECTIONS_PER_DIMENSION = 10;
export const NUMBER_OF_SECTIONS = Math.pow(NUMBER_OF_SECTIONS_PER_DIMENSION, 3);
export const WORLD_SIZE = [10.0, 10.0, 10.0];

export type SectionIndex = {[key: number]: Array<number> };
export type SharedMemoryMap = { [key: string]: SharedArrayBuffer }