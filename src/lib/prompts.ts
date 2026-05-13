// ─────────────────────────────────────────────────────────────────────────────
// Each style is tuned to match its preview card image exactly:
//   STYLE_CORE     — positive prompt describing the EXACT visual output
//   STYLE_NEGATIVE — blocks conflicting rendering modes
//   STYLE_STRENGTH — per-style strength (artistic styles need 0.82+;
//                    realistic styles need less to preserve photo quality)
// ─────────────────────────────────────────────────────────────────────────────

const BASE_NEGATIVE =
  'ugly, disfigured, deformed, blurry, low quality, jpeg artifacts, watermark, text, logo';

// ─── Per-style negative prompts ──────────────────────────────────────────────
const STYLE_NEGATIVE: Record<string, string> = {
  // 2D illustration styles — block 3D and hyperrealism
  anime_basic:
    `${BASE_NEGATIVE}, 3D rendered, 3D CGI, photorealistic, realistic fur, hyper-detailed photography, volumetric 3D lighting, subsurface scattering`,
  anime_pro:
    `${BASE_NEGATIVE}, 3D rendered, 3D CGI, photorealistic, realistic photography, soft pastel, bright cheerful`,
  soft_cartoon:
    `${BASE_NEGATIVE}, 3D rendered, photorealistic, hyper-realistic, dark moody, sharp edges, bold ink outlines`,
  cute_pet:
    `${BASE_NEGATIVE}, 3D rendered, photorealistic, hyper-realistic, realistic fur, dark moody, realistic animal photography`,
  simple_icon:
    `${BASE_NEGATIVE}, 3D, photorealistic, complex background, realistic, gradients, shadows, detailed texture, anime, multiple colors`,
  soft_storybook:
    `${BASE_NEGATIVE}, 3D rendered, photorealistic, sharp digital art, neon colors, dark atmosphere, bold outlines`,
  comic_hero:
    `${BASE_NEGATIVE}, 3D rendered, photorealistic, anime soft style, watercolor, pastel, realistic skin`,
  kawaii_icon:
    `${BASE_NEGATIVE}, 3D rendered, photorealistic, realistic fur, realistic skin, dark colors, complex background, adult proportions`,
  couple_avatar:
    `${BASE_NEGATIVE}, 3D rendered, photorealistic, realistic photography, dark moody, single person only`,

  // 3D CGI style — block flat/2D
  '3d_cartoon':
    `${BASE_NEGATIVE}, flat design, 2D illustration, anime linework, manga, hand-drawn, watercolor, realistic photography`,

  // Photorealistic styles — block illustration/cartoon
  fashion_avatar:
    `${BASE_NEGATIVE}, cartoon, anime, illustrated, painted, 2D, flat design, sketch, cold lighting`,
  business_profile:
    `${BASE_NEGATIVE}, cartoon, anime, illustrated, painted, artistic filter, 2D, warm orange tones, dramatic lighting`,
  pet_portrait_pro:
    `${BASE_NEGATIVE}, cartoon, flat design, anime, simple illustration, childish style, 2D`,
  cyberpunk:
    `${BASE_NEGATIVE}, cute, pastel colors, soft warm lighting, cartoon, watercolor, bright cheerful`,
};

