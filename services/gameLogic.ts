import { Kite, Vector2D, PechaState } from '../types';
import { GAME_CONSTANTS } from '../constants';

export const updateKitePhysics = (kite: Kite, wind: Vector2D): Kite => {
  if (kite.isCut) {
    return {
      ...kite,
      pos: {
        x: kite.pos.x + wind.x * 8,
        y: kite.pos.y + 2.5 
      },
      angle: kite.angle + 0.04
    };
  }

  const dx = kite.targetPos.x - kite.pos.x;
  const dy = kite.targetPos.y - kite.pos.y;

  const ax = dx * GAME_CONSTANTS.ACCELERATION;
  const ay = dy * GAME_CONSTANTS.ACCELERATION;

  let newVelX = (kite.vel.x + ax + wind.x) * GAME_CONSTANTS.FRICTION;
  let newVelY = (kite.vel.y + ay + wind.y) * GAME_CONSTANTS.FRICTION;

  const speed = Math.sqrt(newVelX * newVelX + newVelY * newVelY);
  if (speed > GAME_CONSTANTS.MAX_SPEED) {
    newVelX = (newVelX / speed) * GAME_CONSTANTS.MAX_SPEED;
    newVelY = (newVelY / speed) * GAME_CONSTANTS.MAX_SPEED;
  }

  let attackActive = kite.attackActive;
  if (attackActive && performance.now() > kite.attackEndTime) {
    attackActive = false;
  }

  return {
    ...kite,
    pos: {
      x: kite.pos.x + newVelX,
      y: kite.pos.y + newVelY
    },
    vel: { x: newVelX, y: newVelY },
    angle: Math.atan2(newVelY, newVelX) * 0.12,
    tension: 10 + Math.abs(newVelY) * 6,
    attackActive
  };
};

const lineIntersect = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): Vector2D | null => {
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (denom === 0) return null;
  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
  if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
    return {
      x: x1 + ua * (x2 - x1),
      y: y1 + ua * (y2 - y1)
    };
  }
  return null;
};

export const checkCollisions = (kites: Kite[]): { isIntersecting: boolean, point: Vector2D | null, pair: [string, string] } => {
  for (let i = 0; i < kites.length; i++) {
    for (let j = i + 1; j < kites.length; j++) {
      const k1 = kites[i];
      const k2 = kites[j];
      if (k1.isCut || k2.isCut) continue;

      const getAnchor = (k: Kite) => {
        if (k.id === 'player' || k.id.startsWith('local')) return GAME_CONSTANTS.CANVAS_WIDTH / 2;
        const seed = parseInt(k.id.replace(/[^0-9]/g, '') || '0');
        return (GAME_CONSTANTS.CANVAS_WIDTH / 6) * ((seed % 5) + 1);
      };

      const intersection = lineIntersect(
        getAnchor(k1), GAME_CONSTANTS.STRING_ANCHOR_Y, k1.pos.x, k1.pos.y,
        getAnchor(k2), GAME_CONSTANTS.STRING_ANCHOR_Y, k2.pos.x, k2.pos.y
      );

      if (intersection) return { isIntersecting: true, point: intersection, pair: [k1.id, k2.id] };
    }
  }
  return { isIntersecting: false, point: null, pair: ['', ''] };
};

export const handlePechaLogic = (
  kites: Kite[], 
  currentPecha: PechaState, 
  collision: any, 
  now: number
): { updatedKites: Kite[], updatedPecha: PechaState, cutMessage: string | null } => {
  
  let updatedPecha = { ...currentPecha };
  let updatedKites = [...kites];
  let cutMessage = null;

  if (collision.isIntersecting) {
    if (!updatedPecha.isIntersecting) {
      updatedPecha = { isIntersecting: true, contactStartTime: now, intersectPoint: collision.point, kites: collision.pair };
    } else {
      updatedPecha.intersectPoint = collision.point;
    }

    const contactDuration = now - (updatedPecha.contactStartTime || now);
    if (contactDuration > GAME_CONSTANTS.PECHA_CONTACT_TIME) {
      const k1 = updatedKites.find(k => k.id === updatedPecha.kites[0])!;
      const k2 = updatedKites.find(k => k.id === updatedPecha.kites[1])!;

      const resolvePecha = (attacker: Kite, defender: Kite) => {
        // Simplified Skill logic: If Attacking and higher up, you cut them.
        const heightAdvantage = attacker.pos.y < (defender.pos.y + 20); 
        
        if (attacker.attackActive && heightAdvantage) {
          defender.isCut = true;
          attacker.score += 1;
          cutMessage = `${attacker.name} CUT ${defender.name}!`;
          updatedPecha = { isIntersecting: false, contactStartTime: null, intersectPoint: null, kites: ['', ''] };
        }
      };

      if (k1.attackActive) resolvePecha(k1, k2);
      else if (k2.attackActive) resolvePecha(k2, k1);
      else if (k2.isAI && Math.random() < 0.02) {
         k2.attackActive = true;
         k2.attackEndTime = now + 1200;
         resolvePecha(k2, k1);
      }
    }
  } else {
    updatedPecha = { isIntersecting: false, contactStartTime: null, intersectPoint: null, kites: ['', ''] };
  }

  return { updatedKites, updatedPecha, cutMessage };
};