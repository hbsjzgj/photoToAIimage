#!/bin/bash
# Downloads missing style preview images from Pollinations.ai with 65s delay
# to avoid rate limits. Run from project root: bash scripts/dl-remaining.sh
set -e
cd "$(dirname "$0")/.."
OUT=public/style-previews
BASE="https://image.pollinations.ai/prompt"

declare -A SEEDS
SEEDS[soft_cartoon]=3103
SEEDS[cute_pet]=3104
SEEDS[3d_cartoon]=3106
SEEDS[soft_storybook]=3107
SEEDS[cyberpunk]=3108
SEEDS[comic_hero]=3109
SEEDS[fashion_avatar]=3110
SEEDS[business_profile]=3111
SEEDS[pet_portrait_pro]=3112
SEEDS[couple_avatar]=3113
SEEDS[kawaii_icon]=3114

declare -A PROMPTS
PROMPTS[soft_cartoon]="soft watercolor illustration portrait feather-light pencil strokes translucent color washes ivory cream rose tones Vogue Japan beauty editorial cold-press paper grain elegant 2D art"
PROMPTS[cute_pet]="kawaii anime animal character portrait huge sparkling eyes heart reflections fluffy cat ears rosy cheek blush stars sparkles Sanrio character design warm pastel palette pure 2D"
PROMPTS[3d_cartoon]="3D CGI Pixar Dreamworks character portrait subsurface scattering skin volumetric studio lighting smooth stylized cartoon features vibrant saturated colors polished CGI render"
PROMPTS[soft_storybook]="soft watercolor colored pencil portrait illustration English childrens picture book warm golden light visible paper grain delicate ink linework heartwarming storybook muted warm tones"
PROMPTS[cyberpunk]="cyberpunk portrait neon city electric cyan magenta rim lighting rain reflections dramatic dark background Blade Runner cinematic high contrast illustration"
PROMPTS[comic_hero]="comic book superhero portrait bold thick black ink outlines Ben-Day halftone dots flat primary colors Marvel DC classic American comic dynamic heroic"
PROMPTS[fashion_avatar]="luxury fashion portrait photography warm golden hour rim light champagne editorial tones elegant woman Vogue magazine cover quality professional studio"
PROMPTS[business_profile]="professional corporate headshot photography clean neutral grey background soft studio lighting business attire blazer confident friendly expression LinkedIn quality"
PROMPTS[pet_portrait_pro]="hyperrealistic animal portrait photography detailed fur strand micro-texture moody chiaroscuro studio lighting dramatic dark vignette National Geographic quality"
PROMPTS[couple_avatar]="cute anime couple portrait illustration matching pastel outfits warm romantic pink peach tones soft glowing light holding hands webtoon romance manga style"
PROMPTS[kawaii_icon]="ultra kawaii chibi sticker portrait enormous sparkling eyes rainbow galaxy iris pastel pink hair heart blush marks holographic sticker border LINE sticker quality pure 2D"

for id in soft_cartoon cute_pet 3d_cartoon soft_storybook cyberpunk comic_hero fashion_avatar business_profile pet_portrait_pro couple_avatar kawaii_icon; do
  dest="${OUT}/${id}.jpg"
  if [ -f "$dest" ] && [ "$(wc -c < "$dest")" -gt 5000 ]; then
    echo "  skip  $id"
    continue
  fi

  prompt="${PROMPTS[$id]}"
  seed="${SEEDS[$id]}"
  encoded=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$prompt")
  url="${BASE}/${encoded}?model=flux-schnell&width=512&height=512&seed=${seed}&nologo=true"

  echo -n "  fetch $id... "
  if curl -sL --max-time 55 -o "$dest" "$url" && [ -s "$dest" ] && [ "$(wc -c < "$dest")" -gt 5000 ]; then
    echo "saved ($(( $(wc -c < "$dest") / 1024 )) KB)"
  else
    rm -f "$dest"
    echo "FAIL"
  fi

  echo "  waiting 65s..."
  sleep 65
done

echo ""
echo "Done. $(ls ${OUT}/*.jpg 2>/dev/null | wc -l | tr -d ' ')/14 images present."
