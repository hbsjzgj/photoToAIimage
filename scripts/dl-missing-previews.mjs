import https from 'https';
import fs from 'fs';
import path from 'path';

const STYLES = [
  { id: 'oil_painting', seed: 3116, prompt: 'classical oil painting portrait Old Masters style, visible confident brushstrokes impasto texture, Rembrandt triangle lighting, warm golden skin glazes, dark warm background, linen canvas grain, Vermeer Sargent quality' },
  { id: 'pixel_art',    seed: 3117, prompt: 'retro 16-bit pixel art portrait, strictly limited color palette, visible square pixels, 1-pixel black outlines, checkerboard dithering, SNES Neo-Geo sprite quality, pure pixel aesthetic no anti-aliasing' },
  { id: 'pop_art',      seed: 3118, prompt: 'bold Andy Warhol Roy Lichtenstein pop art portrait, completely flat solid fills, Ben-Day dot shadows at 45 degree grid, thick uniform black outlines, exactly 4 saturated colors, 2D screen-print aesthetic' },
  { id: 'pencil_sketch',seed: 3119, prompt: 'fine-art graphite pencil portrait drawing, academic realist tradition, direction-sensitive hatching on cream paper, tonal range from white paper to mid-shadow, no color no digital sheen, Sargent charcoal quality' },
  { id: 'van_gogh',     seed: 3120, prompt: 'Van Gogh post-impressionist portrait painting, signature short swirling directional brushstrokes, intense pure pigments cadmium yellow Prussian blue vermillion, dark contour lines, Starry Night energy' },
  { id: 'lego_figure',  seed: 3121, prompt: 'official LEGO minifigure portrait, cylindrical ABS plastic head with studded top, printed 2D facial features, barrel-shaped body, C-shaped claw hands, glossy plastic material, clean studio product photography' },
  { id: 'action_figure',seed: 3122, prompt: 'premium 1:12 scale collectible action figure in retail window box packaging, Bandai S.H.Figuarts style, visible joint articulation, injection-molded plastic skin, silver foil packaging, professional product photography' },
  { id: 'claymation',   seed: 3123, prompt: 'Aardman stop-motion claymation character portrait, Wallace and Gromit aesthetic, hand-sculpted plasticine with visible finger-press texture, oversized expressive eyes, clay-roll hair, primary-color claymation set' },
  { id: 'sumi_e',       seed: 3124, prompt: 'traditional East Asian ink brush painting sumi-e, raw ink on rice paper wet bleeds, 5-tone monochrome palette, confident single-pass brushstrokes, generous empty white space, red chop seal stamp corner' },
  { id: 'dark_fantasy', seed: 3125, prompt: 'dark fantasy RPG character portrait, near-black background with spectral blue rim light, glowing ember-orange accent, ancient rune armor, supernatural glowing eyes, Elden Ring Diablo concept art quality' },
  { id: 'kpop_idol',    seed: 3126, prompt: 'K-pop idol editorial portrait, flawless luminous glass skin, premium studio softbox K-pop glow lighting, precision idol makeup gradient lips, salon-perfect hair, clean bright color grade, HYBE SM Entertainment quality' },
  { id: 'neon_portrait',seed: 3127, prompt: 'retrowave synthwave neon art portrait, pure black background, three neon tube lights hot magenta-pink electric cyan deep violet, glowing outlines with radiant bloom, faint retro grid lines, synthwave aesthetic' },
  { id: 'vintage_film', seed: 3128, prompt: 'vintage Kodachrome 64 film photography portrait, 1970s 1980s aesthetic, prominent silver halide grain, warm golden-amber highlights, slightly lifted blacks with green-cyan shadow tint, slight barrel distortion, corner focus falloff' },
  { id: 'ukiyo_e',      seed: 3129, prompt: 'traditional Ukiyo-e woodblock print portrait, Edo period Utamaro bijin-ga quality, flat ink-block color passes, variable-width calligraphy key-block outlines, traditional mineral pigments bengara ai-indigo, washi paper texture' },
  { id: 'tarot_card',   seed: 3130, prompt: 'mystical tarot card illustration Rider-Waite-Smith tradition, ornate gold-foil Art Nouveau border, Gothic card name lettering, rich jewel tones against midnight blue, esoteric symbolic imagery crescent moon five-pointed star' },
  { id: 'webtoon',      seed: 3131, prompt: 'Korean Naver Webtoon Manhwa illustration, clean precise digital linework, Korean beauty character design, soft cell-shading with highlight layer, smooth even-toned skin, subtle sparkle catchlight, True Beauty Solo Leveling quality' },
  { id: 'sticker_art',  seed: 3132, prompt: 'premium LINE sticker character, bold white outline border surrounding entire character, kawaii joyful expression, bright saturated candy pink sunshine yellow sky blue colors, floating sparkles and hearts, LINE Creators Market quality' },
  { id: '3d_clay',      seed: 3133, prompt: '3D clay material render Blender Cycles quality, Laika Studios Coraline aesthetic, matte clay polymer shader soft subsurface scattering, hand-sculpted surface texture fingerprints, glass marble eye inserts, warm studio lighting, neutral background' },
  { id: 'impressionist',seed: 3134, prompt: 'French Impressionist portrait painting Claude Monet palette, broken complementary color brushwork optical mixing, light-saturated palette pale lilac shadows yellow-green highlights, soft atmospheric edges, garden light, Monet Mary Cassatt quality' },
];

const OUT_DIR = path.resolve('public/style-previews');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const req = https.get(url, { timeout: 40000 }, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        file.close();
        fs.unlinkSync(dest);
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    });
    req.on('error', (e) => { file.close(); try { fs.unlinkSync(dest); } catch {} reject(e); });
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  let ok = 0, fail = 0;
  for (const { id, seed, prompt } of STYLES) {
    const dest = path.join(OUT_DIR, `${id}.jpg`);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 5000) {
      console.log(`  SKIP ${id} (already exists)`);
      ok++;
      continue;
    }
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true&model=flux-schnell&seed=${seed}`;
    process.stdout.write(`  ${id}... `);
    try {
      await download(url, dest);
      const size = fs.statSync(dest).size;
      console.log(`OK (${Math.round(size/1024)}KB)`);
      ok++;
    } catch (e) {
      console.log(`FAIL: ${e.message}`);
      fail++;
    }
    await sleep(3000); // 3s between requests
  }
  console.log(`\nDone: ${ok} OK, ${fail} failed`);
})();
