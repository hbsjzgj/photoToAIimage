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
  ghibli: `${BASE_NEGATIVE}, photorealistic, hyper-detailed, 3D CGI render, American cartoon, sharp digital art, neon colors, dark gritty atmosphere`,
  oil_painting: `${BASE_NEGATIVE}, digital art, anime, cartoon, smooth digital perfection, airbrush, photography`,
  pixel_art: `${BASE_NEGATIVE}, smooth gradients, anti-aliased edges, photorealistic, 3D, watercolor, oil painting`,
  pop_art: `${BASE_NEGATIVE}, photorealistic, gradients, subtle tones, 3D, oil painting, pastel, soft`,
  pencil_sketch: `${BASE_NEGATIVE}, color, painted, 3D, photorealistic, smooth digital, anime`,
  van_gogh: `${BASE_NEGATIVE}, photorealistic, smooth blending, flat 2D, anime, clean digital art`,
  lego_figure: `${BASE_NEGATIVE}, photorealistic person, anime, illustration, smooth skin, realistic portrait`,
  action_figure: `${BASE_NEGATIVE}, photorealistic person, cartoon, anime, illustration, living human`,
  claymation: `${BASE_NEGATIVE}, smooth digital, photorealistic, anime, 2D illustration, glass, metal`,
  sumi_e: `${BASE_NEGATIVE}, color, photorealistic, western painting, anime, smooth digital`,
  dark_fantasy: `${BASE_NEGATIVE}, cute kawaii, bright cheerful, flat 2D, realistic photography, pastel`,
  kpop_idol: `${BASE_NEGATIVE}, cartoon, anime, illustration, harsh lighting, dark moody, unflattering, low quality`,
  neon_portrait: `${BASE_NEGATIVE}, natural daylight, warm tones, flat illustration, anime, realistic photography, pastel`,
  vintage_film: `${BASE_NEGATIVE}, modern digital clean, anime, illustration, oversaturated, HDR, artificial`,
  ukiyo_e: `${BASE_NEGATIVE}, photorealistic, 3D, western oil painting, modern anime, gradients, shadows`,
  tarot_card: `${BASE_NEGATIVE}, photorealistic, modern photography, anime cute, 3D, casual snapshot`,
  webtoon: `${BASE_NEGATIVE}, photorealistic, Japanese anime extreme style, 3D, rough sketch, western comic`,
  sticker_art: `${BASE_NEGATIVE}, photorealistic, complex detailed, dark moody, 3D, photography, fine art`,
  '3d_clay': `${BASE_NEGATIVE}, photorealistic skin, 2D illustration, anime, smooth plastic, glass, metallic`,
  impressionist: `${BASE_NEGATIVE}, photorealistic, sharp edges, clean digital, anime, flat color, 3D render`,
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

  ghibli: `
2D Studio Ghibli hand-drawn animated portrait, Hayao Miyazaki aesthetic — Spirited Away, Howl's Moving Castle visual standard.
LINEWORK: clean hand-drawn animation lines with natural weight variation, smooth curve arcs, confident key frame quality.
COLOR: muted warm earth tones — warm ochre skin, soft forest greens, dusty rose, sky blue. Watercolor-influenced fills.
EYES: characteristically large but naturally proportioned — warm honey-amber irises, hand-painted catchlights, gentle lash strokes.
HAIR: flowing wind-touched animation hair — strand groups as loose painted marks, soft gradient from root to tip.
BACKGROUND: atmospheric environmental painting — misty forest, golden meadow, or soft gradient sky with floating particles.
LIGHTING: soft diffused natural daylight, Ghibli golden-hour warmth, no harsh shadows.
STYLE: pure 2D hand-drawn animation, Ghibli studio quality, no 3D, no photorealism.`,

  oil_painting: `
Classical oil painting portrait, Old Masters technique — Vermeer natural light combined with Sargent brushwork.
TECHNIQUE: visible confident brushstrokes — loaded brush marks in lights, thin glazing in shadows, impasto texture on highlights.
LIGHTING: dramatic single-source natural window light, Rembrandt triangle on the face, deep warm shadows.
SKIN: warm golden undertones in multiple transparent glazing layers — ivory in lights, warm sienna mid-tones, deep umber shadows.
EYES: detailed naturalistic — wet corneal highlight, visible iris texture, deep expressive pupils.
BACKGROUND: dark warm ground, figure emerging from shadow.
CANVAS: fine linen canvas grain visible in thin areas, impasto raised texture on lit surfaces.
STYLE: classical oil painting technique, no photographic filter, no digital perfection.`,

  pixel_art: `
Retro pixel art portrait, Neo-Geo SNES 16-bit sprite quality combined with contemporary lo-fi aesthetic.
PIXELS: visible square pixels — approximately 64×64 base resolution, crisp upscaling, every pixel intentionally placed.
COLOR: strictly limited 16-color palette — 4-step warm skin gradient, 3-step hair gradient, minimal background colors.
OUTLINES: 1-pixel black border around all major forms, interior lines in darker hue versions.
DITHERING: checkerboard dithering pattern at color transition zones.
HIGHLIGHTS: pure white 1-pixel specular dots on nose tip, lips, and pupils.
BACKGROUND: flat solid color or simple tiled pattern in 2-3 colors.
STYLE: pure pixel art, square pixels, retro game aesthetic, no anti-aliasing, no gradients.`,

  pop_art: `
Bold pop art portrait, Andy Warhol screen-print combined with Roy Lichtenstein Ben-Day dot technique.
COLOR: completely flat solid fills — face in warm peach or yellow, hair in jet black, lips in pure red, outlines in pure black.
BEN-DAY DOTS: shadow areas filled with uniform circular Ben-Day dots at 45° grid, dot size 6% of image width.
OUTLINES: bold uniform 4px black outlines around all major forms — graphic, confident, deliberate.
PALETTE: electric yellow, hot pink, cyan, black, white — exactly 4 colors total, fully saturated.
BACKGROUND: flat solid bright complementary color — cyan or electric pink.
STYLE: 2D pop art screen-print, no photorealism, no gradients, no 3D.`,

  pencil_sketch: `
Fine-art pencil portrait drawing, academic realist tradition — Sargent charcoal combined with hyperrealist graphite.
TECHNIQUE: delicate graphite marks on textured cartridge paper, layered hatching builds tone gradually.
LINES: direction-sensitive hatching following facial planes — cross-hatching in deep shadows, single strokes in mid-tones, open paper for highlights.
PAPER: cream paper grain visible in all areas, particularly in lights.
TONAL RANGE: pure white paper through light hatching through confident mid-tone through deep shadow, no pure black fill.
EYES: most detailed area — precise iris rendering, careful hatching around orbital socket, delicate lash marks.
HAIR: loose gestural marks suggesting mass and direction.
STYLE: traditional pencil drawing, no color, no digital sheen, no photographic quality.`,

  van_gogh: `
Post-impressionist portrait painting, Vincent van Gogh style — Starry Night atmospheric energy combined with Portrait of Dr. Gachet warmth.
BRUSHWORK: signature short swirling brushstrokes — directional curved dashes and comma-strokes following form of each surface.
COLOR: intense pure pigments — cadmium yellow, Prussian blue, viridian green, vermillion, raw sienna. Complementary pairs for vibration.
SKIN: warm yellow-ochre strokes, cool lilac highlights on shadow planes, orange sienna in warmest areas.
BACKGROUND: dynamic swirling deeply textured with vigorous directional marks.
OUTLINES: visible dark contour lines in dark blue or brown around major forms.
STYLE: oil painting brushstroke simulation, post-impressionist, no photorealism, no soft blending.`,

  lego_figure: `
LEGO minifigure portrait, official LEGO set product photography standard.
FORM: entire subject becomes a LEGO minifigure — cylindrical head with studded top, barrel-shaped body, C-shaped claw hands, short legs with hip joints.
FACE: 2D printing on smooth yellow ABS plastic head — simplified dot eyes, curved expression line, eyebrow arc prints.
HAIR: official LEGO hair piece — solid ABS plastic, single color.
OUTFIT: printed costume details on flat chest plate, all detail as 2D printing.
MATERIAL: ABS plastic — glossy, smooth, slight sheen, mold injection marks visible.
BACKGROUND: LEGO base plate or white studio backdrop.
LIGHTING: clean studio product photography, soft overhead diffused light, specular on plastic.
STYLE: official LEGO product quality, plastic toy aesthetic, not cartoon not photo.`,

  action_figure: `
Premium collectible action figure in retail box art, Bandai Tamashii Nations S.H.Figuarts photography standard.
FIGURE: subject as 1:12 scale articulated plastic action figure — visible joint articulation at neck, shoulders, elbows, wrists, hips, knees. Plastic skin texture with injection marks.
BOX: premium retail window box — black or deep blue cardboard with silver foil, protective clear shell, name plate, edition number.
ACCESSORIES: 2-3 miniature accessories on plastic inserts beside the figure.
LIGHTING: professional product photography — clean neutral studio, sharp overhead shadows, specular on plastic.
STYLE: toy product photography, plastic material rendering, not cartoon not portrait photography.`,

  claymation: `
Stop-motion claymation character, Aardman Animations quality — Wallace & Gromit aesthetic.
MATERIAL: hand-sculpted plasticine — visible finger-press texture on all surfaces, slight edge irregularity, clay-seam details at joins.
SKIN: warm flesh-colored clay, subtle thumb-press texture, slight handling sheen.
FEATURES: simplified enlarged claymation proportions — prominent rounded nose, wide mouth with visible clay teeth, oversized expressive eyes with clay eyelids.
HAIR: individual clay rolls pressed into hair shape, visible clay texture throughout.
BACKGROUND: simple claymation set in primary colors, clay props, visible set materials.
LIGHTING: warm practical stop-motion set lighting.
STYLE: stop-motion claymation, physical clay material, not digital not smooth.`,

  sumi_e: `
Traditional East Asian ink brush painting, Chinese Shuimohua combined with Japanese Sumi-e calligraphy tradition.
TECHNIQUE: raw ink on xuan paper — wet ink bleeds into dry areas creating organic soft edges.
INK: 5-tone palette — pure white paper, diluted gray, mid-tone wash, concentrated ink, pure black. No color.
BRUSHSTROKES: confident single-pass strokes — faces in minimal marks, hair in bold sweeps, clothing in loose textural marks.
PAPER: rice paper texture visible in diluted areas, natural irregularity.
COMPOSITION: generous empty white space — subject occupies 40-60% of composition.
SEAL: traditional red chop seal stamp in lower corner.
STYLE: monochrome ink painting, traditional East Asian art, no color, no western painting.`,

  dark_fantasy: `
Dark fantasy RPG character portrait, Diablo IV or Elden Ring official art quality.
ATMOSPHERE: cinematic darkness — near-black deep background with atmospheric mist and faint magical light emanations.
LIGHTING: cold spectral blue or mystical purple rim light, glowing ember-orange accent, only key planes catch light.
ARMOR: elaborate dark fantasy elements — carved bone, ancient runes, luminous artifacts, weathered obsidian metal.
EYES: supernatural intensity — glowing iris in ember orange or cold blue, slight otherworldly power.
SKIN: pallid dramatically lit, haunted and experienced, dangerous energy.
STYLE: dark fantasy digital oil painting, cinematic realism, not cartoonish not photographic.`,

  kpop_idol: `
K-pop idol magazine editorial portrait, HYBE SM Entertainment official promotion material quality.
LIGHTING: premium studio — large softbox key light upper-left at 30°, white reflector fill, subtle hair backlight. K-pop glow quality.
SKIN: flawless luminous glass skin — porcelain tone, subtle highlight on nose center, cupid's bow, brow bone. No visible pores.
EYES: enhanced double-lid, long lashes, clear bright sclera, slight aegyo-sal under-eye for youthfulness.
HAIR: salon-perfect styling — every strand in place with natural movement.
MAKEUP: precision idol makeup — gradient lips, subtle eye-line, soft contouring, glass-skin highlight.
COLOR GRADE: clean bright tones, slightly elevated exposure, delicate warm toning.
STYLE: premium K-pop editorial photography, beauty photography, not anime not illustration.`,

  neon_portrait: `
Electric neon art portrait, retrowave synthwave aesthetic — Stranger Things intro combined with Miami Vice nostalgia.
BACKGROUND: pure black void — any detail stripped leaving only neon light radiation.
LIGHTING: three neon tube sources — primary hot magenta-pink, secondary electric cyan, accent deep violet. Lights glow and bleed.
SKIN: patches illuminated only where neon hits — high contrast, dramatically lit planes only.
OUTLINES: each form outlined in glowing neon tube effect with radiant bloom.
HAIR: lit from multiple neon directions creating blue and pink highlights.
BACKGROUND ELEMENTS: faint retro grid lines in deep purple, faint city silhouette.
PALETTE: 3-4 neon colors only against pure black — no neutrals.
STYLE: neon synthwave retrowave art, not photography not oil painting.`,

  vintage_film: `
Vintage analog film photography portrait, late 1970s early 1980s aesthetic — Kodachrome 64 combined with Fuji Provia editorial.
GRAIN: prominent silver halide grain in all shadow and mid-tone areas — organic, random, beautiful texture.
COLOR: warm golden-amber highlights, slightly lifted blacks with green-cyan shadow tint, Kodachrome reds skewing orange.
DYNAMIC RANGE: compressed highlight rolloff — no blown whites, even lightest areas retain texture.
LENS: slight barrel distortion from vintage 50mm, warm lens flare streak near light sources, soft focus falloff at corners.
SKIN: warm luminous analog-imperfect, fine pore texture shows through.
STYLE: analog film photography simulation, Kodachrome color rendering, no digital perfection.`,

  ukiyo_e: `
Traditional Japanese Ukiyo-e woodblock print portrait, Edo period master quality — Utamaro bijin-ga combined with Sharaku actor portrait.
TECHNIQUE: flat ink woodblock print — hard-edged color separation as if multiple carved blocks were pressed.
LINEWORK: confident Ukiyo-e key-block outlines — variable-width calligraphy line, thick at contours, fine for interior detail.
COLOR: traditional mineral pigments — bengara red-brown, ai-indigo, ki-yellow, pine green. Flat woodblock color passes with slight mis-registration.
SKIN: flat warm ivory or pale pink, completely smooth — no western shading.
HAIR: jet black oil-coated hair in classic Edo style, indigo gloss highlights.
BACKGROUND: washi paper pattern, bokashi gradation, or classic printer's mark.
STYLE: Ukiyo-e woodblock print, Edo period, flat color, no photorealism, no western painting.`,

  tarot_card: `
Mystical tarot card portrait illustration, Rider-Waite-Smith tradition combined with contemporary premium tarot deck design.
CARD FRAME: ornate rectangular gold-foil border with Celtic knotwork or Art Nouveau floral decoration. Card name and Roman numeral at bottom in Gothic letterform.
FIGURE: subject as tarot archetype — symbolically posed with meaningful gesture, surrounded by esoteric symbols.
COLOR: rich jewel tones against midnight blue — gold, deep crimson, mystic purple, starlight white.
STYLE: flat color with fine detail, Art Nouveau line quality, symbolic not realistic.
SYMBOLISM: crescent moon, five-pointed star, or relevant arcana symbols integrated naturally.
BACKGROUND: deep night sky with 8-pointed stars or sunburst rays behind the figure.
STYLE: mystical tarot card illustration, Art Nouveau inspired, flat symbolic artwork.`,

  webtoon: `
Korean webtoon Manhwa portrait illustration, Naver Webtoon premium series quality — True Beauty, Solo Leveling visual standard.
CHARACTER: clean Korean manhwa style — slightly larger eyes than realistic, delicate nose, full lips, less extreme than Japanese anime.
LINEWORK: precise clean digital lines — consistent weight with subtle taper at ends, professional webtoon quality.
COLOR: clean flat digital — vibrant but not neon. Soft cell-shading with one directional light pass and highlight layer.
SKIN: smooth even-toned, Korean beauty standard — subtle highlight on nose tip, natural texture maintained.
EYES: manhwa eyes — large but natural iris, subtle sparkle catchlight, clean upper lash, suggestion of lower lashes.
BACKGROUND: clean gradient or simple pattern suggesting a webtoon panel.
STYLE: Korean webtoon manhwa illustration, digital coloring, not Japanese anime not photographic.`,

  sticker_art: `
Cute LINE sticker emoji art, Japanese SNS sticker quality — LINE Creators Market premium award-winning design.
OUTLINE: clean bold white stroke surrounding the entire character — characteristic sticker border for visual pop on any background.
CHARACTER: round super-cute sticker character — slightly simplified features, emphasis on expression.
EXPRESSION: joyful kawaii highly expressive — characteristic LINE sticker exaggerated emotion.
PROPORTIONS: slightly chibi, compact and cute.
COLOR: bright saturated clean — candy pink, sunshine yellow, sky blue, mint green.
DECORATIVE: sparkles, hearts, small emoji symbols floating around.
BACKGROUND: transparent suggested by white framing — sticker meant to overlay any background.
STYLE: 2D LINE sticker illustration, clean kawaii, not anime not photo.`,

  '3d_clay': `
3D clay render portrait, Blender Cinema4D Cycles quality — Laika Studios Coraline combined with trending 3D clay social media aesthetic.
MATERIAL: clay polymer shader — slightly matte, soft subsurface scattering through thin areas, warm creamy or skin-toned clay with subtle fingerprint texture.
FORM: soft rounded shapes — sharp angles relaxed into smooth curves, gentle bevels suggesting hand-sculpted clay.
EYES: glass marble or resin inserts — perfectly spherical, slight internal refraction, embedded in clay sockets.
HAIR: individual clay rolls or smooth molded clay, visible clay texture throughout.
DETAILS: minor surface irregularities suggesting hand-sculpting, subtle tool marks in hair and clothing.
LIGHTING: warm softbox upper left, subtle cool fill, warm rim light. Clay-appropriate no harsh metallic specular.
BACKGROUND: neutral studio, slight depth of field bokeh.
STYLE: 3D clay material render, physically-based rendering, not 2D illustration not photographic portrait.`,

  impressionist: `
French Impressionist portrait painting, Claude Monet color palette combined with Mary Cassatt figure painting intimacy.
TECHNIQUE: broken color brushwork — pure complementary pigments placed side by side, optical mixing at viewing distance.
BRUSHSTROKES: visible comma and dash strokes of varying direction, Monet-style marks following each surface.
COLOR: light-saturated palette — pale lilac shadows, warm yellow-green highlights on skin, pink-orange in lightest areas. No earth tones, no black.
ATMOSPHERIC: soft impressionist shimmer — edges of forms dissolve slightly into light-filled background.
LIGHT: dappled garden light or diffused afternoon studio, color temperature shifts across canvas.
BACKGROUND: garden foliage or impressionist interior — dabs of green, gold, violet suggesting rather than defining.
STYLE: oil painting brushstroke simulation, French Impressionism, no photorealism, no sharp edges.`,
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
  ghibli:           'Studio Ghibli hand-drawn anime · warm earth tones · natural light',
  oil_painting:     'Classical oil painting portrait · Old Masters technique · Sargent brushwork',
  pixel_art:        'Retro pixel art · 16-bit sprite · limited color palette',
  pop_art:          'Bold pop art screen-print · Warhol style · flat saturated colors',
  pencil_sketch:    'Fine-art graphite portrait · academic hatching · paper texture',
  van_gogh:         'Post-impressionist swirling brushwork · intense pigments · Van Gogh energy',
  lego_figure:      'Official LEGO minifigure · ABS plastic · product photography',
  action_figure:    'Premium collectible figure · retail box art · plastic toy aesthetic',
  claymation:       'Aardman claymation · hand-sculpted plasticine · stop-motion quality',
  sumi_e:           'East Asian ink brush painting · monochrome · rice paper texture',
  dark_fantasy:     'Dark fantasy RPG portrait · cinematic darkness · Elden Ring quality',
  kpop_idol:        'K-pop idol promo · glass skin · HYBE entertainment quality',
  neon_portrait:    'Synthwave neon art · pure black · magenta and cyan glow',
  vintage_film:     'Kodachrome vintage film · 1970s grain · warm golden tones',
  ukiyo_e:          'Ukiyo-e woodblock print · Edo period · Utamaro portrait quality',
  tarot_card:       'Mystical tarot card · Art Nouveau border · arcane symbolism',
  webtoon:          'Korean webtoon manhwa · clean digital lines · K-beauty character',
  sticker_art:      'LINE sticker character · white border · kawaii expression',
  '3d_clay':        'Blender 3D clay render · matte subsurface · Coraline quality',
  impressionist:    'Monet impressionist · broken color brushwork · light-saturated palette',
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
  ghibli:           0.75,
  oil_painting:     0.72,
  pixel_art:        0.78,
  pop_art:          0.77,
  pencil_sketch:    0.76,
  van_gogh:         0.76,
  lego_figure:      0.80,
  action_figure:    0.80,
  claymation:       0.78,
  sumi_e:           0.75,
  dark_fantasy:     0.77,
  kpop_idol:        0.62,
  neon_portrait:    0.77,
  vintage_film:     0.55,
  ukiyo_e:          0.78,
  tarot_card:       0.78,
  webtoon:          0.73,
  sticker_art:      0.77,
  '3d_clay':        0.78,
  impressionist:    0.75,
};

