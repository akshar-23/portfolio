// Live flight data the scene writes every frame and the HUD reads.
export const telemetry = {
  speed: 0, // units per second
  warp: 0, // 0 parked, 1 full speed
  heading: 0, // degrees, 0 = straight ahead along the route
  pitch: 0,
  x: 0,
  y: 0,
  z: 0,
};
