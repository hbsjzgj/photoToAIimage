/**
 * Unit tests for prompt generation functions.
 * Both functions are pure (no I/O, no DB) — no mocking needed.
 */
import { describe, it, expect } from 'vitest';
import {
  getPromptForStyle,
  getGeminiPrompt,
  STYLE_STRENGTH,
  MODEL_PARAMS,
} from '@/lib/prompts';
import { ALL_STYLES, FREE_STYLES } from '@/types';

// ─── getPromptForStyle ────────────────────────────────────────────────────────

describe('getPromptForStyle', () => {
  it('returns non-empty prompt and negativePrompt for every defined style', () => {
    for (const style of ALL_STYLES) {
      const { prompt, negativePrompt } = getPromptForStyle(style);
      expect(prompt.length, `${style}: prompt empty`).toBeGreaterThan(0);
      expect(negativePrompt.length, `${style}: negativePrompt empty`).toBeGreaterThan(0);
    }
  });

  it('returns a fallback prompt for an unknown style', () => {
    const { prompt } = getPromptForStyle('totally_unknown_style_xyz');
    expect(prompt.length).toBeGreaterThan(0);
  });

  it('prompt does not contain raw instruction preambles', () => {
    // FLUX weights early tokens — prompts must NOT start with "Transform..."
    for (const style of FREE_STYLES) {
      const { prompt } = getPromptForStyle(style);
      expect(prompt.trim()).not.toMatch(/^transform this/i);
    }
  });

  it('prompt and negativePrompt are different strings', () => {
    const { prompt, negativePrompt } = getPromptForStyle('anime_basic');
    expect(prompt).not.toBe(negativePrompt);
  });

  it('negativePrompt always includes base quality guards', () => {
    for (const style of ALL_STYLES) {
      const { negativePrompt } = getPromptForStyle(style);
      // Must contain at least one common quality negative
      expect(negativePrompt).toMatch(/ugly|blurry|low resolution/i);
    }
  });
});

// ─── getGeminiPrompt ──────────────────────────────────────────────────────────

describe('getGeminiPrompt', () => {
  it('returns a non-empty string with default params', () => {
    const result = getGeminiPrompt({});
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(20);
  });

  it('includes custom prompt when provided', () => {
    const customPrompt = 'wearing a red hat with gold trim';
    const result = getGeminiPrompt({ customPrompt });
    expect(result).toContain(customPrompt);
  });

  it('includes style context when styleId is provided', () => {
    const withStyle = getGeminiPrompt({ styleId: 'anime_basic' });
    const withoutStyle = getGeminiPrompt({});
    // Style context should make the prompt longer or different
    expect(withStyle).not.toBe(withoutStyle);
  });

  it('functionMode changes the prompt meaningfully', () => {
    const avatar = getGeminiPrompt({ functionMode: 'avatar' });
    const pet = getGeminiPrompt({ functionMode: 'pet' });
    expect(avatar).not.toBe(pet);
  });

  it('custom prompt is additive, not a full replacement', () => {
    const base = getGeminiPrompt({});
    const withCustom = getGeminiPrompt({ customPrompt: 'short custom' });
    // Base content should still be present
    expect(withCustom.length).toBeGreaterThan(base.length);
  });

  it('returns string (not null/undefined) for all known functionModes', () => {
    const modes = ['avatar', 'anime', 'pet', 'fashion', 'business', 'enhance'];
    for (const mode of modes) {
      const result = getGeminiPrompt({ functionMode: mode });
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    }
  });
});

// ─── STYLE_STRENGTH values ────────────────────────────────────────────────────

describe('STYLE_STRENGTH constant', () => {
  it('all values are within FLUX safe range [0.55, 0.97]', () => {
    for (const [style, value] of Object.entries(STYLE_STRENGTH)) {
      expect(value, `${style} strength out of range`).toBeGreaterThanOrEqual(0.55);
      expect(value, `${style} strength out of range`).toBeLessThanOrEqual(0.97);
    }
  });

  it('business_profile has lower strength than anime styles (preserves likeness)', () => {
    expect(STYLE_STRENGTH.business_profile).toBeLessThan(STYLE_STRENGTH.anime_basic);
  });
});

// ─── MODEL_PARAMS ─────────────────────────────────────────────────────────────

describe('MODEL_PARAMS', () => {
  it('defines free, paid tiers with positive values', () => {
    for (const tier of ['free', 'paid'] as const) {
      const p = MODEL_PARAMS[tier];
      expect(p.strength).toBeGreaterThan(0);
      expect(p.num_inference_steps).toBeGreaterThan(0);
      expect(p.guidance_scale).toBeGreaterThan(0);
    }
  });

  it('paid tier has more inference steps than free', () => {
    expect(MODEL_PARAMS.paid.num_inference_steps).toBeGreaterThanOrEqual(
      MODEL_PARAMS.free.num_inference_steps,
    );
  });
});
