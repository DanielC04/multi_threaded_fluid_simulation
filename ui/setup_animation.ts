import { Simulation } from "./Simulation";

const toggle: HTMLInputElement | null = document.querySelector(".toggle input");
const sim2DContainer = document.querySelector(".simulation-2D");
const sim3DContainer = document.querySelector(".simulation-3D");
let simulation2d: Simulation, simulation3d: Simulation;

const setDimension = () => {
  const is3D = toggle?.checked;
  if (is3D) {
    if (simulation3d) simulation3d.settingUI.set_focus(true);
    if (simulation2d) simulation2d.settingUI.set_focus(false);
    sim2DContainer?.classList.add("hidden");
    sim3DContainer?.classList.remove("hidden");
    // toggle setting-control boxes
    document.querySelector(".controls > div:first-child")?.classList.add("hidden");
    document.querySelector(".controls > div:nth-child(2)")?.classList.remove("hidden");
  } else {
    if (simulation3d) simulation3d.settingUI.set_focus(false);
    if (simulation2d) simulation2d.settingUI.set_focus(true);
    sim2DContainer?.classList.remove("hidden");
    sim3DContainer?.classList.add("hidden");
    // toggle setting-control boxes
    document.querySelector(".controls > div:first-child")?.classList.remove("hidden");
    document.querySelector(".controls > div:nth-child(2)")?.classList.add("hidden");
  }
};

export const setup_graphics = () => {
  if (!toggle) return;
  toggle.onchange = setDimension;
  // make sure spacebar doesn't toggle checkbox
  toggle.onkeydown = e => {
    if (e.key === " " || e.code === "Space") {
      e.preventDefault();
    }
  }

  simulation2d = new Simulation(2, 1000);
  simulation2d.settingUI.settings.is_focused = false;
  simulation3d = new Simulation(3, 1000);

  setDimension();
}
