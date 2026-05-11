import Replicate from 'replicate';
import { StyleId, STYLE_TO_REPLICATE, STYLE_PROMPTS } from '@/types';

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

const PHOTOMAKER_MODEL =
  'tencentarc/photomaker-style:467d062309da518648ba89d226490e02b8ed09b5abc15026e54e31c5a8cd0769';

// Mock image for demo/dev mode
const MOCK_IMAGES = [
  'https://picsum.photos/seed/avatar1/768/768',
  'https://picsum.photos/seed/avatar2/768/768',
  'https://picsum.photos/seed/avatar3/768/768',
  'https://picsum.photos/seed/avatar4/768/768'
];

export async function generateAvatar(
  imageBase64: string,
  style: StyleId,
  count: 1 | 4,
  outputSize: string
): Promise<string[]> {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    await new Promise((r) => setTimeout(r, 1500));
    return MOCK_IMAGES.slice(0, count);
  }

  const [width, height] = outputSize.split('x').map(Number);
  const styleName = STYLE_TO_REPLICATE[style];
  const prompt = `${STYLE_PROMPTS[style]}, img`;

  const output = (await replicate.run(PHOTOMAKER_MODEL, {
    input: {
      prompt,
      input_image: imageBase64,
      style_name: styleName,
      num_outputs: count,
      width,
      height,
      num_inference_steps: 30,
      style_strength_ratio: 20,
      guidance_scale: 5
    }
  })) as string[];

  return Array.isArray(output) ? output : [output];
}
