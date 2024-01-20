export type dimension = 2 | 3;
export type simulation_settings = {
  mass: number,
  target_density: number,
  pressure_multiplier: number,
  radius_of_influence: number,
  gravity: number,
  viscosity: number,
  is_paused: boolean,
  is_focused: boolean,
  simulation_bound: Array<number>,
}

export const default_settings: simulation_settings = {
  mass: 1.0,
  target_density: 5.0,
  pressure_multiplier: 15.0,
  radius_of_influence: 1.0,
  gravity: 0.0,
  viscosity: 0.10,
  is_paused: false,
  is_focused: true,
  simulation_bound: [5.0, 5.0, 5.0]
}
