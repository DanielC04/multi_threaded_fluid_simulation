async function main() {
  const adapter = await navigator.gpu?.requestAdapter();
  const device = await adapter?.requestDevice();
  if (!device) {
    fail('need a browser that supports WebGPU');
    return;
  }

  const module = device.createShaderModule({
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

      @compute @workgroup_size(1) fn computeSomething(
        @builtin(global_invocation_id) id: vec3<u32>
      ) {
        let i = id.x * 4 * 4 + id.y * 4 + id.z;
        positions[i] = positions[i] * 2.0;
      }

      // @compute @workgroup_size(1) fn move_particles(@builtin(global_invocation_id) id: vec3<u32>) {
      //   let i = id.x;
      //   particles[i].pos = particles[i].pos + particles[i].vel;
      // }
    `,
  });

  const pipeline = device.createComputePipeline({
    label: 'doubling compute pipeline',
    layout: 'auto',
    compute: {
      module,
      entryPoint: 'computeSomething',
    },
  });

  const numParticles = 1;

  const particleStorageUnitSize = 4 * 4; // 4 Bytes * 3 Values (+ 1 offset is always rounded up to 16 Bytes instead of 12 Bytes because GPUs are stupid)
  const particleStorageSize = particleStorageUnitSize * numParticles;
  console.log('particleStorageSize', particleStorageSize);

  const particlePosBuffer = device.createBuffer({
    label: 'storage of particle positions',
    size: particleStorageSize,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
  });


  const particleVelBuffer = device.createBuffer({
    label: 'storage of particle velocities',
    size: particleStorageSize,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
  });

  const posValues = new Float32Array(particleStorageSize / 4)
  const velValues = new Float32Array(particleStorageSize / 4)
  // set initial positions and velocities
  for (let i = 0; i < numParticles; i++) {
    const offset = i * (particleStorageSize / 4);
    posValues.set([Math.random(), Math.random(), Math.random(), 0], offset);
    velValues.set([Math.random(-1.0, 1.0), Math.random(-1.0, 1.0), Math.random(-1.0, 1.0), 0], offset);
  }

  device.queue.writeBuffer(particlePosBuffer, 0, posValues);
  device.queue.writeBuffer(particleVelBuffer, 0, velValues);

  // Setup a bindGroup to tell the shader which
  // buffer to use for the computation
  const bindGroup = device.createBindGroup({
    label: 'bindGroup for work buffer',
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: particlePosBuffer } },
      { binding: 1, resource: { buffer: particleVelBuffer } },
    ],
  });

  // Encode commands to do the computation
  const encoder = device.createCommandEncoder({
    label: 'position update encoder',
  });
  const pass = encoder.beginComputePass({
    label: 'position compute pass',
  });
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.dispatchWorkgroups(1);
  pass.end();

  // Encode a command to copy the results to a mappable buffer.
  // encoder.copyBufferToBuffer(positionBuffer, 0, resultBuffer, 0, resultBuffer.size);

  // Finish encoding and submit the commands
  const commandBuffer = encoder.finish();
  device.queue.submit([commandBuffer]);

  // Read the results
  // await resultBuffer.mapAsync(GPUMapMode.READ);
  // const result = new Float32Array(resultBuffer.getMappedRange().slice());
  // resultBuffer.unmap();

  // console.log('result', result);
}

function fail(msg) {
  // eslint-disable-next-line no-alert
  alert(msg);
}

main();
