// Kart with arcade physics

class Kart {
  constructor(color = 0xff4444, accentColor = 0x2244ff) {
    this.position = new THREE.Vector3(0, 0, 0);
    this.rotation = 0; // radians, Z-up yaw
    this.speed = 0;
    this.maxSpeed = 35;
    this.acceleration = 18;
    this.brakeForce = 30;
    this.friction = 5;
    this.offRoadFriction = 12;
    this.turnSpeed = 2.8;
    this.driftFactor = 0.92;
    this.isDrifting = false;
    this.driftAngle = 0;

    this.mesh = this.buildKart(color, accentColor);
    this.initPosition = null;

    // Lap tracking
    this.lap = 1;
    this.totalLaps = 3;
    this.crossedHalf = false;
    this.lapTime = 0;
    this.totalTime = 0;
    this.finished = false;
    this.bestLap = Infinity;
    this.lapStartTime = 0;
  }

  buildKart(bodyColor, accentColor) {
    const group = new THREE.Group();

    // Body - chunky low-poly box
    const bodyGeo = new THREE.BoxGeometry(1.6, 0.7, 2.4);
    const bodyMat = new THREE.MeshLambertMaterial({
      color: bodyColor, flatShading: true
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.55;
    group.add(body);

    // Cabin/cockpit
    const cabinGeo = new THREE.BoxGeometry(1.2, 0.5, 1.0);
    const cabinMat = new THREE.MeshLambertMaterial({
      color: 0x333333, flatShading: true
    });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 1.0, -0.2);
    group.add(cabin);

    // Spoiler
    const spoilerGeo = new THREE.BoxGeometry(1.8, 0.1, 0.4);
    const spoilerMat = new THREE.MeshLambertMaterial({
      color: accentColor, flatShading: true
    });
    const spoiler = new THREE.Mesh(spoilerGeo, spoilerMat);
    spoiler.position.set(0, 1.1, 1.1);
    group.add(spoiler);
    // Spoiler supports
    const supportGeo = new THREE.BoxGeometry(0.1, 0.4, 0.1);
    const s1 = new THREE.Mesh(supportGeo, bodyMat);
    s1.position.set(-0.6, 0.9, 1.1);
    group.add(s1);
    const s2 = new THREE.Mesh(supportGeo, bodyMat);
    s2.position.set(0.6, 0.9, 1.1);
    group.add(s2);

    // Wheels - low-poly cylinders
    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 8);
    const wheelMat = new THREE.MeshLambertMaterial({
      color: 0x111111, flatShading: true
    });
    const wheelPositions = [
      { x: -0.9, z: 0.7 },
      { x: 0.9, z: 0.7 },
      { x: -0.9, z: -0.7 },
      { x: 0.9, z: -0.7 },
    ];
    this.wheels = [];
    for (const wp of wheelPositions) {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wp.x, 0.35, wp.z);
      group.add(wheel);
      this.wheels.push(wheel);
    }

    // Driver head (simple sphere)
    const headGeo = new THREE.SphereGeometry(0.25, 6, 6);
    const headMat = new THREE.MeshLambertMaterial({
      color: 0xffcc99, flatShading: true
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 1.3, -0.1);
    group.add(head);

    // Driver helmet
    const helmetGeo = new THREE.SphereGeometry(0.28, 6, 6, 0, Math.PI * 2, 0, Math.PI * 0.6);
    const helmetMat = new THREE.MeshLambertMaterial({
      color: accentColor, flatShading: true
    });
    const helmet = new THREE.Mesh(helmetGeo, helmetMat);
    helmet.position.set(0, 1.35, -0.1);
    group.add(helmet);

    // Tire marks (hidden by default)
    this.tireMarks = [];

    return group;
  }

  setStartPoint(pos, rot) {
    this.position.copy(pos);
    this.rotation = rot;
    this.speed = 0;
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotation;
    this.initPosition = this.position.clone();
    this.lap = 1;
    this.crossedHalf = false;
    this.lapTime = 0;
    this.totalTime = 0;
    this.finished = false;
    this.lapStartTime = 0;
  }

