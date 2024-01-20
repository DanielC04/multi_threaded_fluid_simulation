import { Simulation } from "./ui/Simulation";

const toggle: HTMLInputElement | null = document.querySelector(".toggle input");
const sim2DContainer = document.querySelector(".simulation-2D");
const sim3DContainer = document.querySelector(".simulation-3D");
let simulation2d: Simulation, simulation3d: Simulation;

const setDimension = () => {
  const is3D = toggle?.checked;
  if (is3D) {
    if (simulation3d) simulation3d.is_focused = true;
    if (simulation2d) simulation2d.is_focused = false;
    sim2DContainer?.classList.add("hidden");
    sim3DContainer?.classList.remove("hidden");
    // toggle setting-control boxes
    document.querySelector(".controls > div:first-child")?.classList.add("hidden");
    document.querySelector(".controls > div:nth-child(2)")?.classList.remove("hidden");
  } else {
    if (simulation3d) simulation3d.is_focused = false;
    if (simulation2d) simulation2d.is_focused = true;
    sim2DContainer?.classList.remove("hidden");
    sim3DContainer?.classList.add("hidden");
    // toggle setting-control boxes
    document.querySelector(".controls > div:first-child")?.classList.remove("hidden");
    document.querySelector(".controls > div:nth-child(2)")?.classList.add("hidden");
  }
};

const setup = () => {
  if (!toggle) return;
  toggle.onchange = setDimension;
  // make sure spacebar doesn't toggle checkbox
  toggle.onkeydown = e => {
    if (e.key === " " || e.code === "Space") {
      e.preventDefault();
    }
  }

  simulation2d = new Simulation(2);
  simulation3d = new Simulation(3);

  setDimension();
}

setup();
