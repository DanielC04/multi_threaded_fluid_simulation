import { writeDataToGPUBufferAndReturnBindGroup, fail } from './helpers.js';
import { createShaderModule } from './shader_module.js';

const main = async () => {
  const adapter = await navigator.gpu?.requestAdapter();

  const device = await adapter?.requestDevice();
  if (!device) {
    fail('need a browser that supports WebGPU');
    return;
  }

  const module = createShaderModule(device);

  const pipeline = device.createComputePipeline({
    label: 'particle movement pipeline',
    layout: 'auto',
    compute: {
      module,
      entryPoint: 'moveParticles',
    },
  });

  const bindGroup = writeDataToGPUBufferAndReturnBindGroup(device, pipeline);


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

main();
