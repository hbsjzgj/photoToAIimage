// ─────────────────────────────────────────────────────────────────────────────
// HIGH-QUALITY PROMPTS FOR FLUX DEV IMG2IMG
// Each prompt is 150-250 words, covering:
//   - Precise lighting setup (key/fill/rim angles, color temperature)
//   - Exact color palette with descriptive specifics
//   - Material/rendering technique (cel-shading passes, subsurface scattering, etc.)
//   - Eye, hair, skin detail instructions
//   - Artist/studio reference anchors the model recognizes
//   - Mood/atmosphere and composition language
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
Repaint this image as a beautifully polished 2D Japanese anime illustration in premium webtoon style.
SKIN: flat cel-shading in warm peach-rose tones, crisp medium-weight black outlines, a single shadow pass in cooler rose-mauve applied to the underside of the chin, hair, and below the brow.
EYES: enlarged expressive anime eyes — warm chestnut-brown irises with a radial gradient deepening toward the outer ring, a crisp white oval catchlight at 10 o'clock, clean double-eyelash stroke rendering, subtle lower lash marks.
HAIR: flowing silk-smooth 2D strands in warm honey-amber, highlights drawn as clean curved white streaks, shadow areas filled with a flat deeper amber tone, no photo-realistic shading.
LIGHTING: gentle soft-box diffusion from the upper left, painting a soft crescent shadow on the right cheek. The lit zone glows warm peach-ivory.
PALETTE: warm rose, cream, soft peach, honey amber, muted sage-green accents.
BACKGROUND: simplified into a soft warm-tone gradient wash — no hard details, no photographic elements.
QUALITY: premium Korean webtoon / Japanese light-novel cover illustration standard. Clean, romantic, beautifully crafted. Pure 2D. No 3D rendering.`,

  cute_pet: `
Transform the subject into an irresistibly adorable Japanese kawaii anime animal character.
FACE: rounded and softened into chibi-kawaii proportions — cheeks plumped and widened; nose reduced to a tiny triangle button; eyes dramatically enlarged to 35–40% of the face, filled with enormous sparkling irises featuring star-burst catchlights, heart-shaped reflection highlights at 11 o'clock, deep luminous pupils ringed with soft iris gradients in warm amber-honey.
EARS: two large soft rounded animal ears emerging from the top of the head in layered fluffy cream-white fur with pale-rose inner ear coloring. Fine fur direction marks suggest the texture.
CHEEKS: soft circular pink blush marks gradient-faded toward the edges.
PALETTE: warm cream-white, soft peach-pink, honey gold, pastel sky-blue accents. Fully saturated, warm, joyful.
LIGHTING: warm soft-box diffusion from directly above with a secondary rim light creating an angelic glow on ear edges. No harsh shadows.
BACKGROUND: dreamy kawaii world — soft pastel gradient (lavender-to-peach) with tiny floating stars, hearts, and sparkle particle effects. Out-of-focus.
QUALITY: Sanrio studio + premium anime character design. Pure 2D illustration.`,

  soft_cartoon: `
Transform this image into an exquisitely delicate 2D illustration blending colored pencil with translucent watercolor — the visual language of luxury beauty editorial illustration seen in Vogue Japan or Shiseido campaign art.
LINES: extremely fine, feather-light pencil strokes with variable pressure — confident clean edges, interior details barely visible, some lines fading to nothing. No bold outlines.
COLOR: thin transparent washes layered gradually over an off-white base — pale ivory-cream first, then soft rose on lips and cheeks, cool mauve for eye shadow, warm honey in hair warmth zones, sky blue for irises. Multiple overlapping washes create unexpected chromatic depth at the eyes and hair.
TEXTURE: the faint grain of cold-press watercolor paper visible through all layers. Organic, handmade quality.
LIGHTING: extremely soft and directionless — like overcast daylight filtered through translucent paper. No hard shadows.
HAIR: suggested with loose gestural strokes rather than individual strands.
BACKGROUND: dissolves into pale washes of the dominant color, utterly undefined.
PALETTE: ivory-cream, soft rose, cool mauve, warm honey, sky blue. Airy and elegant.
QUALITY: the emotional tone is delicate, sophisticated, and effortlessly beautiful. Pure 2D.`,

  simple_icon: `
