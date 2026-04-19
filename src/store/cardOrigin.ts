/**
 * Module-level store for the tapped trip card's screen position.
 * Set before navigating to trip detail so the entering animation
 * can zoom from the exact card origin.
 */
const _origin = { x: 0, y: 0, w: 300, h: 80 };

export function setCardOrigin(x: number, y: number, w: number, h: number) {
  _origin.x = x;
  _origin.y = y;
  _origin.w = w;
  _origin.h = h;
}

export function getCardOrigin() {
  return { ..._origin };
}