  update(dt, input, onTrack) {
    if (this.finished) {
      // Slow down to stop
      this.speed *= 0.95;
      if (Math.abs(this.speed) < 0.1) this.speed = 0;
    } else {
      // Acceleration
      if (input.up) {
        this.speed += this.acceleration * dt;
      } else if (input.down) {
        this.speed -= this.brakeForce * dt;
      } else {
        // Natural friction
        const friction = onTrack ? this.friction : this.offRoadFriction;
        if (this.speed > 0) {
          this.speed = Math.max(0, this.speed - friction * dt);
        } else if (this.speed < 0) {
          this.speed = Math.min(0, this.speed + friction * dt);
        }
      }

      // Clamp speed
      this.speed = clamp(this.speed, -this.maxSpeed * 0.4, this.maxSpeed);

      // Off-road penalty
      if (!onTrack) {
        this.speed *= (1 - 2.0 * dt);
      }

      // Steering
      const steerAmount = this.turnSpeed * dt;
      if (input.left) {
        this.rotation += steerAmount * (Math.abs(this.speed) / this.maxSpeed + 0.3);
      }
      if (input.right) {
        this.rotation -= steerAmount * (Math.abs(this.speed) / this.maxSpeed + 0.3);
      }

      // Drift mechanic
      this.isDrifting = input.drift && Math.abs(this.speed) > 8 && (input.left || input.right);
      if (this.isDrifting) {
        this.driftAngle = lerp(this.driftAngle, input.left ? 0.3 : -0.3, dt * 5);
      } else {
        this.driftAngle *= this.driftFactor;
      }

      // Reverse steering when going backwards
      if (this.speed < 0) {
        this.rotation *= -1;
        this.rotation *= -1; // cancel, we handle it differently
      }
    }

    // Move forward based on rotation
    const moveX = Math.sin(this.rotation) * this.speed * dt;
    const moveZ = Math.cos(this.rotation) * this.speed * dt;
    this.position.x += moveX;
    this.position.z += moveZ;

    // Update mesh
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotation;

    // Wheel spin visual
    const spinSpeed = this.speed * dt * 2;
    for (const wheel of this.wheels) {
      wheel.rotation.x += spinSpeed;
    }

    // Steering visual on front wheels
    const steerVis = input.left ? 0.25 : input.right ? -0.25 : 0;
    this.wheels[0].rotation.y = steerVis;
    this.wheels[1].rotation.y = steerVis;

    // Kart body lean into turns
    const leanAmount = (input.left ? -1 : input.right ? 1 : 0) * Math.abs(this.speed) * 0.008;
    this.mesh.rotation.z = lerp(this.mesh.rotation.z, leanAmount, dt * 10);

    return this.speed;
  }

  // Lap progress tracking (0 to 1 around the track)
  getTrackProgress(track) {
    const total = track.splinePoints.length;
    let minDist = Infinity;
    let closestIdx = 0;

    // Search in a region around our current best guess for efficiency
    const searchRange = Math.floor(total * 0.15);
    const start = (closestIdx - searchRange + total) % total;

    for (let i = 0; i < total; i++) {
      const idx = (start + i) % total;
      const p = track.splinePoints[idx];
      const dx = this.position.x - p.x;
      const dz = this.position.z - p.z;
      const dist = dx * dx + dz * dz;
      if (dist < minDist) {
        minDist = dist;
        closestIdx = idx;
      }
    }

    return closestIdx / total;
  }

  updateLaps(track, currentTime) {
    if (this.finished) return;

    const progress = this.getTrackProgress(track);

    // Track crossing the halfway point (0.5)
    if (this.crossedHalf && progress < 0.15) {
      // Crossed the start/finish line
      this.lapTime = currentTime - this.lapStartTime;
      if (this.lapTime < this.bestLap) {
        this.bestLap = this.lapTime;
      }
      this.lapStartTime = currentTime;
      this.lap++;
      this.crossedHalf = false;

      if (this.lap > this.totalLaps) {
        this.finished = true;
        this.totalTime = currentTime;
      }
    }

    if (progress > 0.4 && progress < 0.6) {
      this.crossedHalf = true;
    }
  }
}