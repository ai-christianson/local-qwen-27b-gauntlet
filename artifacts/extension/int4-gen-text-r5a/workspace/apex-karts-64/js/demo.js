// Demo mode - automated driving for testing/Playwright

class DemoController {
  constructor(track) {
    this.track = track;
    this.active = false;
    this.demoIndex = 0;
    this.demoProgress = 0;
    this.input = { up: false, down: false, left: false, right: false, drift: false };

    // Precompute track-following path
    this.precomputePath();
  }

  precomputePath() {
    // Calculate desired heading at each point
    this.pathData = [];
    const points = this.track.splinePoints;
    for (let i = 0; i < points.length; i++) {
      const next = points[(i + 1) % points.length];
      const dx = next.x - points[i].x;
      const dz = next.z - points[i].z;
      this.pathData.push({
        point: points[i],
        heading: Math.atan2(dx, dz),
        index: i
      });
    }
  }

  start() {
    this.active = true;
    this.demoIndex = 0;
    this.demoProgress = 0;
  }

  stop() {
    this.active = false;
  }

  // Get the nearest point on the path to the kart
  findNearestPathIndex(kart) {
    const pos = kart.position;
    let minDist = Infinity;
    let bestIdx = 0;

    // Search near our current index for efficiency
    const searchRange = 30;
    const total = this.pathData.length;
    const startIdx = (this.demoIndex - searchRange + total) % total;

    for (let i = 0; i < searchRange * 2; i++) {
      const idx = (startIdx + i) % total;
      const pd = this.pathData[idx];
      const dx = pos.x - pd.point.x;
      const dz = pos.z - pd.point.z;
      const dist = dx * dx + dz * dz;
      if (dist < minDist) {
        minDist = dist;
        bestIdx = idx;
      }
    }

    this.demoIndex = bestIdx;
    return bestIdx;
  }

  // Generate steering input to follow the track
  update(kart) {
    if (!this.active) return;

    const idx = this.findNearestPathIndex(kart);
    const pd = this.pathData[idx];

    // Desired heading to next point
    const nextIdx = (idx + 10) % this.pathData.length;
    const target = this.pathData[nextIdx].point;
    const dx = target.x - kart.position.x;
    const dz = target.z - kart.position.z;
    const targetHeading = Math.atan2(dx, dz);

    // Angle difference
    let angleDiff = targetHeading - kart.rotation;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    // Reset all inputs
    this.input = { up: false, down: false, left: false, right: false, drift: false };

    // Always accelerate
    this.input.up = true;

    // Steer towards track
    if (angleDiff > 0.1) {
      this.input.left = true;
    } else if (angleDiff < -0.1) {
      this.input.right = true;
    }

    // Add some drift for style
    if (Math.abs(angleDiff) > 0.3 && Math.abs(kart.speed) > 12) {
      this.input.drift = true;
    }

    // Slight braking on sharp turns
    if (Math.abs(angleDiff) > 0.6) {
      this.input.up = false;
      this.input.down = true;
    }
  }
}