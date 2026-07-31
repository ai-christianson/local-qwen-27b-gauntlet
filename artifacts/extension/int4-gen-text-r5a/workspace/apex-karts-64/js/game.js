// Main game controller

const SEED = 42;

class Game {
  constructor() {
    this.rng = createRNG(SEED);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.track = null;
    this.kart = null;
    this.decorations = null;
    this.demo = null;

    this.input = { up: false, down: false, left: false, right: false, drift: false };
    this.state = 'menu'; // menu, countdown, racing, finished
    this.clock = new THREE.Clock();
    this.elapsedTime = 0;
    this.countdownTimer = 0;

    this.init();
    this.setupInput();
    this.loop();
  }

  init() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(PALETTE.sky);
    this.scene.fog = new THREE.Fog(PALETTE.sky, 80, 200);

    // Camera
    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.5, 300);

    // Renderer
    const canvas = document.getElementById('game-canvas');
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: false
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x88aaFF, 0.5);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xFFFFEE, 0.95);
    dirLight.position.set(50, 80, 30);
    this.scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight(0x88CCFF, 0x448833, 0.35);
    this.scene.add(hemiLight);

    // Build track
    this.track = new Track(this.rng);
    this.scene.add(this.track.mesh);

    // Build decorations
    this.decorations = new TrackDecorations(this.track, createRNG(SEED + 1));
    this.scene.add(this.decorations.decorGroup);

    // Create kart
    const kartColors = [
      { body: 0xff4444, accent: 0x2244cc },
      { body: 0x44cc44, accent: 0xcc8800 },
      { body: 0x4488ff, accent: 0xff4400 },
    ];
    const colorChoice = kartColors[Math.floor(createRNG(SEED + 2)() * kartColors.length)];
    this.kart = new Kart(colorChoice.body, colorChoice.accent);
    this.scene.add(this.kart.mesh);

    // Place kart at start
    const startPoint = this.track.getStartPoint();
    const nextPoint = this.track.splinePoints[1];
    const startRot = Math.atan2(nextPoint.x - startPoint.x, nextPoint.z - startPoint.z);
    this.kart.setStartPoint(new THREE.Vector3(startPoint.x, 0, startPoint.z), startRot);

    // Set initial camera for menu view
    this.camera.position.set(startPoint.x + 25, 18, startPoint.z + 25);
    this.camera.lookAt(startPoint.x, 0, startPoint.z);

    // Demo controller
    this.demo = new DemoController(this.track);

    // Handle resize
    window.addEventListener('resize', () => this.onResize());
  }

  setupInput() {
    const keyMap = {
      'ArrowUp': 'up', 'KeyW': 'up',
      'ArrowDown': 'down', 'KeyS': 'down',
      'ArrowLeft': 'left', 'KeyA': 'left',
      'ArrowRight': 'right', 'KeyD': 'right',
      'Space': 'drift', 'ShiftLeft': 'drift', 'ShiftRight': 'drift'
    };

    document.addEventListener('keydown', (e) => {
      const action = keyMap[e.code];
      if (action) {
        this.input[action] = true;
        e.preventDefault();
      }
      if (e.code === 'KeyR') {
        this.startRace();
      }
    });

    document.addEventListener('keyup', (e) => {
      const action = keyMap[e.code];
      if (action) {
        this.input[action] = false;
        e.preventDefault();
      }
    });

    // Menu buttons
    document.getElementById('btn-start').addEventListener('click', () => this.startRace());
    document.getElementById('btn-demo').addEventListener('click', () => this.startDemo());
    document.getElementById('btn-restart').addEventListener('click', () => this.startRace());
  }

  startRace() {
    this.state = 'countdown';
    this.countdownTimer = 3.5;
    this.elapsedTime = 0;

    // Reset kart
    const startPoint = this.track.getStartPoint();
    const nextPoint = this.track.splinePoints[1];
    const startRot = Math.atan2(nextPoint.x - startPoint.x, nextPoint.z - startPoint.z);
    this.kart.setStartPoint(new THREE.Vector3(startPoint.x, 0, startPoint.z), startRot);

    this.demo.stop();
    this.updateScreens('race');
    this.showCountdown(3);
  }

  startDemo() {
    this.startRace();
    this.demo.start();
  }

  updateScreens(activeScreen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    if (activeScreen === 'menu') {
      document.getElementById('start-screen').classList.add('active');
    } else if (activeScreen === 'race') {
      document.getElementById('race-screen').classList.add('active');
    } else if (activeScreen === 'results') {
      document.getElementById('results-screen').classList.add('active');
    }
  }

  showCountdown(num) {
    const el = document.getElementById('countdown');
    el.style.display = 'block';
    el.textContent = num > 0 ? num : 'GO!';
    el.style.fontSize = num > 0 ? '80px' : '100px';
    el.style.color = num > 0 ? '#fff' : '#00ff00';
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  updateHUD() {
    if (!this.kart) return;

    document.getElementById('current-lap').textContent =
      Math.min(this.kart.lap, this.kart.totalLaps);
    document.getElementById('speed').textContent =
      Math.abs(Math.round(this.kart.speed * 5));
    document.getElementById('lap-time').textContent =
      formatTime(this.kart.lapTime || this.elapsedTime);
  }

  updateCamera(dt) {
    if (!this.kart) return;

    const kart = this.kart;
    const speed = Math.abs(kart.speed);

    // Dynamic camera: pulls back when going fast
    const camDist = 8 + speed * 0.15;
    const camHeight = 5 + speed * 0.04;

    const backward = new THREE.Vector3(
      -Math.sin(kart.rotation) * camDist,
      camHeight,
      -Math.cos(kart.rotation) * camDist
    );
    const desiredPos = kart.position.clone().add(backward);

    // Smooth follow
    const lerpF = Math.min(dt * (3 + speed * 0.04), 0.7);
    this.camera.position.lerp(desiredPos, lerpF);

    // Look slightly ahead of kart
    const lookAhead = new THREE.Vector3(
      Math.sin(kart.rotation) * 8,
      1.5,
      Math.cos(kart.rotation) * 8
    );
    const lookTarget = kart.position.clone().add(lookAhead);
    this.camera.lookAt(lookTarget);
  }

  checkOnTrack() {
    const onTrack = this.track.checkOnTrack(
      this.kart.position.x, this.kart.position.z
    ) >= 0;
    return onTrack;
  }

  loop() {
    requestAnimationFrame(() => this.loop());

    const dt = Math.min(this.clock.getDelta(), 0.05);

    if (this.state === 'menu') {
      // Slow orbit around the start area
      const time = this.clock.getElapsedTime();
      const orbitRadius = 25;
      const orbitAngle = time * 0.15;
      this.camera.position.set(
        this.track.getStartPoint().x + Math.sin(orbitAngle) * orbitRadius,
        18,
        this.track.getStartPoint().z + Math.cos(orbitAngle) * orbitRadius
      );
      this.camera.lookAt(this.track.getStartPoint().x, 0, this.track.getStartPoint().z);
      this.renderer.render(this.scene, this.camera);
      return;
    }

    if (this.state === 'countdown') {
      this.countdownTimer -= dt;
      this.elapsedTime += dt;

      if (this.countdownTimer > 0) {
        this.showCountdown(Math.ceil(this.countdownTimer));
      } else if (this.countdownTimer > -1) {
        this.showCountdown(0);
      } else {
        this.state = 'racing';
        this.kart.lapStartTime = this.elapsedTime;
        document.getElementById('countdown').style.display = 'none';
      }

      // Demo mode drives during countdown
      if (this.demo.active) {
        this.demo.update(this.kart);
        this.kart.update(dt, this.demo.input, true);
      }

      this.updateCamera(dt);
      this.renderer.render(this.scene, this.camera);
      return;
    }

    if (this.state === 'racing') {
      this.elapsedTime += dt;

      // Demo input override
      const activeInput = { ...this.input };
      if (this.demo.active) {
        this.demo.update(this.kart);
        activeInput.up = this.demo.input.up;
        activeInput.left = this.demo.input.left;
        activeInput.right = this.demo.input.right;
        activeInput.down = this.demo.input.down;
        activeInput.drift = this.demo.input.drift;
      }

      const onTrack = this.checkOnTrack();
      this.kart.update(dt, activeInput, onTrack);
      this.kart.updateLaps(this.track, this.elapsedTime);

      if (this.kart.finished) {
        this.state = 'finished';
        this.updateScreens('results');
        document.getElementById('final-time').innerHTML =
          `<p style="font-size:2em;color:#FFD700">Total Time: ${formatTime(this.kart.totalTime)}</p>
           <p>Best Lap: ${formatTime(this.kart.bestLap)}</p>`;
      }
    }

    if (this.state === 'finished') {
      // Celebration camera orbit
      const time = this.clock.getElapsedTime();
      const orbitR = 15;
      const orbitA = time * 0.3;
      this.camera.position.set(
        this.kart.position.x + Math.sin(orbitA) * orbitR,
        10,
        this.kart.position.z + Math.cos(orbitA) * orbitR
      );
      this.camera.lookAt(this.kart.position.x, 2, this.kart.position.z);
      this.kart.speed *= 0.97;
    }

    if (this.state !== 'finished') {
      this.updateCamera(dt);
    }
    this.updateHUD();
    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});