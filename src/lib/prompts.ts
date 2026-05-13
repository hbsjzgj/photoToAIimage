// ─────────────────────────────────────────────────────────────────────────────
// HIGH-QUALITY PROMPTS FOR FLUX DEV IMG2IMG
// CRITICAL: Each prompt MUST start with the style-type keyword (e.g. "2D anime
// illustration,", "3D CGI render,", "flat vector icon,") — FLUX weights the
// earliest tokens most heavily. Instruction preambles ("Transform this into...")
// are NOT effective on diffusion models and must NOT be used.
// ─────────────────────────────────────────────────────────────────────────────

const BASE_NEGATIVE =
  'ugly, disfigured, deformed, extra limbs, blurry, low resolution, jpeg artifacts, watermark, text, logo, username, signature';

const STYLE_NEGATIVE: Record<string, string> = {
  anime_basic:
    `${BASE_NEGATIVE}, 3D rendered, 3D CGI, photorealistic, hyper-realistic, subsurface scattering, volumetric 3D lighting, realistic fur, depth of field photography`,
  anime_pro:
    `${BASE_NEGATIVE}, 3D rendered, 3D CGI, photorealistic, realistic photography, soft cheerful pastel, low contrast, flat lighting`,
  soft_cartoon:
    `${BASE_NEGATIVE}, 3D rendered, photorealistic, hyper-realistic, bold ink outlines, dark moody, neon colors, sharp hard edges`,
  cute_pet:
    `${BASE_NEGATIVE}, 3D rendered, photorealistic, hyper-realistic, realistic animal photography, dark atmosphere, adult proportions, scary`,
  simple_icon:
    `${BASE_NEGATIVE}, 3D, photorealistic, gradients, shadows, realistic texture, detailed background, anime style, more than 3 colors, complex illustration`,
  '3d_cartoon':
    `${BASE_NEGATIVE}, flat 2D illustration, anime linework, manga style, hand-drawn, watercolor, realistic photography, harsh shadows`,
  soft_storybook:
    `${BASE_NEGATIVE}, 3D rendered, photorealistic, sharp digital art, neon colors, dark gritty atmosphere, bold heavy outlines, anime style`,
  cyberpunk:
    `${BASE_NEGATIVE}, cute kawaii, pastel colors, soft warm lighting, bright cheerful, cartoon flat, watercolor, natural photography`,
  comic_hero:
    `${BASE_NEGATIVE}, 3D rendered, photorealistic, soft anime style, watercolor, pastel, realistic skin texture, subtle lighting`,
  fashion_avatar:
    `${BASE_NEGATIVE}, cartoon, anime, illustrated, painted, 2D flat, sketch, cold harsh lighting, unflattering angle, poor exposure`,
  business_profile:
    `${BASE_NEGATIVE}, cartoon, anime, illustrated, dramatic artistic lighting, warm orange tones, overly stylized, heavy retouching`,
  pet_portrait_pro:
    `${BASE_NEGATIVE}, cartoon, flat illustration, anime style, childish, low detail fur, flat lighting, plain background`,
  couple_avatar:
    `${BASE_NEGATIVE}, 3D rendered, photorealistic, dark moody, single subject, cold tones, no romance, harsh lighting`,
  kawaii_icon:
    `${BASE_NEGATIVE}, 3D rendered, photorealistic, realistic fur, realistic skin, dark colors, complex detailed background, adult proportions, scary`,
};