// ─── Per-style positive prompts — describe exact visual output ────────────────
// Each prompt targets the specific visual characteristics visible in the preview card.
const STYLE_CORE: Record<string, string> = {

  // Preview: soft 2D anime girl, warm peach-pink skin, honey-blonde hair,
  // large soft brown eyes, gentle upper-left diffused lighting, clean outlines
  anime_basic:
    'Transform the entire scene into a soft 2D Japanese anime illustration. Warm peach-pink skin tones, honey-amber hair rendered as flat smooth 2D anime strands with gentle highlights, large soft anime eyes with warm brown irises and bright single catchlight, clean precise black outlines of medium weight. Gentle diffused lighting from upper left creating soft face shadows. Warm rose and peach color palette throughout. Clean cel-shaded fills, no gradients. Dreamy romantic atmosphere. Webtoon illustration quality.',

  // Preview: very dark dramatic anime, near-black background, single strong
  // rim light from behind, high contrast, mature sophisticated character design
  anime_pro:
    'Transform the entire scene into a premium dramatic 2D Japanese anime illustration. Near-black dark background. Single strong rim lighting from behind creating a luminous outline on the subject, deep ink-black shadows on the face with only the lit side visible. Mature sophisticated character design with sharp detailed facial features, complex iris patterns with multiple ring gradients, dark brown or black hair with subtle blue-purple highlights. High contrast chiaroscuro lighting expressed in 2D anime shading. Studio Trigger / Ufotable cinematic quality. Pure 2D illustration.',

  // Preview: extremely soft colored-pencil and watercolor hybrid, almost sketch-like,
  // very light delicate lines, airy color washes, gentle feminine fashion illustration
  soft_cartoon:
    'Transform the entire scene into a delicate soft illustration using light colored-pencil sketch lines and gentle watercolor washes. Very fine delicate linework, almost invisible in places. Airy translucent skin tones with subtle rose blush. Light pastel color palette. Soft unfocused background. The style resembles a premium fashion illustration or beauty sketch — delicate, feminine, gentle. No bold outlines. No 3D depth. Pure gentle 2D illustration.',

  // Preview: kawaii animal character with oversized anime eyes, animal ears,
  // very saturated warm pink-peach tones, fluffy fur, tiny cute face features
  cute_pet:
    'Transform the subject into an adorably cute kawaii anime animal character. Give the subject large rounded animal ears on top of the head, oversized sparkling anime eyes taking up 40% of the face area with multiple heart-shaped and star-shaped catchlights, a tiny cute button nose, soft round cheeks with pink blush marks, fluffy cream-white fur replacing or overlaying hair. Vibrant saturated warm pink, peach and cream color palette. Background transformed into a soft pastel kawaii world. Premium Japanese kawaii mascot character illustration quality. Pure 2D illustration.',

  // Preview: ultra-flat graphic design, only 2-3 solid colors, strong contrast,
  // Saul Bass / mid-century modern silhouette aesthetic, orange-brown background
  simple_icon:
    'Transform the subject into an ultra-flat minimal graphic design icon. Reduce the entire image to only 2-3 solid flat colors — a warm terracotta or orange-brown background, dark near-black silhouette, and a single accent color. Zero gradients, zero shadows, zero texture, zero depth. Pure flat solid color fills only. The subject becomes a clean graphic silhouette. Saul Bass mid-century modern poster design aesthetic. Extremely bold and simple.',

  // Preview: Pixar/Dreamworks 3D CGI, warm amber-orange studio lighting,
  // clearly 3D rendered, rounded friendly 3D character with expressive eyes
  '3d_cartoon':
    'Transform the entire scene into a premium 3D CGI animated character render. Warm amber and orange studio three-point lighting with a key light from upper right. Physically-based subsurface scattering on skin or fur. Three-dimensional hair/fur with individual strand simulation. Expressive 3D animated eyes with volumetric depth and glossy cornea. Smooth rounded 3D character proportions. Background rendered as a warm-lit 3D animated environment. Disney/Pixar/Illumination big-budget 3D animation quality.',

  // Preview: loose hand-painted watercolor, warm paper texture visible,
  // soft color bleeding at edges, pastel tones, painted brushstroke marks
  soft_storybook:
    'Transform the entire scene into a hand-painted watercolor illustration. Loose wet-on-wet watercolor brushwork with visible color bleeding and soft edges. Warm ivory and cream watercolor paper texture visible throughout. Warm golden-amber lamplight color palette with soft peach and rose tones. Soft undefined blurred edges around the subject. Background becomes a loose painted wash of color. The style resembles a premium illustrated storybook or children\'s book painting. Visible individual brushstrokes. 2D watercolor painting art.',

  // Preview: extremely dark purple-blue atmosphere, strong neon purple/magenta
  // rim lighting, volumetric fog, futuristic, near-black background
  cyberpunk:
    'Transform the entire scene into a cinematic cyberpunk portrait. Near-black background. Strong neon purple and magenta rim lighting outlining the subject from behind, creating a glowing edge. Blue-purple atmospheric volumetric fog fills the space. Subject has a futuristic look with subtle cybernetic augmentation details integrated naturally. Deep shadows with only neon-lit portions visible. Cinematic dark color grade. Blade Runner 2049 / Ghost in the Shell visual aesthetic.',

  // Preview: American superhero comic, bold black ink outlines, bright primary
  // colors (yellow/red/blue), dynamic action, halftone dot texture in shadows
  comic_hero:
    'Transform the entire scene into an American superhero comic book illustration. Bold heavy black ink outlines defining every shape. Bright saturated primary colors — yellow, red, blue, with strong contrast. Halftone dot pattern visible in shadow areas. Dynamic dramatic composition. Subject appears heroic and powerful. Background has comic-style speed lines or bold graphic elements. Flat comic coloring with no photo-realistic shading. Classic Marvel/DC printed comic book quality. 2D comic illustration.',

  // Preview: warm golden amber skin, soft warm side-lighting from the right,
  // luxurious feel, slightly desaturated cinematic grade, photorealistic
  fashion_avatar:
    'Transform the entire scene into a luxury fashion editorial photograph. Warm golden amber side-lighting from the right side of the face creating a glamorous Rembrandt-style shadow. Luminous warm skin tones with healthy glow. Slightly desaturated cinematic color grade with lifted blacks. Soft shallow bokeh background. The subject looks like a high-fashion model in a Vogue editorial shoot. Photorealistic photography quality.',

  // Preview: clean neutral studio lighting, professional, sharp, cool-toned,
  // light gray or white background, polished corporate headshot quality
  business_profile:
    'Transform the entire scene into a premium professional corporate headshot photograph. Clean neutral three-point studio lighting — soft white key light, gentle fill, subtle rim. Cool-toned neutral color grade. Background softened to a clean neutral gray or white gradient. Subject appears composed, confident and professional. Razor-sharp facial detail with natural skin texture. Photorealistic studio photography. LinkedIn / executive portrait quality.',

  // Preview: hyper-realistic animal portrait, macro-level individual fur detail,
  // warm dramatic studio lighting, like a professional wildlife photographer
  pet_portrait_pro:
    'Transform the entire scene into a hyper-realistic fine-art animal portrait. Individual fur strands rendered at micro-detail level showing texture, direction and sheen. Warm dramatic Rembrandt studio lighting from upper-left creating rich deep shadows and bright highlights. Soulful eyes with extraordinary reflective depth. Background softened to a warm dark jewel-toned bokeh. Professional wildlife and pet portrait photography quality. Every fur strand visible.',

  // Preview: two anime characters close together, warm rose-gold palette,
  // soft romantic 2D anime style, gentle warm lighting, emotional and intimate
  couple_avatar:
    'Transform the scene into a romantic 2D anime couple illustration featuring two subjects together in close intimate composition. Soft warm rose-gold and amber color palette. Gentle warm back-lighting creating a romantic glow around both subjects. Soft smooth cel-shading with clean 2D anime outlines. Both subjects rendered with expressive anime eyes and soft facial features. Background becomes a soft blurred warm bokeh of golden and rose light. Emotional romantic atmosphere. Premium 2D anime illustration.',

  // Preview: super-cute chibi anime character, huge blue-purple sparkling eyes,
  // blue and pink pastel hair, exaggerated chibi proportions (big head/small body)
  kawaii_icon:
    'Transform the subject into an ultra-cute chibi anime icon character. Exaggerated chibi proportions — head and eyes are oversized relative to the small body. Enormous sparkling blue-purple eyes filled with multiple star-shaped and sparkle catchlights. Blue and pink pastel hair with soft shine. Rosy blush marks on cheeks. Soft pastel color palette of lavender, baby blue and light pink. Background becomes a simple soft pastel color or minimal kawaii pattern. Pure flat 2D chibi illustration. Sanrio / premium kawaii character quality.',
};

