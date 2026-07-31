// Procedural decorations: trees, flowers, rocks, bushes

class TrackDecorations {
  constructor(track, rng) {
    this.rng = rng;
    this.track = track;
    this.decorGroup = new THREE.Group();
    this.buildDecorations();
  }

  buildDecorations() {
    // Place decorations around the track
    const points = this.track.splinePoints;
    const normals = this.track.normals;
    const width = this.track.width;

    // Trees every few segments
    for (let i = 0; i < points.length; i += 5) {
      const p = points[i];
      const n = normals[i];

      // Place trees on both sides
      for (let side = -1; side <= 1; side += 2) {
        if (this.rng() > 0.4) {
          const dist = (width * 0.5 + 3) + this.rng() * 8;
          const tx = p.x + n.x * dist * side;
          const tz = p.z + n.z * dist * side;

          // Trees with slight height variation
          const height = 2 + this.rng() * 3;
          this.addTree(tx, tz, height);
        }
      }
    }

    // Flowers and bushes in clusters
    for (let i = 0; i < points.length; i += 3) {
      const p = points[i];
      const n = normals[i];

      if (this.rng() > 0.6) {
        const side = this.rng() > 0.5 ? 1 : -1;
        const dist = (width * 0.5 + 2) + this.rng() * 5;
        const fx = p.x + n.x * dist * side;
        const fz = p.z + n.z * dist * side;

        if (this.rng() > 0.5) {
          this.addFlowerCluster(fx, fz);
        } else {
          this.addBush(fx, fz);
        }
      }
    }

    // Rocks scattered around
    for (let i = 0; i < 40; i++) {
      const idx = Math.floor(this.rng() * points.length);
      const p = points[idx];
      const n = normals[idx];
      const side = this.rng() > 0.5 ? 1 : -1;
      const dist = (width * 0.5 + 4) + this.rng() * 10;
      const rx = p.x + n.x * dist * side;
      const rz = p.z + n.z * dist * side;
      this.addRock(rx, rz);
    }

    // Grass plane (ground)
    this.addGround();

    // Start/finish line
    this.addStartFinishLine();
  }

  addTree(x, z, height) {
    const group = new THREE.Group();

    // Trunk - tapered
    const trunkGeo = new THREE.CylinderGeometry(0.15, 0.3, height * 0.4, 5);
    const trunkMat = new THREE.MeshLambertMaterial({
      color: PALETTE.treeTrunk, flatShading: true
    });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = height * 0.2;
    group.add(trunk);

    // Foliage - stacked cones for chunky look
    const foliageColor = new THREE.Color(PALETTE.tree)
      .offsetHSL(0, 0, (this.rng() - 0.5) * 0.2);

    for (let j = 0; j < 2; j++) {
      const coneH = height * (0.5 - j * 0.12);
      const coneR = (0.8 + this.rng() * 0.4) * (1 - j * 0.2);
      const coneGeo = new THREE.ConeGeometry(coneR, coneH, 6);
      const coneMat = new THREE.MeshLambertMaterial({
        color: j === 0 ? PALETTE.tree : new THREE.Color(PALETTE.tree).offsetHSL(0.03, 0, 0.05).getHex(),
        flatShading: true
      });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.y = height * 0.4 + j * height * 0.25;
      group.add(cone);
    }

    group.position.set(x, 0, z);
    group.rotation.y = this.rng() * Math.PI * 2;
    this.decorGroup.add(group);
  }

  addFlowerCluster(x, z) {
    const group = new THREE.Group();
    const count = 3 + Math.floor(this.rng() * 4);

    for (let i = 0; i < count; i++) {
      const colorIdx = Math.floor(this.rng() * PALETTE.flower.length);
      const flowerColor = PALETTE.flower[colorIdx];

      // Stem
      const stemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 3);
      const stemMat = new THREE.MeshLambertMaterial({ color: 0x336622 });
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.set(this.rng() * 1.5 - 0.75, 0.2, this.rng() * 1.5 - 0.75);
      group.add(stem);

      // Flower head
      const headGeo = new THREE.SphereGeometry(0.12, 5, 5);
      const headMat = new THREE.MeshLambertMaterial({
        color: flowerColor, flatShading: true
      });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.copy(stem.position);
      head.position.y = 0.45;
      group.add(head);
    }

