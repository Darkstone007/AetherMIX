// =====================================================
// AETHER VISUAL SYSTEM (FIXED + ENHANCED)
// - Audio reactive visuals
// - MIDI controlled intensity (encoder)
// - ESP32 button + slider integration
// =====================================================


// ===================== AUDIO =====================
let mic;
let fft;

// ===================== MIDI =====================
let midiIntensity = 0;   // encoder (0–127 mapped)

// ===================== VISUAL STATE =====================
let particles = [];

let bassSmooth = 0;
let midSmooth = 0;
let trebleSmooth = 0;

// intensity master control
let intensity = 0.5;

// rotation
let rot = 0;


// ===================== SETUP =====================
function setup() {

  createCanvas(windowWidth, windowHeight);

  background(0);

  // AUDIO INPUT (BlackHole)
  mic = new p5.AudioIn();
  mic.start();

  fft = new p5.FFT(0.85, 1024);
  fft.setInput(mic);

  // particles
  for (let i = 0; i < 400; i++) {
    particles.push(new Particle());
  }

  // MIDI init
  setupMIDI();
}


// ===================== MIDI SETUP =====================
function setupMIDI() {

  if (navigator.requestMIDIAccess) {

    navigator.requestMIDIAccess().then(onMIDISuccess);
  }
}

function onMIDISuccess(midiAccess) {

  for (let input of midiAccess.inputs.values()) {

    input.onmidimessage = gotMIDI;
  }
}


// ===================== MIDI INPUT =====================
function gotMIDI(event) {

  let [status, cc, value] = event.data;

  // encoder controls intensity
  if (cc === 30) {

    midiIntensity = value;

    // KEY FIX:
    intensity = map(midiIntensity, 0, 127, 0.1, 2.5);
  }
}


// ===================== DRAW =====================
function draw() {

  background(0, 20);

  let spectrum = fft.analyze();

  let bass = fft.getEnergy("bass");
  let mid = fft.getEnergy("mid");
  let treble = fft.getEnergy("treble");

  bassSmooth = lerp(bassSmooth, bass, 0.2);
  midSmooth = lerp(midSmooth, mid, 0.2);
  trebleSmooth = lerp(trebleSmooth, treble, 0.2);

  rot += bassSmooth * 0.0005;

  // APPLY INTENSITY GLOBALLY
  let i = intensity;

  drawCoreOrb(i);
  drawFog(i);
  drawParticles(i);
  drawSpectrum(i);
  drawWave(i);
}


// ===================== CORE ORB =====================
function drawCoreOrb(i) {

  push();

  translate(width / 2, height / 2);
  rotate(rot);

  noStroke();

  let size = bassSmooth * i * 3;

  fill(200 + trebleSmooth, 50, 255, 180);

  ellipse(0, 0, size);

  fill(255, 100, 200, 80);

  ellipse(0, 0, size * 1.6);

  pop();
}


// ===================== FOG =====================
function drawFog(i) {

  noStroke();

  for (let j = 0; j < 6 * i; j++) {

    fill(80, 80, 120, 20);

    ellipse(
      random(width),
      random(height),
      midSmooth * i
    );
  }
}


// ===================== PARTICLES =====================
function drawParticles(i) {

  for (let p of particles) {

    p.update(i);
    p.show(i);
  }
}


// ===================== SPECTRUM BARS =====================
function drawSpectrum(i) {

  let spectrum = fft.analyze();

  noStroke();

  for (let k = 0; k < spectrum.length; k += 10) {

    let x = map(k, 0, spectrum.length, 0, width);

    let h = map(spectrum[k], 0, 255, 0, height * i);

    fill(100 + spectrum[k], 50, 255, 120);

    rect(x, height, 4 * i, -h);
  }
}


// ===================== WAVE =====================
function drawWave(i) {

  let wave = fft.waveform();

  noFill();
  stroke(255, 150);
  strokeWeight(2);

  beginShape();

  for (let k = 0; k < wave.length; k++) {

    let x = map(k, 0, wave.length, 0, width);
    let y = height / 2 + wave[k] * height * i;

    vertex(x, y);
  }

  endShape();
}


// ===================== PARTICLE CLASS =====================
class Particle {

  constructor() {
    this.reset();
  }

  reset() {
    this.x = random(width);
    this.y = random(height);
    this.vx = random(-2, 2);
    this.vy = random(-2, 2);
    this.s = random(2, 6);
  }

  update(i) {

    this.x += this.vx * i;
    this.y += this.vy * i;

    if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
      this.reset();
    }
  }

  show(i) {

    noStroke();

    fill(255, 200, 255, 100 * i);

    circle(this.x, this.y, this.s * i);
  }
}