export const MODEL_PARAMS: Record<'free' | 'paid' | 'premium', ModelParams> = {
  free:    { strength: 0.75, num_inference_steps: 28, guidance_scale: 3.8 },
  paid:    { strength: 0.75, num_inference_steps: 35, guidance_scale: 4.0 },
  premium: { strength: 0.78, num_inference_steps: 40, guidance_scale: 4.5 },
};

// ─────────────────────────────────────────────────────────────────────────────
// GEMINI IMAGE PROMPTS
// These are instruction-style prompts sent to Gemini 2.5 Flash Image for
// image-to-image transformation. Unlike FLUX prompts, Gemini understands
// natural language instructions well so we lead with the action verb.
// ─────────────────────────────────────────────────────────────────────────────

const GEMINI_IDENTITY =
  'Preserve the original person\'s identity, facial structure, hairstyle, expression, skin tone, and natural proportions.';

const GEMINI_QUALITY =
  'Create a premium SNS avatar suitable for TikTok, Instagram, Xiaohongshu, YouTube, and profile use. Use clean composition, cinematic lighting, natural facial details, high-end visual quality, and polished professional rendering.';

const GEMINI_NEGATIVE =
  'Avoid distorted facial features, changed identity, over-smoothed plastic skin, unnatural eyes, bad anatomy, extra fingers, messy background, text, watermark, logo, low quality, cheap AI artifacts.';

