// Procedural track generation
// Creates a closed circuit using Catmull-Rom spline interpolation

const TRACK_WIDTH = 12;
const SEGMENT_COUNT = 200; // Segments along the track

class Track {
  constructor(rng, width = TRACK_WIDTH) {
    this.width = width;
    this.rng = rng;
    this.points = [];      // 3D control points
    this.splinePoints = []; // Dense interpolated points
    this.normals = [];     // Left direction normals
    this.mesh = null;
    this.curbMeshes = [];
    this.startIndex = 0;
    this.generate();
    this.buildMesh();
  }

  generate() {
    // Create control points in a rough oval/circuit shape
    const controlPoints = [
      { x: 0, z: 0 },
      { x: 60, z: -20 },
      { x: 100, z: 10 },
      { x: 120, z: 60 },
      { x: 90, z: 110 },
      { x: 40, z: 130 },
      { x: -10, z: 110 },
      { x: -50, z: 70 },
      { x: -70, z: 20 },
      { x: -50, z: -20 },
    ];

    // Add some noise for character
    for (let cp of controlPoints) {
      cp.x += (this.rng() - 0.5) * 15;
      cp.z += (this.rng() - 0.5) * 15;
    }

    this.points = controlPoints;
    this.splinePoints = this.interpolateSpline(this.points, SEGMENT_COUNT);

    // Calculate left normals
    this.normals = [];
    for (let i = 0; i < this.splinePoints.length; i++) {
      const next = this.splinePoints[(i + 1) % this.splinePoints.length];
      const dx = next.x - this.splinePoints[i].x;
      const dz = next.z - this.splinePoints[i].z;
      const len = Math.sqrt(dx * dx + dz * dz) || 1;
      this.normals.push({ x: -dz / len, z: dx / len });
    }
  }

  interpolateSpline(points, count) {
    const n = points.length;
    const result = [];

    for (let i = 0; i < count; i++) {
      const t = (i / count) * n;
      const idx = Math.floor(t) % n;
      const frac = t - Math.floor(t);

      const p0 = points[(idx - 1 + n) % n];
      const p1 = points[idx];
      const p2 = points[(idx + 1) % n];
      const p3 = points[(idx + 2) % n];

      result.push(this.catmullRom(p0, p1, p2, p3, frac));
    }
    return result;
  }

  catmullRom(p0, p1, p2, p3, t) {
    const t2 = t * t;
    const t3 = t2 * t;

    const x = 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);

    const z = 0.5 * ((2 * p1.z) + (-p0.z + p2.z) * t +
      (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t2 +
      (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * t3);

    return { x, z };
  }

  getPointOnTrack(fraction) {
    // fraction 0..1
    const idx = Math.floor(fraction * this.splinePoints.length) % this.splinePoints.length;
    return this.splinePoints[idx];
  }

  buildMesh() {
    const geo = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];
    const colors = [];

    // 4 vertices per segment: road-left, road-right, curb-outer-left, curb-outer-right
    for (let i = 0; i < this.splinePoints.length; i++) {
      const p = this.splinePoints[i];
      const n = this.normals[i];
      const halfW = this.width * 0.5;
      const curbW = 1.2;

      const vi = vertices.length / 3;

      // Road left edge
      vertices.push(p.x + n.x * halfW, 0.015, p.z + n.z * halfW);
      colors.push(0.40, 0.40, 0.40);

      // Road right edge
      vertices.push(p.x - n.x * halfW, 0.015, p.z - n.z * halfW);
      colors.push(0.40, 0.40, 0.40);

      // Curb outer left
      const olx = p.x + n.x * (halfW + curbW);
      const olz = p.z + n.z * (halfW + curbW);
      vertices.push(olx, 0.02, olz);
      const curbC = i % 6 < 3 ? [1, 0.15, 0.15] : [1, 1, 1];
      colors.push(...curbC);

      // Curb outer right
      const orx = p.x - n.x * (halfW + curbW);
      const orz = p.z - n.z * (halfW + curbW);
      vertices.push(orx, 0.02, orz);
      colors.push(...curbC);

      if (i < this.splinePoints.length - 1) {
        const nextVi = vi + 4;

        // Road quad (2 triangles, CCW from above)
        indices.push(vi, nextVi, vi + 1);
        indices.push(vi + 1, nextVi, nextVi + 1);

        // Curb left strip (road-left to curb-outer-left)
        indices.push(vi, vi + 2, nextVi + 2);
        indices.push(vi, nextVi + 2, nextVi);

        // Curb right strip (road-right to curb-outer-right)
        indices.push(vi + 3, nextVi + 3, vi + 1);
        indices.push(vi + 1, nextVi + 3, nextVi + 1);
      }
    }

    // Close loop (last segment connects to first)
    const last = (this.splinePoints.length - 1) * 4;
    // Road
    indices.push(last, 0, last + 1);
    indices.push(last + 1, 1, last + 1);
    // Curb left
    indices.push(last, last + 2, 2);
    indices.push(last, 2, 0);
    // Curb right
    indices.push(last + 3, last + 1, 3);
    indices.push(last + 1, 1, 3);

    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mat = new THREE.MeshLambertMaterial({
      vertexColors: true,
      flatShading: true
    });

    this.mesh = new THREE.Mesh(geo, mat);
  }

  getStartPoint() {
    return this.splinePoints[0];
  }

  // Check if a point is on the track (returns distance to center, or -1 if off)
  checkOnTrack(x, z) {
    let minDist = Infinity;
    const step = Math.floor(this.splinePoints.length / 60);
    for (let i = 0; i < this.splinePoints.length; i += step) {
      const p = this.splinePoints[i];
      const dx = x - p.x;
      const dz = z - p.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < minDist) minDist = dist;
    }
    return minDist < this.width * 0.5 + 1.0 ? minDist : -1;
  }

  // Check if near start/finish line (crossing detection)
  checkStartLine(x, z) {
    const sp = this.splinePoints[0];
    const dx = x - sp.x;
    const dz = z - sp.z;
    return Math.sqrt(dx * dx + dz * dz) < this.width;
  }
}