
export const GAME_CONSTANTS = {
  CANVAS_WIDTH: window.innerWidth,
  CANVAS_HEIGHT: window.innerHeight,
  KITE_SIZE: 42,
  MAX_SPEED: 3.2, 
  ACCELERATION: 0.07,
  FRICTION: 0.97,
  WIND_FORCE: 0.03,
  PECHA_CONTACT_TIME: 700, // Increased from 350ms to 700ms for easier reaction
  ATTACK_DURATION: 1200,
  ATTACK_COOLDOWN: 4500,
  STRING_ANCHOR_Y: window.innerHeight,
  COLORS: {
    PLAYER: '#00f2ff', // Cyan Neon
    SKY_TOP: '#020617', // Slate 950
    SKY_BOTTOM: '#1e1b4b', // Indigo 950
    NEON: ['#f472b6', '#4ade80', '#fbbf24', '#a78bfa', '#f87171']
  }
};

export const INITIAL_WIND = { x: 0.12, y: 0.04 };
