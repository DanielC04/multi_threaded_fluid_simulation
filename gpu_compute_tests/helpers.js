const numParticles = 1;

const particleStorageUnitSize = 4 * 4; // 4 Bytes * 3 Values (+ 1 offset is always rounded up to 16 Bytes instead of 12 Bytes because GPUs are stupid)
const particleStorageSize = particleStorageUnitSize * numParticles;


export const writeDataToGPUBufferAndReturnBindGroup = (device, pipeline) => {

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
  return bindGroup;
}


// A random number between [min and max)
// With 1 argument it will be [0 to min)
// With no arguments it will be [0 to 1)
export const rand = (min, max) => {
  if (min === undefined) {
    min = 0;
    max = 1;
  } else if (max === undefined) {
    max = min;
    min = 0;
  }
  return min + Math.random() * (max - min);
};


export function fail(msg) {
  // eslint-disable-next-line no-alert
  alert(msg);
}


