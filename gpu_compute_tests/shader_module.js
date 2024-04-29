const createShaderModule = device => device.createShaderModule({
  label: 'doubling compute module',
  code: `
      // struct Particle {
      //   pos: vec3f,
      //   vel: vec3f,
      //   density: f32,
      //   mass: f32,
      // };
      //

      @group(0) @binding(0) var<storage, read_write> positions: array<vec4f>;
      @group(0) @binding(1) var<storage, read_write> velocities: array<vec4f>;

      @compute @workgroup_size(1) fn moveParticles(
        @builtin(global_invocation_id) id: vec3<u32>
      ) {
        let i = id.x * 4 * 4 + id.y * 4 + id.z;
        positions[i] = positions[i] + velocities[i];
      }
    `,
});


export { createShaderModule };