const GEMINI_FUNCTION_PROMPTS: Record<string, string> = {
  avatar:
    'Transform the uploaded photo into a premium AI avatar while preserving the person\'s identity, facial structure, hairstyle, expression, and natural proportions. Create a refined high-end portrait with cinematic lighting, clean background, detailed eyes, natural skin texture, soft shadows, and an elegant SNS-ready composition.',
  anime:
    'Transform the uploaded photo into a premium Japanese anime avatar while preserving the person\'s recognizable identity, hairstyle, face shape, eye direction, and expression. Use refined anime linework, detailed iris rendering, soft cinematic shadows, subtle pastel tones, clean composition, and high-end character design quality. Avoid exaggerated cartoon distortion.',
  pet:
    'Transform the uploaded pet photo into a premium illustrated pet avatar while preserving the pet\'s breed, fur color, eye shape, ears, facial expression, and unique features. Use soft Japanese kawaii illustration quality, detailed fur texture, clean background, warm lighting, and an adorable SNS-ready composition.',
  fashion:
    'Transform the uploaded photo into a luxury fashion portrait while preserving the person\'s identity and natural facial features. Use editorial magazine lighting, refined color grading, stylish composition, elegant expression, natural skin texture, high-end beauty photography mood, and premium Instagram profile quality.',
  business:
    'Transform the uploaded photo into a professional business profile portrait while preserving the person\'s identity, facial features, and natural expression. Use clean studio lighting, confident posture, polished corporate style, refined background, realistic skin texture, sharp facial detail, and premium LinkedIn-style composition.',
  background:
    'Keep the original person unchanged and replace only the background. Preserve the person\'s face, body, clothing, hairstyle, and proportions. Create a clean premium background matching the selected style, with natural lighting integration, realistic shadows, and professional composition.',
  outfit:
    'Keep the original person\'s face, identity, hairstyle, expression, and body proportions unchanged. Change only the outfit according to the selected style. Ensure the clothing looks natural, well-fitted, premium, and consistent with the lighting and pose. Do not alter the face.',
  hair:
    'Keep the original person\'s identity, face, skin tone, expression, and pose unchanged. Modify only the hairstyle according to the selected style. Ensure the new hairstyle looks natural, realistic, flattering, and consistent with the lighting and face shape. Do not change the facial structure.',
  enhance:
    'Enhance the uploaded photo without changing the person\'s identity, face, hairstyle, outfit, or pose. Improve lighting, skin tone, clarity, background cleanliness, color balance, and overall premium SNS profile quality. Keep the result natural, realistic, and polished.',
};

