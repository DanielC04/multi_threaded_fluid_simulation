import { format as f, kernel, lifetime } from 'webglc'

let fparticle = {
  position: f.vec3,
  velocity: f.vec3,
}

let generate = kernel(f.null, fparticle)`
  void map(int i) {
    write_position(vec3(random(), random(), random()));
    write_velocity(vec3(random(), random(), random()));
  }`

let move = kernel(fparticle, fparticle)`
  void map(int i) {
    vec3 p = read_position(i);
    vec3 v = read_velocity(i);
    write_position(p + v);
    write_velocity(v);
  }`

let getTotalPosition = kernel(fparticle, f.vec3)`
  const identity_position = vec3(0., 0., 0.);
  void reduce(int i) {
    vec3 a = read_position(i);
    vec3 b = read_position(i + 1);
    vec3 c = read_position(i + 2);
    vec3 d = read_position(i + 3);
    write(a + b + c + d);
  }`

console.time("position calc")
let positionAverage = await lifetime(async ({ range }) => {
  let bparticle = await range(10_000_000).map(generate)
  bparticle = await range(bparticle.length).map(move, bparticle)
  let bpositionTotal = await range(bparticle.length).reduce(getTotalPosition, bparticle)
  let [positionTotal] = await bpositionTotal.read()
  let positionAverage = {
    x: positionTotal[0] / bparticle.length,
    y: positionTotal[1] / bparticle.length,
    z: positionTotal[2] / bparticle.length,
  }
  return positionAverage
})()

console.log(positionAverage)
console.timeEnd("position calc")
