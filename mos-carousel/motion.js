export class CarouselMotion {
  constructor({ reduced = false } = {}) {
    this.angle = 0;
    this.velocity = 0;
    this.dragging = false;
    this.hovered = false;
    this.reduced = reduced;
  }
  tick(dt) {
    dt = Math.max(0, Math.min(dt, .05));
    if (this.dragging || this.hovered) return;
    const decay = Math.exp(-4 * dt);
    this.angle += this.velocity * (1 - decay) / 4;
    this.velocity *= decay;
    if (!this.reduced) this.angle += .045 * dt;
    this.angle %= Math.PI * 2;
  }
  begin(x, time) {
    this.dragging = true;
    this.hovered = false;
    this.velocity = 0;
    this.lastX = x;
    this.lastTime = time;
  }
  move(x, time) {
    if (!this.dragging) return;
    const delta = (x - this.lastX) * .0025;
    const seconds = Math.max((time - this.lastTime) / 1000, .008);
    this.angle += delta;
    this.velocity = Math.max(-2.5, Math.min(2.5, delta / seconds));
    this.lastX = x;
    this.lastTime = time;
  }
  end() { this.dragging = false; }
}
