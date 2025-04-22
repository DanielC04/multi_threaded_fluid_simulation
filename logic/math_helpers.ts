import { NUMBER_OF_SECTIONS, NUMBER_OF_SECTIONS_PER_DIMENSION } from "../types";

const directions = [
	[0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0],
	[0, 1, 1], [0, 1, -1], [0, -1, 1], [0, -1, -1],
	[1, 0, 1], [1, 0, -1], [-1, 0, 1], [-1, 0, -1],
	[1, 1, 0], [1, -1, 0], [-1, 1, 0], [-1, -1, 0],
	[1, 1, 1], [1, 1, -1], [1, -1, 1], [-1, 1, 1],
	[-1, -1, 1], [-1, 1, -1], [1, -1, -1], [-1, -1, -1]
]

export const precalculate_neighbouring_sections_lookup_table = () => {
	const result = [];
	for (let i = 0; i < NUMBER_OF_SECTIONS; i ++) result.push([])

	for(let x = 0; x < NUMBER_OF_SECTIONS_PER_DIMENSION; x ++) {
		for (let y = 0; y < NUMBER_OF_SECTIONS_PER_DIMENSION; y ++){
			for (let z = 0; z < NUMBER_OF_SECTIONS_PER_DIMENSION; z ++){
				const id = coordinates_to_box_id(x, y, z);
				for (let direction of directions){
					const newX = x + direction[0];
					if (newX < 0 || newX >= NUMBER_OF_SECTIONS_PER_DIMENSION) continue;
					const newY = x + direction[1];
					if (newY < 0 || newY >= NUMBER_OF_SECTIONS_PER_DIMENSION) continue;
					const newZ = x + direction[2];
					if (newZ < 0 || newZ >= NUMBER_OF_SECTIONS_PER_DIMENSION) continue;
					result[id].push(coordinates_to_box_id(newX, newY, newZ));
				}
			}
		}
	}
  return result;
}


export function smoothing_kernel_spiky(dist: number, radius_of_influence: number) {
  if (dist > radius_of_influence) return 0;
  const scale = 15.0 / (Math.PI * Math.pow(radius_of_influence, 6.0));
  return scale * Math.pow(radius_of_influence - dist, 3)
}

export function smoothing_kernel_spiky_derivative(dist: number, radius_of_influence: number) {
  if (dist > radius_of_influence) return 0.0;
  let scale = -45.0 / (Math.PI * Math.pow(radius_of_influence, 6));
  return scale * (radius_of_influence - dist) * (radius_of_influence - dist)
}

export function dist(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) {
  const a = x2 - x1;
  const b = y2 - y1;
  const c = z2 - z1;
  return Math.hypot(a * a, b * b, c * c);
}

export const coordinates_to_box_id = (x: number, y: number, z: number) => x + y * NUMBER_OF_SECTIONS_PER_DIMENSION + z * NUMBER_OF_SECTIONS_PER_DIMENSION * NUMBER_OF_SECTIONS_PER_DIMENSION;