const STYLE_CORE: Record<string, string> = {

  // ── FREE STYLES ──────────────────────────────────────────────────────────

  anime_basic: `
2D Japanese anime illustration, beautifully polished, premium Korean webtoon style.
SKIN: flat cel-shading in warm peach-rose tones, crisp medium-weight black outlines, a single shadow pass in cooler rose-mauve applied to the underside of the chin, hair, and below the brow.
EYES: enlarged expressive anime eyes — warm chestnut-brown irises with a radial gradient deepening toward the outer ring, a crisp white oval catchlight at 10 o'clock, clean double-eyelash stroke rendering, subtle lower lash marks.
HAIR: flowing silk-smooth 2D strands in warm honey-amber, highlights drawn as clean curved white streaks, shadow areas filled with a flat deeper amber tone, no photo-realistic shading.
LIGHTING: gentle soft-box diffusion from the upper left, painting a soft crescent shadow on the right cheek. The lit zone glows warm peach-ivory.
PALETTE: warm rose, cream, soft peach, honey amber, muted sage-green accents.
BACKGROUND: simplified into a soft warm-tone gradient wash — no hard details, no photographic elements.
STYLE: pure 2D flat illustration, no 3D rendering, no subsurface scattering, no photorealism.`,

  cute_pet: `
2D kawaii anime animal character illustration, irresistibly adorable, Sanrio studio quality.
FACE: rounded and softened into chibi-kawaii proportions — cheeks plumped and widened; nose reduced to a tiny triangle button; eyes dramatically enlarged to 35–40% of the face, filled with enormous sparkling irises featuring star-burst catchlights, heart-shaped reflection highlights at 11 o'clock, deep luminous pupils ringed with soft iris gradients in warm amber-honey.
EARS: two large soft rounded animal ears emerging from the top of the head in layered fluffy cream-white fur with pale-rose inner ear coloring.
CHEEKS: soft circular pink blush marks gradient-faded toward the edges.
PALETTE: warm cream-white, soft peach-pink, honey gold, pastel sky-blue accents. Fully saturated, warm, joyful.
LIGHTING: warm soft-box diffusion from directly above with a secondary rim light creating an angelic glow on ear edges.
BACKGROUND: dreamy kawaii world — soft pastel gradient (lavender-to-peach) with tiny floating stars, hearts, and sparkle particle effects.
STYLE: pure 2D flat illustration, no 3D rendering, no photorealism.`,

  soft_cartoon: `
2D watercolor and colored-pencil illustration, exquisitely delicate, luxury beauty editorial style — Vogue Japan or Shiseido campaign art.
LINES: extremely fine, feather-light pencil strokes with variable pressure — confident clean edges, interior details barely visible, some lines fading to nothing. No bold outlines.
COLOR: thin transparent washes layered gradually over an off-white base — pale ivory-cream first, then soft rose on lips and cheeks, cool mauve for eye shadow, warm honey in hair warmth zones, sky blue for irises.
TEXTURE: the faint grain of cold-press watercolor paper visible through all layers. Organic, handmade quality.
LIGHTING: extremely soft and directionless — like overcast daylight filtered through translucent paper. No hard shadows.
HAIR: suggested with loose gestural strokes rather than individual strands.
BACKGROUND: dissolves into pale washes of the dominant color, utterly undefined.
PALETTE: ivory-cream, soft rose, cool mauve, warm honey, sky blue. Airy and elegant.
STYLE: pure 2D hand-drawn illustration, no 3D rendering, no photorealism.`,

  simple_icon: `
Flat graphic design icon, ultra-minimal, Saul Bass and Paul Rand mid-century modern poster style.
COLORS: exactly three flat solid colors, zero gradients: (1) warm terracotta-orange or burnt sienna background (#C4622D), (2) near-black dark brown silhouette (#1a0f0a), (3) a single pale cream or off-white accent (#F5EDD8). Nothing else.
FORM: the subject becomes a clean bold graphic silhouette — all photographic detail completely stripped away. Clean vector-like edge curves and flat fills only. Interior features suggested through negative-space cuts.
RULES: no gradients, no shadows, no drop shadows, no outlines between flat color zones, no textures. Colors meet as hard direct edges.
COMPOSITION: bold, graphic, iconic. The abstraction level of a road sign or brand logomark. Equally legible at 16px or 3 meters.
STYLE: flat 2D vector graphic, absolutely nothing photorealistic, no 3D.`,

  // ── PRO STYLES ───────────────────────────────────────────────────────────

  anime_pro: `
2D Japanese anime illustration, masterpiece quality — Demon Slayer, Jujutsu Kaisen, Violet Evergarden visual standard.
BACKGROUND: deep near-black (#08080f) gradient with barely-visible dark indigo depth. Atmosphere of focused dramatic intensity.
LIGHTING: a single powerful rim light source positioned directly behind and slightly above, creating a razor-thin luminous outline tracing the entire silhouette in electric blue-white. The face falls into dramatic three-quarter shadow — only the lit cheekbone, brow ridge, and nose tip catch the light.
EYES: extraordinary complexity — multiple concentric gradient rings in the iris (deep violet to gold to amber), luminous cat-slit pupils with inner glow, teardrop shine marks at 11 o'clock and 5 o'clock, three layers of lash work including under-lash detail.
HAIR: complex layered 2D strands with both highlight pass (near-white streaks catching the rim light) and shadow pass (cool blue-black depths). Hair appears to move with dramatic implied motion.
SKIN: sophisticated 2D cel technique — base tone, cool blue-purple shadow layer, near-white specular on the lit planes. All shading is flat passes.
STYLE: pure 2D flat illustration, no 3D rendering, no photorealism, no subsurface scattering.`,

  '3d_cartoon': `
3D CGI animated character render, Pixar and Illumination Entertainment feature-film quality.
SKIN/FUR: multi-layer subsurface scattering — warm amber undertones glow through thinner areas (earlobes, nose tip); fine pore detail and micro-texture catch the key light.
LIGHTING: warm amber key light at 45° upper-right casting soft directional shadows; cool blue-tinted fill at 1.5 stops under; warm orange rim light from behind edging the hair/fur with a warm halo.
HAIR/FUR: geometry-simulated strand clusters with anisotropic shading — shimmering along the length when catching the key light.
EYES: rounded 3D cornea geometry with a physically correct catchlight reflection; iris texture with visible layered depth; sclera slightly wet; enormous emotional expressiveness.
PROPORTIONS: larger eyes, rounder forehead, softer jaw structure — classic animation-studio adjustment for charm and approachability.
BACKGROUND: warm-lit 3D animated environment with smooth depth-of-field bokeh in amber, gold, and cream.
STYLE: full 3D CGI render, subsurface scattering, volumetric lighting, cinematic depth of field.`,

  soft_storybook: `
Hand-painted watercolor illustration, enchanting storybook style — Studio Ghibli background warmth combined with Arthur Rackham and Beatrix Potter watercolor tradition.
TECHNIQUE: wet-on-wet watercolor on cold-press 300gsm paper. First a warm ivory base wash; while still damp, drop in zones of soft rose, warm ochre, and cobalt blue-violet that bleed organically.
PAPER: cold-press grain clearly visible through paint in lighter areas — tangible proof of a handmade process.
SUBJECT: rendered with confident gestural looseness — eyes and lips suggested with three to five key strokes, hair as broad loose marks, detail dissolving at edges into soft pale washes.
BACKGROUND: atmospheric washes of soft color suggesting environment without hard definition — sage green, warm amber, violet-blue.
PALETTE: warm ivory, peach-rose, golden amber, muted sage green, soft violet-blue. No black. Shadows mixed from palette colors.
STYLE: hand-painted 2D watercolor illustration, no 3D rendering, no photorealism.`,

  cyberpunk: `
Cinematic cyberpunk portrait, Blade Runner 2049 atmospheric depth combined with Ghost in the Shell technical aesthetics.
BACKGROUND: near-black deep navy (#05060f) dissolving into atmospheric haze with neon-lit signage and motion-blurred distant light sources in electric blue and hot magenta, deeply out of focus.
LIGHTING: primary rim light in saturated electric magenta (#FF00AA) wrapping around the subject from behind-right; secondary cyan rim (#00E5FF) from behind-left; weak cold blue fill reveals minimal facial detail.
SKIN: appears damp, micro rain-droplets visible catching and refracting the neon rim lights.
CYBERNETICS: faint circuit-trace pattern in bioluminescent blue pulsing beneath temple skin; thin neural interface port at the neck base.
ATMOSPHERE: volumetric fog scattering neon frequencies into the air.
COLOR GRADE: desaturated film-noir base; only neon wavelengths (magenta, cyan, electric blue) retain full saturation.`,

  comic_hero: `
American superhero comic book illustration, 2D flat coloring — Alex Ross painted key cover quality combined with Jack Kirby dynamic graphic energy.
LINEWORK: bold confident black ink outlines with deliberate weight variation — thick strokes (3–4pt) at silhouette edges, medium strokes (1.5–2pt) for form definition, fine strokes (0.5pt) for interior detail.
COLOR: fully saturated flat comic coloring — cape in deep crimson (#CC0000), costume elements in cobalt blue (#0033AA), warm flat skin tones. Shadows are flat darker-value versions of each hue, not black.
HALFTONE: in the deepest shadow areas, classic printed-comics halftone dot pattern — circular dots at 30% coverage in a precise 45-degree grid.
HIGHLIGHTS: pure white without gradation.
BACKGROUND: bold complementary deep yellow-orange (#F5A623) with dramatic speed-line radiating composition.
STYLE: 2D comic book illustration, flat coloring, no 3D rendering, no photorealism.`,

  fashion_avatar: `
Ultra-luxury editorial fashion portrait photography — Vogue or System Magazine cover shoot standard, Mert & Marcus or Steven Meisel visual language.
LIGHTING: warm golden key light at 45° upper-right illuminating 60% of the face with a classic Rembrandt triangle; gentle reflector fill from the lower left at 2 stops under; warm hair backlight from directly behind. Catchlight: a clean soft-box oval at 11 o'clock.
SKIN: warm golden-amber tones, luminous and flawless with visible natural texture — fine pore detail, subtle skin variation. No plastic over-retouching.
COLOR GRADE: warm golden highlights, slightly desaturated mid-tones with lifted blacks (Kodak Portra 400 aesthetic), deep warm shadows.
DEPTH OF FIELD: sharp focus on the near eye, gentle falloff to the ear, background dissolving to warm golden bokeh spheres.
QUALITY: medium format editorial photography — extraordinary tonal range, effortless luxury. Shot on Phase One at 85mm.`,

  business_profile: `
Premium professional corporate headshot photography — Fortune 500 executive team photography standard, Peter Hurley or Lindsay Adler precision.
LIGHTING: impeccable three-point studio setup. Key: large octabox at 45° upper-right, clean oval catchlight at 11 o'clock in both eyes. Fill: white reflector panel at 1.5 stops under. Rim: subtle strip box from behind for shoulder separation. Pure neutral light temperature throughout.
SKIN: natural, healthy, polished. Professional retouching that removes blemishes while preserving authentic skin texture and visible pores.
EXPRESSION: composed, confident, approachable — projecting competence and trustworthiness.
BACKGROUND: seamless paper in professional light neutral gray, evenly lit with gentle vignette.
COLOR GRADE: clean neutral-to-slightly-cool toning, accurate skin tones, no stylized color shift.`,

  pet_portrait_pro: `
Hyperrealistic fine-art animal portrait photography — David Yarrow wildlife photography combined with classical animal portrait painting.
FUR DETAIL: each individual guard hair rendered at micro precision — direction of growth following natural flow patterns, fine whiskers with single-strand fidelity, layered undercoat visible where guard hairs part, translucent warmth of fur edges where backlight passes through. Every strand matters.
LIGHTING: dramatic Rembrandt portrait lighting — large warm key light at 45° upper-left; subtle cooler fill preserving shadow detail; warm backlight rim making fur perimeter glow with translucent warmth.
EYES: complex iris cellular texture, light rays through the pupil, perfect wet-cornea specular highlight, visible depth and emotional presence.
BACKGROUND: deep rich jewel-toned bokeh — dark forest greens, burgundy, and antique gold. Shot at f/1.4.
COLOR GRADE: rich warm tones in the fur, deep contrast in shadows.`,

  couple_avatar: `
Romantic 2D anime couple portrait illustration — premium visual novel key visual quality or top-tier Pixiv anniversary commission.
COMPOSITION: both subjects in intimate close composition, faces 30–40% overlapping or nearly touching.
CHARACTERS: expressive anime eyes for both — warm amber and rose iris gradients, long delicate lashes, double-lid shading. Hair in flowing smooth 2D strands with near-white highlight streaks and deep amber shadow passes.
LIGHTING: warm golden back-lighting from directly behind both subjects creating a luminous romantic halo; soft warm ambient front fill. The entire image glows warm.
PALETTE: rose-gold, warm amber, soft peach, ivory, pale champagne — entirely warm, entirely romantic. Not a single cool tone.
CEL-SHADING: base tone, warm shadow pass, airbrush-smooth specular layer — dimension without photorealism.
BACKGROUND: warm abstract bokeh — soft golden circles and rose-light glow.
STYLE: pure 2D flat illustration, no 3D rendering, no photorealism.`,

  kawaii_icon: `
Super-cute chibi anime icon character, 2D illustration — Sanrio character design studio or top-tier Japanese mobile game art department quality.
PROPORTIONS: extreme chibi ratio — head nearly as large as the entire body; face occupies 65% of head height; body compact, soft, rounded.
EYES: enormous, taking up 45–50% of the face. Iris in deep royal purple-blue with lighter concentric rings. Three highlight types: large oval catch-light at top-left, scattered star-burst sparkles, small heart-shaped reflection highlights. Deep glassy black pupils. The eyes must suggest crystalline infinite depth.
CHEEKS: soft circular blush marks gradient-faded from rose-pink to nothing. Just below the outer edge of each eye.
HAIR: pastel pale lavender-pink or baby blue, smooth rounded simplified shapes. A large decorative bow or hair ornament.
PALETTE: baby blue, pale lavender, rose pink, pearl white, minimal dark accents.
BACKGROUND: soft pastel gradient or simple repeating pattern of tiny hearts and stars.
STYLE: pure 2D flat illustration, no 3D rendering, no photorealism.`,
};

