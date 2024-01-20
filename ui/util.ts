import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import { dimension } from "../types";

export function setup_simulation(dimension: dimension) {
  const scene = new THREE.Scene();
  const renderer = createRenderer(dimension);
  const dimensions = Array(dimension).fill(10.)
  const camera = createCamera(renderer, dimensions);
  addLights(scene);
  createGround(scene, dimensions);
  createCube(scene, dimensions);
  window.addEventListener("resize", () => onWindowResize(camera, renderer), false);
  return { scene, renderer, camera };
}

function createRenderer(dimension: dimension) {
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ReinhardToneMapping;
  renderer.toneMappingExposure = 3;
  renderer.shadowMap.enabled = true;
  const container = document.body.querySelector(`.simulation-${dimension}D`);
  container && container.appendChild(renderer.domElement);
  return renderer;
}

function createCamera(renderer: THREE.Renderer, dimensions: Array<number>): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
  );
  // create controls for user
  const controls = new OrbitControls(camera, renderer.domElement);
  camera.position.x = 5;
  camera.position.y = 5;
  camera.position.z = 5;
  camera.rotateY(-Math.PI / 2.);
  // if (dimension == 2)
  //   lockCameraTo2D(camera, controls, dimensions);
  controls.update();
  return camera;
}

function addLights(scene: THREE.Scene) {
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);
}

function createGround(scene: THREE.Scene, dimensions: Array<number>) {
  // Ground plane
  const geo = new THREE.PlaneGeometry(20, 20, 8, 8);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
  });
  const plane = new THREE.Mesh(geo, mat);
  plane.rotateX(-Math.PI / 2.)
  if (dimensions.length == 3)
    plane.translateZ(-dimensions[2] / 2.);
  scene.add(plane);
}

function createCube(scene: THREE.Scene, bounding_box_dimensions: Array<number>) {
  let width, height, depth;
  if (bounding_box_dimensions.length == 2) {
    [width, depth] = bounding_box_dimensions;
    height = 0.1;
  } else {
    [width, height, depth] = bounding_box_dimensions;
  }
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    opacity: 0.1,
    transparent: true,
  });
  const cube = new THREE.Mesh(geometry, material);
  // cube.position.x = width / 2.0;
  // cube.position.y = height / 2.0;
  // cube.position.z = depth / 2.0;
  scene.add(cube);
  return cube;
}

function onWindowResize(camera: THREE.PerspectiveCamera, renderer: THREE.Renderer) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}