// Style-specific Gemini prompts that layer on top of the function prompt
const GEMINI_STYLE_CONTEXT: Partial<Record<string, string>> = {
  anime_basic:      'Render in clean 2D Japanese anime illustration style with warm cel-shading, expressive eyes, and soft lighting.',
  anime_pro:        'Render in premium high-contrast Japanese anime style — Demon Slayer / Jujutsu Kaisen quality, dramatic rim lighting.',
  soft_cartoon:     'Render as a delicate watercolor and colored-pencil illustration with feather-light strokes and transparent washes.',
  cute_pet:         'Render as an adorable Sanrio-quality 2D kawaii illustration with oversized eyes and soft pastel tones.',
  simple_icon:      'Render as an ultra-minimal flat graphic icon in exactly three solid colors, mid-century modern style.',
  '3d_cartoon':     'Render as a Pixar-quality 3D CGI animated character with subsurface scattering and cinematic depth of field.',
  soft_storybook:   'Render as a hand-painted Studio Ghibli-style watercolor illustration on cold-press paper texture.',
  cyberpunk:        'Render in Blade Runner 2049 cinematic cyberpunk style with neon magenta and cyan rim lighting.',
  comic_hero:       'Render as an American superhero comic book illustration with bold ink outlines and flat saturated colors.',
  fashion_avatar:   'Render as an ultra-luxury editorial fashion portrait — Vogue cover shoot quality, Rembrandt lighting.',
  business_profile: 'Render as a premium corporate headshot with neutral studio lighting and clean professional background.',
  pet_portrait_pro: 'Render as hyperrealistic fine-art animal portrait photography with dramatic Rembrandt lighting.',
  couple_avatar:    'Render as a romantic 2D anime couple portrait with warm golden back-lighting and rose-gold palette.',
  kawaii_icon:      'Render as a super-cute chibi anime icon with extreme head-to-body ratio and enormous glassy eyes.',
  ghibli:           'Render in Studio Ghibli hand-drawn anime style — soft earth tones, warm linework, Spirited Away / Howl quality.',
  oil_painting:     'Render as a classical oil painting portrait — visible brushstrokes, Old Masters lighting, Vermeer or Sargent quality.',
  pixel_art:        'Render as a retro 16-bit pixel art portrait — limited color palette, square pixels, SNES era game character quality.',
  pop_art:          'Render as a bold Andy Warhol / Roy Lichtenstein pop art portrait — flat saturated colors, Ben-Day dots in shadows, black outlines.',
  pencil_sketch:    'Render as a fine-art pencil portrait drawing — detailed graphite hatching, paper texture, academic realist quality.',
  van_gogh:         'Render in Van Gogh post-impressionist style — swirling directional brushstrokes, intense complementary colors, Starry Night energy.',
  lego_figure:      'Render the subject as an official LEGO minifigure — cylindrical plastic head, ABS glossy finish, printed facial features.',
  action_figure:    'Render the subject as a premium collectible action figure in retail box packaging — plastic toy material, visible joints.',
  claymation:       'Render as an Aardman-style claymation character — hand-sculpted plasticine texture, stop-motion aesthetic, Wallace & Gromit quality.',
  sumi_e:           'Render as a traditional East Asian ink brush painting — monochrome ink washes on rice paper, Sumi-e calligraphy brushwork.',
  dark_fantasy:     'Render as a dark fantasy RPG character portrait — dramatic cinematic darkness, glowing magical elements, Elden Ring concept art quality.',
  kpop_idol:        'Render as a K-pop idol promotional portrait — flawless glass skin, perfect studio lighting, HYBE / SM Entertainment promotion quality.',
  neon_portrait:    'Render as a retrowave synthwave neon art portrait — pure black background, electric magenta and cyan neon lighting, glowing outlines.',
  vintage_film:     'Render as a vintage analog film photograph — Kodachrome grain, warm golden color shift, 1970s–80s film aesthetic.',
  ukiyo_e:          'Render as a traditional Ukiyo-e woodblock print — flat ink-block colors, Edo period linework, Utamaro bijin-ga portrait quality.',
  tarot_card:       'Render as a premium mystical tarot card illustration — ornate gold border frame, Rider-Waite-Smith symbolic style, arcane imagery.',
  webtoon:          'Render as a Korean webtoon Manhwa illustration — clean digital linework, Korean beauty character design, Naver Webtoon quality.',
  sticker_art:      'Render as a premium LINE sticker character — bold white outline border, kawaii expressive face, bright clean colors.',
  '3d_clay':        'Render as a 3D clay material portrait — Blender clay shader, soft matte subsurface scattering, Coraline / Laika stop-motion quality.',
  impressionist:    'Render as a French Impressionist painting — Monet-style broken color brushwork, light-saturated palette, soft atmospheric edges.',
};

export function getGeminiPrompt({
  functionMode,
  styleId,
  customPrompt,
}: {
  functionMode?: string;
  styleId?: string;
  customPrompt?: string;
}): string {
  const functionPart = functionMode
    ? (GEMINI_FUNCTION_PROMPTS[functionMode] ?? GEMINI_FUNCTION_PROMPTS.avatar)
    : GEMINI_FUNCTION_PROMPTS.avatar;

  const stylePart = styleId ? (GEMINI_STYLE_CONTEXT[styleId] ?? '') : '';

  // customPrompt is additive only — it cannot override system constraints
  const customPart = customPrompt ? `Additional detail: ${customPrompt}` : '';

  const parts = [
    GEMINI_IDENTITY,
    functionPart,
    stylePart,
    customPart,
    GEMINI_QUALITY,
    GEMINI_NEGATIVE,
  ].filter(Boolean);

  return parts.join('\n\n');
}