    group.position.set(x, 0, z);
    this.decorGroup.add(group);
  }

  addBush(x, z) {
    const group = new THREE.Group();
    const size = 0.4 + this.rng() * 0.5;

    // Main bush sphere
    const bushGeo = new THREE.SphereGeometry(size, 5, 5);
    const bushMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color(PALETTE.grass).offsetHSL(0, 0.1, -0.05).getHex(),
      flatShading: true
    });
    const bush = new THREE.Mesh(bushGeo, bushMat);
    bush.position.y = size * 0.6;
    group.add(bush);

    group.position.set(x, 0, z);
    this.decorGroup.add(group);
  }

  addRock(x, z) {
    const size = 0.3 + this.rng() * 0.5;
    // Low-poly rock - dodecahedron
    const rockGeo = new THREE.DodecahedronGeometry(size, 0);
    const rockMat = new THREE.MeshLambertMaterial({
      color: new THREE.Color(0x888888).offsetHSL(0, 0, (this.rng() - 0.5) * 0.1).getHex(),
      flatShading: true
    });
    const rock = new THREE.Mesh(rockGeo, rockMat);
    rock.position.set(x, size * 0.3, z);
    rock.rotation.y = this.rng() * Math.PI * 2;
    rock.scale.y = 0.6;
    this.decorGroup.add(rock);
  }

  addGround() {
    // Large grass ground plane
    const groundGeo = new THREE.PlaneGeometry(400, 400);
    const groundMat = new THREE.MeshLambertMaterial({
      color: PALETTE.grass, flatShading: true
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    ground.receiveShadow = false;
    this.decorGroup.add(ground);

    // Grid pattern for extra N64 feel
    const gridGeo = new THREE.PlaneGeometry(400, 400, 20, 20);
    const gridMat = new THREE.MeshLambertMaterial({
      color: PALETTE.grassLight,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
      flatShading: true
    });
    const grid = new THREE.Mesh(gridGeo, gridMat);
    grid.rotation.x = -Math.PI / 2;
    grid.position.y = -0.01;
    this.decorGroup.add(grid);
  }

  addStartFinishLine() {
    const p = this.track.splinePoints[0];
    const n = this.track.normals[0];
    const width = this.track.width;

    // Create checkered start/finish line
    const divisions = 12;
    const divWidth = width / divisions;

    for (let i = 0; i < divisions; i++) {
      const isWhite = i % 2 === 0;
      const sqGeo = new THREE.PlaneGeometry(divWidth, 2);
      const sqMat = new THREE.MeshLambertMaterial({
        color: isWhite ? 0xffffff : 0x111111,
        flatShading: true
      });
      const sq = new THREE.Mesh(sqGeo, sqMat);
      const offset = (i - divisions / 2 + 0.5) * divWidth;
      sq.position.set(
        p.x + n.x * offset,
        0.03,
        p.z + n.z * offset
      );
      sq.rotation.x = -Math.PI / 2;
      // Rotate to face along the track
      const tangent = this.track.splinePoints[1];
      const angle = Math.atan2(
        tangent.x - p.x,
        tangent.z - p.z
      );
      sq.rotation.z = -angle + Math.atan2(n.x, n.z);
      // Recalculate rotation for plane on ground
      sq.rotation.set(-Math.PI / 2, 0, 0);
      sq.rotation.y = Math.atan2(n.x, n.z);

      this.decorGroup.add(sq);
    }

    // Start arch
    const archGroup = new THREE.Group();
    const pillarGeo = new THREE.BoxGeometry(0.3, 3, 0.3);
    const pillarMat = new THREE.MeshLambertMaterial({
      color: 0xffcc00, flatShading: true
    });

    const leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
    leftPillar.position.set(n.x * (-width * 0.5 - 0.5), 1.5, n.z * (-width * 0.5 - 0.5));
    archGroup.add(leftPillar);

    const rightPillar = new THREE.Mesh(pillarGeo, pillarMat);
    rightPillar.position.set(n.x * (width * 0.5 + 0.5), 1.5, n.z * (width * 0.5 + 0.5));
    archGroup.add(rightPillar);

    // Arch top
    const topGeo = new THREE.BoxGeometry(width + 1.3, 0.3, 0.3);
    const topMat = new THREE.MeshLambertMaterial({
      color: 0xff3333, flatShading: true
    });
    const topBar = new THREE.Mesh(topGeo, topMat);
    topBar.position.y = 3;
    archGroup.add(topBar);

    // Banner on top
    const bannerGeo = new THREE.PlaneGeometry(5, 1.2);
    const bannerCanvas = document.createElement('canvas');
    bannerCanvas.width = 256;
    bannerCanvas.height = 64;
    const ctx = bannerCanvas.getContext('2d');
    ctx.fillStyle = '#ff3333';
    ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('APEX KARTS', 128, 32);
    const bannerTex = new THREE.CanvasTexture(bannerCanvas);
    const bannerMat = new THREE.MeshLambertMaterial({
      map: bannerTex,
      flatShading: true
    });
    const banner = new THREE.Mesh(bannerGeo, bannerMat);
    banner.position.set(0, 3.15, 0);
    banner.rotation.x = Math.PI / 2;
    archGroup.add(banner);

    archGroup.position.set(p.x, 0, p.z);
    // Align arch with track direction
    const tangent = this.track.splinePoints[1];
    const angle = Math.atan2(tangent.x - p.x, tangent.z - p.z);
    archGroup.rotation.y = angle;

    this.decorGroup.add(archGroup);
  }
}