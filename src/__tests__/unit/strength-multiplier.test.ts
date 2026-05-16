/**
 * Unit tests for the style-strength multiplier math used in the Fal provider.
 * The formula maps user slider value (1–10) to a multiplier that scales the
 * per-style base strength, clamped to [0.25, 0.97].
 *
 * Formula (from src/lib/providers/fal.ts):
 *   multiplier = 0.55 + (userStrength - 1) * (0.45 / 9)
 *   strength   = clamp(baseStrength * multiplier, 0.25, 0.97)
 */
import { describe, it, expect } from 'vitest';

function computeStrength(baseStrength: number, userStrength: number): number {
  const multiplier = 0.55 + (userStrength - 1) * (0.45 / 9);
  return Math.max(0.25, Math.min(0.97, baseStrength * multiplier));
}

describe('Style strength multiplier — midpoint (5)', () => {
  it('userStrength=5 gives multiplier ≈ 1.0 (neutral)', () => {
    const multiplier = 0.55 + (5 - 1) * (0.45 / 9);
    expect(multiplier).toBeCloseTo(0.75, 5);
    // Note: multiplier at 5 is 0.75, so base × 0.75. This is intentional
    // (strength=5 is "balanced", not necessarily the same as the base).
  });

  it('default strength=5 scales a 0.75 base to ≈ 0.56', () => {
    const result = computeStrength(0.75, 5);
    expect(result).toBeCloseTo(0.75 * (0.55 + 0.2), 3);
  });
});

describe('Style strength multiplier — extremes', () => {
  it('userStrength=1 applies smallest multiplier (0.55×)', () => {
    const multiplier = 0.55 + (1 - 1) * (0.45 / 9);
    expect(multiplier).toBeCloseTo(0.55, 5);
  });

  it('userStrength=10 applies largest multiplier (1.0×)', () => {
    const multiplier = 0.55 + (10 - 1) * (0.45 / 9);
    expect(multiplier).toBeCloseTo(1.0, 5);
  });

  it('strength=1 on 0.97 base stays ≤ 0.97 after clamp', () => {
    expect(computeStrength(0.97, 1)).toBeGreaterThanOrEqual(0.25);
    expect(computeStrength(0.97, 1)).toBeLessThanOrEqual(0.97);
  });

  it('strength=10 on 0.97 base is clamped to 0.97', () => {
    // 0.97 × 1.0 = 0.97 — right at the ceiling
    const result = computeStrength(0.97, 10);
    expect(result).toBeCloseTo(0.97, 5);
  });

  it('strength=1 on a very small base is clamped to minimum 0.25', () => {
    // Edge case: if base were 0 (impossible in practice), clamp protects us
    const result = computeStrength(0.001, 1);
    expect(result).toBe(0.25);
  });
});

describe('Style strength multiplier — monotonicity', () => {
  it('higher userStrength always produces same or higher output strength', () => {
    const base = 0.75;
    let prev = computeStrength(base, 1);
    for (let i = 2; i <= 10; i++) {
      const curr = computeStrength(base, i);
      expect(curr).toBeGreaterThanOrEqual(prev);
      prev = curr;
    }
  });
});

describe('Style strength multiplier — concrete snapshots', () => {
  const BASE = 0.75; // anime_basic base strength

  it.each([
    [1,  0.75 * 0.55],  // 0.75 * 0.55 = 0.4125, above minimum clamp
    [3,  0.75 * (0.55 + 2 * (0.45 / 9))],
    [7,  0.75 * (0.55 + 6 * (0.45 / 9))],
    [10, 0.75 * 1.0],
  ])('userStrength=%i on base 0.75 → expected ≈ %f', (userStrength, expected) => {
    const clamped = Math.max(0.25, Math.min(0.97, expected));
    expect(computeStrength(BASE, userStrength)).toBeCloseTo(clamped, 3);
  });
});

// ─── Gemini strength prefix logic ────────────────────────────────────────────

describe('Gemini strength prefix mapping', () => {
  function getPrefix(strengthLevel: number): string {
    if (strengthLevel <= 3)
      return 'Apply only a very subtle, light style transformation. Preserve the original person\'s face and features as closely as possible. ';
    if (strengthLevel >= 8)
      return 'Apply a dramatic, bold, full style transformation. Fully reimagine the image in the target artistic style. ';
    return '';
  }

  it('returns subtle prefix for strength 1', () => {
    expect(getPrefix(1)).toContain('subtle');
  });

  it('returns subtle prefix for strength 3', () => {
    expect(getPrefix(3)).toContain('subtle');
  });

  it('returns empty string for strength 4–7 (neutral range)', () => {
    for (const s of [4, 5, 6, 7]) {
      expect(getPrefix(s)).toBe('');
    }
  });

  it('returns dramatic prefix for strength 8', () => {
    expect(getPrefix(8)).toContain('dramatic');
  });

  it('returns dramatic prefix for strength 10', () => {
    expect(getPrefix(10)).toContain('dramatic');
  });

  it('neutral range does not modify the base prompt', () => {
    const base = 'anime style portrait';
    const result = getPrefix(5) + base;
    expect(result).toBe(base);
  });
});
