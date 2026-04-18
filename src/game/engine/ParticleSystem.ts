import { GameState } from "../state/GameState";

export function updateParticles(g: GameState) {
  g.particles = g.particles.filter((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    p.vy += 0.05;
    return p.life > 0;
  });
  g.floatingTexts = g.floatingTexts.filter((t) => {
    t.y -= 0.8;
    t.life--;
    return t.life > 0;
  });
}