const QUALITY_SUFFIX =
  'Masterpiece quality. Ultra-detailed. Stunning visual impact. Best possible result.';

export function getPromptForStyle(styleId: string): { prompt: string; negativePrompt: string } {
  const core = (STYLE_CORE[styleId] ?? `${styleId} style`).trim();
  const neg = STYLE_NEGATIVE[styleId] ?? BASE_NEGATIVE;
  return {
    prompt: `${core}\n${QUALITY_SUFFIX}`,
    negativePrompt: neg,
  };
}

// Kept for any legacy callers — not used for display anymore (i18n handles that)
export const STYLE_DISPLAY_PROMPTS: Record<string, string> = {
  anime_basic:      'Clean anime portrait · soft lighting · expressive eyes',
  soft_cartoon:     'Soft premium cartoon · warm cinematic tones · elegant rendering',
  cute_pet:         'Adorable kawaii pet portrait · fluffy details · expressive eyes',
  simple_icon:      'Minimal flat illustration · clean modern app icon aesthetic',
  '3d_cartoon':     'Pixar-inspired 3D animated portrait · cinematic global illumination',
  anime_pro:        'Premium Japanese anime · cinematic rim lighting · high-end detail',
  soft_storybook:   'Dreamy watercolor storybook · whimsical mood · hand-painted texture',
  cyberpunk:        'Neon-lit cyberpunk portrait · futuristic atmosphere · holographic glow',
  comic_hero:       'Cinematic superhero portrait · dramatic lighting · graphic novel quality',
  fashion_avatar:   'Luxury fashion editorial · premium magazine aesthetic · elegant lighting',
  business_profile: 'Professional executive portrait · premium LinkedIn style · studio quality',
  pet_portrait_pro: 'Luxury pet portrait photography · cinematic studio lighting · rich warm tones',
  couple_avatar:    'Romantic couple portrait · cinematic emotional lighting · harmonious mood',
  kawaii_icon:      'Super cute Japanese kawaii icon · soft pastel palette · rounded modern design',
};

export interface ModelParams {
  strength: number;
  num_inference_steps: number;
  guidance_scale: number;
}

// FLUX dev img2img safe range: strength ≤ 0.78 preserves the input subject.
// Style fidelity comes from prompt quality, not from high strength.
export const STYLE_STRENGTH: Record<string, number> = {
  anime_basic:      0.75,
  anime_pro:        0.77,
  soft_cartoon:     0.74,
  cute_pet:         0.76,
  simple_icon:      0.76,
  '3d_cartoon':     0.76,
  soft_storybook:   0.74,
  cyberpunk:        0.77,
  comic_hero:       0.77,
  kawaii_icon:      0.76,
  couple_avatar:    0.74,
  fashion_avatar:   0.68,
  business_profile: 0.60,
  pet_portrait_pro: 0.72,
};

export const MODEL_PARAMS: Record<'free' | 'paid' | 'premium', ModelParams> = {
  free:    { strength: 0.75, num_inference_steps: 28, guidance_scale: 3.8 },
  paid:    { strength: 0.75, num_inference_steps: 35, guidance_scale: 4.0 },
  premium: { strength: 0.78, num_inference_steps: 40, guidance_scale: 4.5 },
};