Transform this image into an ultra-minimal flat graphic design icon in the tradition of Saul Bass, Paul Rand, and mid-century modern poster design.
COLORS: exactly three flat solid colors, zero gradients: (1) warm terracotta-orange or burnt sienna background (#C4622D), (2) near-black dark brown silhouette (#1a0f0a), (3) a single pale cream or off-white accent (#F5EDD8). Nothing else.
FORM: the subject becomes a clean bold graphic silhouette — all photographic detail completely stripped away. Clean vector-like edge curves and flat fills only. Interior features suggested through negative-space cuts: eyes as two simple white oval openings in the silhouette, the shoulder line as one clean flowing curve.
RULES: no gradients, no shadows, no drop shadows, no outlines between flat color zones, no textures, no gradients. Colors meet as hard direct edges.
COMPOSITION: bold, graphic, iconic. The abstraction level of a road sign or brand logomark. Equally legible at 16px or 3 meters. Subject centered with generous negative space.
QUALITY: the design standard of a professionally commissioned brand identity logomark or classic mid-century film poster. Absolutely nothing photorealistic.`,

  // ── PRO STYLES ───────────────────────────────────────────────────────────

  anime_pro: `
Transform this image into a breathtaking masterpiece-quality 2D Japanese anime illustration — the visual standard of key visuals for Demon Slayer, Jujutsu Kaisen, or Violet Evergarden.
BACKGROUND: deep near-black (#08080f) gradient with barely-visible dark indigo depth. Atmosphere of focused dramatic intensity.
LIGHTING: a single powerful rim light source positioned directly behind and slightly above, creating a razor-thin luminous outline tracing the entire silhouette in electric blue-white. The face falls into dramatic three-quarter shadow — only the lit cheekbone, brow ridge, and nose tip catch the light. Secondary cold-blue fill prevents complete blackout without reducing drama.
EYES: extraordinary complexity — multiple concentric gradient rings in the iris (deep violet to gold to amber), luminous cat-slit pupils with inner glow, teardrop shine marks at 11 o'clock and 5 o'clock, three layers of lash work including under-lash detail, glassy depth suggesting emotion and intelligence.
HAIR: complex layered 2D strands with both highlight pass (near-white streaks catching the rim light) and shadow pass (cool blue-black depths). Hair appears to move with dramatic implied motion.
SKIN: sophisticated 2D cel technique — base tone, cool blue-purple shadow layer, near-white specular on the lit planes. No gradients; all shading is flat passes.
QUALITY: premium anime series key visual / artstation masterpiece tier. Pure 2D. No 3D.`,

  '3d_cartoon': `
Transform this image into a stunningly detailed 3D CGI animated character render at Pixar or Illumination Entertainment feature-film quality.
SKIN/FUR: multi-layer subsurface scattering — warm amber undertones glow through thinner areas (earlobes, nose tip); the surface shows fine pore detail and micro-texture that catches the key light.
LIGHTING: warm amber key light at 45° upper-right casting soft directional shadows that reveal three-dimensional sculptural form; cool blue-tinted fill at 1.5 stops under from the opposite side; warm orange rim light from behind separating the character from the background and edging the hair/fur with a warm halo.
HAIR/FUR: geometry-simulated strand clusters with anisotropic shading — shimmering along the length when catching the key light, falling into warm shadow on the opposite side.
EYES: rounded 3D cornea geometry with a physically correct catchlight reflection of the studio light array; iris texture with visible layered depth; sclera slightly wet with micro vascular detail; enormous emotional expressiveness.
PROPORTIONS: character proportions softened with the classic animation-studio adjustment — larger eyes, rounder forehead, softer jaw structure, charming and approachable.
BACKGROUND: warm-lit 3D animated environment with smooth depth-of-field bokeh in amber, gold, and cream.
QUALITY: final frame from a Pixar or Illumination feature release. Cinematic 3D render.`,

  soft_storybook: `
Transform this image into an enchanting hand-painted watercolor illustration evoking Studio Ghibli background painting warmth combined with the intimate delicacy of Arthur Rackham or Beatrix Potter's watercolor tradition.
TECHNIQUE: wet-on-wet watercolor on cold-press 300gsm paper. First a warm ivory base wash over the full composition; while still damp, drop in zones of soft rose, warm ochre, and cobalt blue-violet that bleed organically, creating luminous soft-edge transitions. Multiple transparent glazes layered for depth at eyes and hair.
PAPER: cold-press grain clearly visible through paint in lighter areas — this texture is part of the artwork, tangible proof of a handmade process.
SUBJECT: rendered with confident gestural looseness — eyes and lips suggested with three to five key strokes, skin as layered color washes, hair as broad loose marks, detail dissolving at edges into soft pale washes.
BACKGROUND: atmospheric washes of soft color suggesting environment without hard definition — translucent glazes of sage green, warm amber, violet-blue suggesting trees or light-filled interior space.
PALETTE: warm ivory, peach-rose, golden amber, muted sage green, soft violet-blue. No black. Shadows mixed from the palette colors, never from black pigment.
LIGHTING: expressed through wash density — thin transparent layers where light falls, richer pigment saturation in shadow areas.
QUALITY: master-level traditional watercolor illustration. Warm, magical, deeply nostalgic.`,

  cyberpunk: `
Transform this image into a visually stunning cinematic cyberpunk portrait combining Blade Runner 2049's atmospheric depth with Ghost in the Shell's technical aesthetics.
BACKGROUND: near-black deep navy (#05060f) dissolving into atmospheric haze. Suggestions of neon-lit signage and motion-blurred distant light sources in electric blue and hot magenta, all deeply out of focus.
LIGHTING: primary rim light in saturated electric magenta (#FF00AA) wrapping around the subject from behind-right, creating a hard glowing edge that bleeds into atmospheric haze; secondary cyan rim (#00E5FF) from behind-left adding complementary cool edge; weak cold blue fill reveals minimal facial detail. Together they produce a narrow lit band across the face against near-total darkness.
SKIN: appears damp, micro rain-droplets visible catching and refracting the neon rim lights as small bright flares.
CYBERNETICS: subtle integrated augmentations — faint circuit-trace pattern in bioluminescent blue pulsing beneath temple skin; thin neural interface port at the neck base; iris overlay showing a faint digital data HUD with minimal readout lines.
ATMOSPHERE: volumetric fog in the mid-ground scattering neon frequencies into the air.
COLOR GRADE: desaturated film-noir base; only the neon wavelengths (magenta, cyan, electric blue) retain full saturation. Maximum contrast between near-black shadows and electric rim lights.
QUALITY: cinematic VFX render. Dangerous, beautiful, utterly futuristic.`,

  comic_hero: `
Transform this image into a premium American superhero comic illustration — the artistic standard of an Alex Ross painted key cover combined with the dynamic graphic energy of Jack Kirby.
LINEWORK: bold confident black ink outlines with deliberate weight variation — thick strokes (3–4pt) at silhouette edges and deep shadow areas, medium strokes (1.5–2pt) for form definition, fine strokes (0.5pt) for interior detail and facial features. Lines drawn with a professional comic inker's authority — no hesitation, no scratching.
COLOR: fully saturated flat comic coloring. Hero elements in rich primary colors — cape in deep crimson (#CC0000), costume elements in cobalt blue (#0033AA), warm flat skin tones in the tradition of classic Marvel coloring. Shadows are flat darker-value versions of each hue, not black.
HALFTONE: in the deepest shadow areas, classic printed-comics halftone dot pattern — circular dots at 30% coverage in a precise 45-degree grid, the authentic texture of a Silver Age Marvel or DC printed page.
HIGHLIGHTS: pure white without gradation.
BACKGROUND: bold complementary deep yellow-orange (#F5A623) with dramatic speed-line radiating composition, or bold graphic elements framing the heroic figure.
SUBJECT: idealized, powerful, larger than life. Expression projects unwavering heroic purpose.
QUALITY: publishable Marvel/DC cover standard. Timeless, iconic, powerful. 2D comic illustration.`,

  fashion_avatar: `
Transform this image into an ultra-luxury editorial fashion portrait at the technical and artistic standard of a Vogue or System Magazine cover shoot — the visual language of photographers Mert & Marcus, Steven Meisel, or Harley Weir.
LIGHTING: warm golden key light at 45° upper-right illuminating 60% of the face, creating a classic Rembrandt triangle of reflected light on the shadowed cheek; a gentle reflector fill from the lower left at 2 stops under preserving shadow depth; a warm hair backlight from directly behind adding luminous rim to the crown. Catchlight in the eyes: a clean soft-box oval at 11 o'clock.
SKIN: warm golden-amber tones, luminous and flawless with visible natural texture preserved — fine pore detail, subtle skin variation, the translucency of the lips and ears. No plastic over-retouching.
COLOR GRADE: warm golden highlights, slightly desaturated mid-tones with a faded-film quality (lifted blacks with a warm amber tone), deep warm shadows. Kodak Portra 400 aesthetic.
DEPTH OF FIELD: sharp focus on the near eye and cheekbone, gentle falloff to the ear, background dissolving to warm golden bokeh spheres.
STYLING: hair and clothing shown with impeccable detail — fabric texture rendered with tactile precision.
QUALITY: medium format editorial photography — extraordinary tonal range, exquisite skin rendition, effortless luxury. Shot on Phase One at 85mm.`,

  business_profile: `
Transform this image into a premium professional corporate headshot at the quality standard of Fortune 500 executive team photography — the precise technical excellence of portrait photographers Peter Hurley or Lindsay Adler.
LIGHTING: impeccable three-point studio setup. Key light: large octabox at 45° upper-right, beautifully soft with a clean oval catchlight visible in both eyes at the 11 o'clock position. Fill: white reflector panel at 1.5 stops under eliminating unflattering shadows without flattening. Rim: subtle strip box from behind adding clean shoulder separation from the background. No color casts — pure neutral light temperature throughout.
SKIN: natural, healthy, and polished. Professional-level retouching that removes blemishes while preserving authentic skin texture, visible pores, and the natural life in the face. No airbrushed plastic effect.
EXPRESSION: composed, confident, approachable — projecting competence and trustworthiness simultaneously.
BACKGROUND: seamless paper in professional light neutral gray, evenly lit with gentle vignette to draw focus to the subject. Clean, undistracting.
COLOR GRADE: clean neutral-to-slightly-cool toning, accurate skin tones with no stylized color shift, clean whites and preserved highlight detail.
SHARPNESS: razor-sharp focus throughout the full face. Technical excellence in every measurable parameter.
QUALITY: this is the photograph on a company website, executive biography, speaking engagement program, or board of directors page. Authoritative, polished, completely professional.`,

  pet_portrait_pro: `
Transform this image into a breathtaking hyper-realistic fine-art animal portrait at the world-class level of wildlife photographer David Yarrow combined with the intimacy of classical animal portrait painting.
FUR DETAIL: each individual guard hair rendered at micro precision — direction of growth following natural flow patterns mapped across the face and body, fine whiskers traced with single-strand fidelity, layered undercoat visible where guard hairs part, the translucent warmth of fur edges where backlight passes through. This is the most important element. Every strand matters.
LIGHTING: dramatic Rembrandt portrait lighting — large warm key light at 45° upper-left casting deep directional shadows that reveal the three-dimensional sculptural form of the face; a subtle cooler fill from the right preserving shadow detail; a warm backlight rim that makes the fur perimeter glow with translucent warmth.
EYES: the soul of the portrait — rendered with absolute photorealistic precision: complex iris cellular texture, light rays through the pupil, a perfect wet-cornea specular highlight from the key light, visible depth and emotional presence that stops the viewer.
BACKGROUND: deep rich jewel-toned bokeh — dark forest greens, burgundy, and antique gold, completely de-focused to push the subject powerfully forward. Shot at f/1.4.
COLOR GRADE: rich warm tones in the fur, deep contrast in the shadows, the full dynamic range of a Phase One 150MP capture.
QUALITY: gallery-worthy fine-art animal portraiture.`,

  couple_avatar: `
Transform this image into a beautifully crafted romantic 2D anime couple portrait — the visual quality and emotional depth of a premium visual novel key visual or an anniversary commission from a top-tier Pixiv illustrator.
COMPOSITION: both subjects rendered together in an intimate close composition, faces 30–40% overlapping or nearly touching, creating a sense of private romantic world between them.
CHARACTERS: expressive anime eyes for both — warm amber and rose iris gradients, long delicate lashes, double-lid shading, emotional softness in the gaze. Hair rendered in flowing smooth 2D strands with careful highlight streaks (near-white curves catching the backlight) and shadow passes (deeper amber and chocolate tones in the depths).
LIGHTING: warm golden back-lighting from directly behind both subjects, creating a luminous romantic halo effect — the backlight scatters through hair creating individual gleaming strand highlights; a soft warm ambient front fill completes the scene without introducing harsh shadows. The entire image glows warm.
PALETTE: rose-gold, warm amber, soft peach, ivory, pale champagne — entirely warm, entirely romantic. Not a single cool tone. The color palette itself should communicate warmth and tenderness.
CEL-SHADING: sophisticated multi-layer technique — base tone, warm shadow pass, and an airbrush-smooth specular layer for dimension without photorealism.
BACKGROUND: dissolves into warm abstract bokeh — soft golden circles and rose-light glow, completely undefined.
QUALITY: professional visual novel cover art standard. Emotionally resonant, tender, and beautiful.`,

  kawaii_icon: `
Transform this image into an exceptionally polished super-cute chibi anime icon character at the professional quality standard of Sanrio's character design studio or a top-tier Japanese mobile game art department.
PROPORTIONS: extreme chibi ratio — head nearly as large as the entire body; face occupies 65% of head height; body compact, soft, and rounded. This exaggeration is essential.
EYES: the most critical element — enormous, taking up 45–50% of the face area. Iris in deep royal purple-blue with lighter concentric rings toward the center. Three distinct highlight types: a large oval catch-light at top-left, scattered star-burst sparkles throughout the iris, small heart-shaped reflection highlights. Pupils deep glassy black. Whites pure and large. The eyes must suggest crystalline infinite depth.
CHEEKS: soft circular blush marks gradient-faded from rose-pink to nothing at the edges. Positioned just below the outer edge of each eye.
HAIR: pastel pale lavender-pink or baby blue, styled in smooth rounded simplified shapes — no stray strands, just clean soft volumes. A large decorative bow or hair ornament in matching or complementary color.
LINEWORK: clean, confident outlines with subtle weight variation — heavier at silhouette, lighter for interior detail.
PALETTE: baby blue, pale lavender, rose pink, pearl white, minimal dark accents. Soft, sweet, luminous.
BACKGROUND: soft pastel gradient or simple repeating pattern of tiny hearts and stars.
QUALITY: professionally designed character IP. Overwhelmingly cute, immediately loveable.`,
};

const QUALITY_SUFFIX =
  'Masterpiece quality. Ultra-detailed. Stunning visual impact. Best possible result.';

export function getPromptForStyle(styleId: string): { prompt: string; negativePrompt: string } {
  const core = (STYLE_CORE[styleId] ?? `${styleId} style transformation`).trim();
  const neg = STYLE_NEGATIVE[styleId] ?? BASE_NEGATIVE;
  return {
    prompt: `${core}\n${QUALITY_SUFFIX}`,
    negativePrompt: neg,
  };
}

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