const QUALITY_SUFFIX =
  'Highest quality, ultra-detailed, premium professional result, stunning visual impact.';

export function getPromptForStyle(styleId: string): { prompt: string; negativePrompt: string } {
  const core = STYLE_CORE[styleId] ?? `${styleId} style transformation`;
  const neg = STYLE_NEGATIVE[styleId] ?? BASE_NEGATIVE;
  return {
    prompt: `${core} ${QUALITY_SUFFIX}`,
    negativePrompt: neg,
  };
}

// Per-style strength values — crucial for distinct outputs:
// Dramatic style transforms need 0.82–0.90; realistic refinement needs 0.65–0.75
export const STYLE_STRENGTH: Record<string, number> = {
  anime_basic:      0.82,
  anime_pro:        0.87,
  soft_cartoon:     0.82,
  cute_pet:         0.90,  // most extreme: animal character transformation
  simple_icon:      0.90,  // most extreme: must become near-abstract flat graphic
  '3d_cartoon':     0.83,
  soft_storybook:   0.83,
  cyberpunk:        0.82,
  comic_hero:       0.86,
  fashion_avatar:   0.72,  // photorealistic: preserve face, just enhance
  business_profile: 0.65,  // most subtle: professional photo refinement only
  pet_portrait_pro: 0.78,
  couple_avatar:    0.82,
  kawaii_icon:      0.90,  // extreme: must become chibi character
};

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
  strength: number;        // base strength — overridden per-style by STYLE_STRENGTH
  num_inference_steps: number;
  guidance_scale: number;
}

export const MODEL_PARAMS: Record<'free' | 'paid' | 'premium', ModelParams> = {
  free:    { strength: 0.82, num_inference_steps: 28, guidance_scale: 3.2 },
  paid:    { strength: 0.82, num_inference_steps: 35, guidance_scale: 3.5 },
  premium: { strength: 0.85, num_inference_steps: 40, guidance_scale: 4.0 },
};
