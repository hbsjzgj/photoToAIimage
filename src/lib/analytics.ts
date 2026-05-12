// Client-side analytics abstraction — do not import in server components.
// All calls are no-ops in development or when NEXT_PUBLIC_POSTHOG_KEY is unset.

import posthog from 'posthog-js';

const ENABLED =
  process.env.NODE_ENV === 'production' &&
  !!process.env.NEXT_PUBLIC_POSTHOG_KEY;

function track(event: string, props?: Record<string, unknown>): void {
  if (!ENABLED) return;
  try {
    posthog.capture(event, props);
  } catch {
    // Analytics must never throw
  }
}

// ── Event helpers ───────────────────────────────────────────────────────────
// Explicitly list only safe props — never log image data, base64, or prompts.

export const analytics = {
  /** File picker opened or drag-drop accepted */
  uploadStarted: () =>
    track('upload_started'),

  /** User clicked a style card */
  styleSelected: (style: string) =>
    track('style_selected', { style }),

  /** Generate button pressed */
  generationStarted: (props: { style: string; mode: 'free' | 'paid' }) =>
    track('generation_started', props),

  /** API returned a successful result */
  generationSuccess: (props: {
    style: string;
    provider: string;
    durationMs?: number;
    mode: 'free' | 'paid';
  }) =>
    track('generation_success', {
      style: props.style,
      provider: props.provider,
      duration_ms: props.durationMs,
      mode: props.mode,
    }),

  /** API returned an error or request was aborted */
  generationFailed: (props: { style: string; mode: 'free' | 'paid'; error: string }) =>
    track('generation_failed', props),

  /** /pricing page rendered */
  pricingViewed: () =>
    track('pricing_viewed'),

  /** User clicked a "Buy" button and is being redirected to Stripe */
  purchaseStarted: (props: { package: string; credits: number }) =>
    track('purchase_started', props),

  /** Registration form submitted successfully */
  signupCompleted: () =>
    track('signup_completed'),

  /** Sign-in succeeded */
  loginCompleted: () =>
    track('login_completed'),
};
