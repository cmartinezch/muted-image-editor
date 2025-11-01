import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import ImageDisplay from './components/ImageDisplay';
import Uploader from './components/Uploader';
import { fileToBase64 } from './utils/imageUtils';

interface OriginalImage {
  dataUrl: string;
  base64: string;
  mimeType: string;
}

const PRESETS = [
    // Gradients are designed to be representative of the filter's effect.
    { name: 'Coastal Haze', prompt: 'Apply a bright and airy VSCO-style filter, slightly desaturated with clean whites, enhancing blues and greens for a cool, misty coastal morning feel.', bgStyle: { background: 'linear-gradient(to top left, #d1e5e8, #f0f4f7)' } },
    { name: 'Urban Noir', prompt: 'Emulate a classic Leica monochrome look: high contrast, deep crushed blacks, sharp details, and a heavy film grain for a gritty, dramatic street photography style.', bgStyle: { background: 'linear-gradient(to top left, #333, #000)' } },
    { name: 'Emerald Valley', prompt: 'Recreate a Fujifilm film simulation look, emphasizing lush emerald greens and earthy browns. Apply a soft, cinematic glow with slightly muted highlights.', bgStyle: { background: 'linear-gradient(to top left, #2e7d32, #6d4c41)' } },
    { name: 'Golden Hour', prompt: 'Generate a warm, nostalgic Kodak Ektar filter effect. Enhance red, orange, and yellow tones, add a subtle halation effect around light sources, and apply a fine grain for a vintage sunset vibe.', bgStyle: { background: 'linear-gradient(to top left, #ffb74d, #ff8a65)' } },
    { name: 'Faded Polaroid', prompt: 'Transform the image to look like a faded, vintage Polaroid print from the 70s. Desaturate colors, add a yellow-ish tint, soften the focus, and add a classic white border.', bgStyle: { background: 'linear-gradient(to top left, #fffde7, #d7ccc8)' } },
    { name: 'Cyberpunk Glow', prompt: 'Apply a futuristic, cyberpunk aesthetic. Introduce vibrant neon blues, pinks, and purples into the shadows and highlights, and increase the overall contrast.', bgStyle: { background: 'linear-gradient(to top left, #f025e3, #8a2be2, #00ffff)' } },
    { name: 'Infrared Dream', prompt: 'Simulate an infrared photograph. Turn foliage and greens into a stark white or light pink, darken the skies to near-black, and create a surreal, high-contrast landscape.', bgStyle: { background: 'linear-gradient(to top left, #ffc0cb, #ffffff)' } },
    { name: 'Lomography Pop', prompt: 'Mimic a Lomography camera effect with oversaturated colors, heavy vignetting, light leaks in the corners, and a slightly distorted, soft-focus look.', bgStyle: { background: 'radial-gradient(ellipse at center, #ffeb3b 0%, #f44336 60%, #212121 100%)' } },
    { name: 'Dutch Master', prompt: 'Render the image in the style of a Dutch Golden Age oil painting. Add a chiaroscuro effect with dramatic lighting, deep shadows, a warm golden palette, and a subtle canvas texture.', bgStyle: { background: 'linear-gradient(to top left, #4e342e, #a1887f)' } },
    { name: 'Holographic Shimmer', prompt: 'Add an iridescent, holographic overlay to the image. Create shimmering, rainbow-like reflections across surfaces, especially highlights, for a magical, futuristic feel.', bgStyle: { background: 'linear-gradient(45deg, #ff00ff, #00ffff, #ffff00, #ff00ff)' } },
    { name: 'Kodak Gold 200', prompt: 'Emulate the look of Kodak Gold 200 film. Introduce a warm, golden-hour glow, slightly saturate the colors for a nostalgic feel, and add a very fine, subtle grain. Keep skin tones natural and pleasing.', bgStyle: { background: 'linear-gradient(to top left, #fbc02d, #f57f17)' } },
    { name: 'Portra 400', prompt: 'Recreate the aesthetic of Kodak Portra 400 film. Mute the contrast slightly, ensure exceptionally soft and natural skin tones, and introduce a very fine grain. The color palette should be natural with a slight warmth.', bgStyle: { background: 'linear-gradient(to top left, #e0e0e0, #ffe0b2)' } },
    { name: 'CineStill 800T', prompt: 'Simulate the look of CineStill 800T film. Shift the color balance towards cool, cinematic blues and teals, especially in the shadows. Add distinct red halation (a glowing effect) around bright light sources. Enhance grain for a tungsten film look.', bgStyle: { background: 'linear-gradient(to top left, #004d40, #d50000)' } },
    { name: 'Ilford HP5+', prompt: 'Convert the image to a high-contrast black and white, mimicking Ilford HP5+ 400 film. Create deep, rich blacks and crisp whites while retaining detail in the mid-tones. Add a classic, noticeable grain structure.', bgStyle: { background: 'linear-gradient(to top left, #e0e0e0, #212121)' } },
    { name: 'Velvia 50', prompt: 'Emulate the punchy, vibrant look of Fuji Velvia 50 slide film. Dramatically boost color saturation, especially in reds, blues, and greens. Increase contrast for a sharp, high-impact look suitable for landscapes.', bgStyle: { background: 'linear-gradient(to top left, #0277bd, #2e7d32, #c62828)' } },
    { name: 'Cross-Process', prompt: 'Apply a cross-processing (X-Pro) effect. Shift colors dramatically, creating high-contrast and oversaturated results, often with a strong cyan or magenta cast in the shadows and yellow/green highlights.', bgStyle: { background: 'linear-gradient(to top left, #ffee58, #00bcd4, #ab47bc)' } },
    { name: 'Wet Plate Collodion', prompt: 'Transform the image to resemble a 19th-century wet plate collodion photograph. Convert to monochrome, drastically increase contrast, add imperfections like chemical streaks, dust, and scratches, and create heavy vignetting.', bgStyle: { background: 'radial-gradient(ellipse at center, #bfb6a8 0%, #5d4037 100%)' } },
    { name: 'Anamorphic Flare', prompt: 'Add a cinematic anamorphic lens flare. Introduce a distinct, horizontal blue flare that stretches across the image, originating from the brightest light sources.', bgStyle: { background: 'linear-gradient(90deg, #111 40%, #42a5f5 50%, #111 60%)' } },
    { name: 'Tilt-Shift Miniature', prompt: 'Apply a tilt-shift lens effect to create a miniature faking look. Introduce a narrow band of sharp focus horizontally across the image, while progressively blurring the foreground and background. Slightly increase color saturation.', bgStyle: { background: 'linear-gradient(0deg, #81c78499 0%, #a1887f99 20%, #64b5f6 50%, #42424299 80%, #a1887f99 100%)' } },
    { name: 'Orton Effect Glow', prompt: 'Create a dreamy, ethereal glow using the Orton Effect. Blend the original sharp image with an overexposed, blurry version of itself. The result should be soft, glowing highlights and a surreal, painterly quality.', bgStyle: { background: 'radial-gradient(ellipse at center, #ffffff, #ffe0b2, #b3e5fc)' } },
    { name: 'Motion Pan', prompt: 'Simulate a panning motion blur effect. Keep the central subject as sharp as possible while rendering the background with a strong horizontal motion blur, giving a sense of high speed.', bgStyle: { background: 'repeating-linear-gradient(90deg, #bdbdbd, #bdbdbd 10px, #616161 10px, #616161 20px)' } },
    { name: 'Redscale Shift', prompt: 'Apply a redscale film effect. Overwhelm the image with a fiery red, orange, and yellow color cast. Increase grain and contrast for a surreal, otherworldly look.', bgStyle: { background: 'linear-gradient(to top left, #ff3d00, #ff9100, #ffea00)' } },
    { name: 'Double Exposure', prompt: 'Create a creative double exposure. Blend the current image with a silhouette of a person against a bright sky, or with a dense forest texture, ensuring the final image is a seamless and artistic combination of both.', bgStyle: { background: 'linear-gradient(to top left, #263238, #ffffff), linear-gradient(to top right, #388e3c, #ffffff)' } },
    { name: 'Bleach Bypass', prompt: 'Apply a harsh bleach bypass effect, common in gritty cinema. Desaturate the colors significantly, crush the blacks, blow out the highlights, and dramatically increase contrast and grain for a high-impact, edgy look.', bgStyle: { background: 'linear-gradient(to top left, #9e9e9e, #212121)' } },
    { name: 'Cyanotype Blue', prompt: 'Convert the image into a cyanotype print. Render the entire image in varying shades of deep Prussian blue and white, with high contrast and a slight texture as if printed on paper.', bgStyle: { background: 'linear-gradient(to top left, #003366, #e3f2fd)' } },
    { name: 'Solarized Print', prompt: 'Apply the Sabattier effect (solarization). Partially reverse the tones of the image, especially in the mid-tones, creating a surreal look where dark areas appear light and vice versa. Often results in a metallic, high-contrast appearance.', bgStyle: { background: 'linear-gradient(to top left, #757575, #d4af37, #424242)' } },
    { name: 'Soft Focus Filter', prompt: 'Simulate a soft focus or mist filter effect. Add a gentle, hazy glow to the entire image, especially around highlights, reducing fine detail and creating a dreamy, romantic atmosphere.', bgStyle: { background: 'radial-gradient(ellipse at center, #ffffffcc, #e1f5fe33)' } },
    { name: 'Pinhole Aesthetic', prompt: 'Give the image the characteristics of a pinhole camera photograph. Introduce significant softness, heavy vignetting (dark corners), and slight color shifting for a lo-fi, dreamy quality.', bgStyle: { background: 'radial-gradient(ellipse at center, #e0e0e0 0%, #424242 100%)' } },
    { name: 'Glowy High-Key', prompt: 'Transform the image into a high-key style. Overexpose the scene to blow out highlights and eliminate most shadows, creating a bright, airy, and ethereal look with a focus on form and light.', bgStyle: { background: 'linear-gradient(to top left, #ffffff, #fafafa, #f5f5f5)' } },
    { name: 'Dramatic Low-Key', prompt: 'Transform the image into a low-key style. Plunge the majority of the frame into deep shadow, using a single, directional light source to carve out the subject. This should be dramatic, moody, and full of contrast.', bgStyle: { background: 'radial-gradient(ellipse at center, #616161 0%, #000000 70%)' } },
    { name: 'Teal & Orange', prompt: 'Apply a modern cinematic teal and orange color grade. Shift shadows and cool tones towards teal/cyan, and push skin tones and highlights towards warm orange/yellow for a popular, high-impact movie look.', bgStyle: { background: 'linear-gradient(to top left, #00838f, #ffab40)' } },
    { name: 'Split Tone Sepia', prompt: 'Apply a classic split-tone effect. Convert the image to monochrome, then tint the shadows with a cool blue or selenium tone and the highlights with a warm sepia or gold tone for a rich, archival look.', bgStyle: { background: 'linear-gradient(to top left, #455a64, #a1887f)' } },
    { name: 'Light Leak Overlay', prompt: 'Add authentic-looking analog light leaks. Overlay warm, abstract streaks of red, orange, and yellow light, particularly near the edges of the frame, to simulate a flawed film camera.', bgStyle: { background: 'linear-gradient(135deg, #000 50%, #ffab00 75%, #e65100 85%, #000 86%)' } },
    { name: 'Matrix Glitch', prompt: 'Introduce a digital glitch art effect. Add elements of pixel sorting, datamoshing, and RGB channel separation to create a chaotic, corrupted, yet visually interesting digital aesthetic.', bgStyle: { background: 'linear-gradient(to right, #000, #0f0, #000)' } },
    { name: 'Grainy Risograph', prompt: 'Simulate the look of a Risograph print. Reduce the color palette to two or three bold, slightly misaligned colors (e.g., blue and fluorescent pink), and apply a heavy, stippled grain texture.', bgStyle: { background: 'linear-gradient(to top left, #0277bd, #ff4081)' } },
    { name: 'Day for Night', prompt: 'Apply a "Day for Night" (American night) cinematic effect. Darken the image, significantly increase the contrast, and add a strong blue or cyan color cast to simulate a scene shot in daylight but appearing as if it were nighttime.', bgStyle: { background: 'linear-gradient(to top left, #0d47a1, #000000)' } },
    { name: 'Aquamarine Tint', prompt: 'Wash the image in an aquamarine and cyan tint, reminiscent of underwater photography. Mute other colors and create a cool, stylized, and slightly surreal mood.', bgStyle: { background: 'linear-gradient(to top left, #00bfa5, #00b8d4)' } },
    { name: 'Charcoal Sketch', prompt: 'Convert the image into a realistic, high-contrast charcoal sketch. Emphasize strong lines, textures, and dramatic shading, as if drawn by an artist on textured paper. Remove all color.', bgStyle: { background: 'linear-gradient(to top left, #e0e0e0, #424242)' } },
    { name: '1960s Technicolor', prompt: 'Emulate the saturated, vibrant look of 1960s Technicolor films. Push the saturation of primary colors (reds, blues, yellows) to their limits while maintaining pleasing skin tones. The image should look lush and hyper-real.', bgStyle: { background: 'linear-gradient(to top left, #fdd835, #1e88e5, #d81b60)' } },
    { name: 'Matte Finish', prompt: 'Apply a modern matte finish. Lift the black point so that the darkest parts of the image are a faded grey, and slightly desaturate the colors. This creates a trendy, film-like, non-glossy appearance.', bgStyle: { background: 'linear-gradient(to top left, #78909c, #37474f)' } },
    { name: 'Anaglyph 3D', prompt: 'Create a retro anaglyph 3D effect. Separate the red and cyan color channels and offset them slightly to produce a stereoscopic image that would appear 3D when viewed with old-school 3D glasses.', bgStyle: { background: 'linear-gradient(45deg, #f00, #0ff)' } },
    { name: 'Autumnal Equinox', prompt: 'Shift the color palette to an autumnal theme. Enhance deep reds, rustic oranges, and golden yellows while desaturating greens and blues, giving the scene a crisp, fall atmosphere.', bgStyle: { background: 'linear-gradient(to top left, #e65100, #ff6f00, #8d6e63)' } },
    { name: 'Vintage Postcard', prompt: 'Make the image look like a faded vintage travel postcard from the 1950s. Desaturate the colors, apply a cream-colored tint, soften the image, and add a subtle linen paper texture.', bgStyle: { background: 'linear-gradient(to top left, #fff9c4, #efebe9)' } },
    { name: 'Shutter Drag', prompt: 'Simulate a slow shutter speed effect with a flash (shutter drag). Freeze the main subject with a burst of light while allowing ambient light to create colorful motion trails and blurs in the background.', bgStyle: { background: 'linear-gradient(90deg, #111, #ff1744, #3d5afe, #111)' } },
    { name: 'Liquid Chrome', prompt: 'Apply a metallic, liquid chrome effect to the subject. Increase specularity and reflections to make surfaces look like polished, flowing metal, creating a futuristic and abstract look.', bgStyle: { background: 'linear-gradient(to top left, #e0e0e0, #757575, #e0e0e0, #bdbdbd)' } },
    { name: 'Neon Noir', prompt: 'Create a neon noir aesthetic. Plunge the scene into darkness, illuminated only by vibrant, glowing neon lights. Emphasize deep shadows, wet reflections on surfaces, and a palette of electric pinks, blues, and purples.', bgStyle: { background: 'linear-gradient(to top left, #000, #d500f9, #2962ff)' } },
    { name: 'Bloom Haze', prompt: 'Introduce a strong bloom effect, where bright light sources spill and bleed into surrounding areas. This should create a very soft, hazy, and dreamlike atmosphere, almost like looking through a foggy lens.', bgStyle: { background: 'radial-gradient(ellipse at center, #ffffff, #e3f2fd)' } },
    { name: 'Gilded Age', prompt: 'Add an opulent, gilded touch to the image. Tint the highlights with a rich, metallic gold and deepen the shadows to create a look of luxury, reminiscent of Gustav Klimt paintings.', bgStyle: { background: 'linear-gradient(to top left, #3e2723, #ffab00)' } },
    { name: 'Chromatic Aberration', prompt: 'Introduce a subtle but distinct chromatic aberration effect, where color channels (red, green, blue) are slightly misaligned, especially towards the edges of the frame. This mimics the look of a vintage or lo-fi lens.', bgStyle: { background: 'linear-gradient(to right, #f00, #0f0, #00f)' } },
    { name: 'Infrared B&W', prompt: 'Convert the image to a high-contrast black and white infrared photograph. Make green foliage appear bright white, darken blue skies to near black, and cut through atmospheric haze to reveal sharp details.', bgStyle: { background: 'linear-gradient(to top left, #fff, #000)' } },
    { name: 'Expired Film', prompt: 'Simulate the look of expired film stock. Introduce unpredictable color shifts, often towards magenta in the shadows, increased grain, and slightly faded, muted contrast for a beautifully flawed, lo-fi aesthetic.', bgStyle: { background: 'linear-gradient(to top left, #880e4f, #fce4ec)' } },
    { name: 'Graphic Duotone', prompt: 'Simplify the image into a high-contrast, two-color duotone print. Use a bold, graphic color combination like navy blue and electric yellow, replacing all shadows and highlights with these two tones for a modern, posterized look.', bgStyle: { background: 'linear-gradient(to top left, #0d47a1, #ffff00)' } },
    { name: 'Vintage VHS', prompt: 'Recreate the aesthetic of a VHS tape from the 1980s. Introduce analog noise, scan lines, color bleeding (especially reds), a slightly softened image, and a 4:3 aspect ratio crop with rounded corners to complete the retro VCR look.', bgStyle: { background: 'linear-gradient(to bottom, #424242, #212121), repeating-linear-gradient(0deg, #00000055, #00000055 1px, transparent 1px, transparent 2px)' } },
    { name: 'Platinum Print', prompt: 'Emulate the rich, archival look of a Platinum Palladium print. Convert to a monochrome image with an exceptionally long and smooth tonal range, soft gray mid-tones, deep but detailed shadows, and a subtle warmth, giving it a timeless, luxurious quality.', bgStyle: { background: 'linear-gradient(to top left, #e0e0e0, #616161)' } },
    { name: 'Lensbaby Twist', prompt: 'Simulate the effect of a Lensbaby Twist lens. Keep the center of the image sharp and in focus, while rendering the outer edges with a dramatic, swirling, painterly bokeh that draws the viewer\'s eye inward.', bgStyle: { background: 'radial-gradient(ellipse at center, #f5f5f5 10%, #bdbdbd 30%, #424242 90%)' } },
    { name: 'Gobo Shadows', prompt: 'Overlay realistic, artistic gobo shadows onto the scene, as if light is being cast through a patterned object like window blinds, tree leaves, or an abstract shape. This adds depth, mood, and a sense of environment to the photograph.', bgStyle: { background: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 50%, #000 50%, #000 75%, transparent 75%, transparent 100%)' } },
    { name: 'Muted Earth', prompt: 'Apply a modern, moody filter with muted earth tones. Desaturate blues and greens, and shift them towards a subtle teal. Enhance browns, beiges, and oranges for a warm, cohesive, and slightly desaturated look with lifted blacks.', bgStyle: { background: 'linear-gradient(to top left, #8d6e63, #a1887f, #bcaaa4)' } },
    { name: 'Daguerreotype', prompt: 'Transform the image into an early Daguerreotype. Convert it to a low-saturation monochrome image on a reflective, silver-like surface. Add a very subtle blue or sepia tint, increase fine detail sharpness, and include minor imperfections like dust and scratches.', bgStyle: { background: 'linear-gradient(to top left, #eceff1, #b0bec5)' } },
    { name: 'Harris Shutter', prompt: 'Simulate the Harris Shutter effect. On any moving elements in the image, create a tri-color ghosting effect by separating and offsetting the red, green, and blue channels. Stationary parts of the image should remain relatively sharp.', bgStyle: { background: 'linear-gradient(to right, #ff000088, #00ff0088, #0000ff88)' } },
    { name: 'Autochrome', prompt: 'Recreate the aesthetic of an Autochrome Lumière photograph. Apply a soft, painterly glow to the image and render the colors with a subtle pointillist texture, as if viewed through microscopic red, green, and blue grains. The overall palette should be slightly muted and dreamlike.', bgStyle: { background: 'radial-gradient(circle, #ffcc80, #81d4fa, #c5e1a5)' } },
    { name: 'Sakura Bloom', prompt: 'Apply a soft, airy filter inspired by Japanese cherry blossoms. Introduce a subtle pink tint to the highlights, slightly desaturate greens, and lift the shadows for a dreamy, ethereal feel with clean whites.', bgStyle: { background: 'linear-gradient(to top left, #fce4ec, #ffffff)' } },
    { name: 'Coppola Haze', prompt: 'Create a dreamy, hazy aesthetic reminiscent of a Sofia Coppola film. Apply a soft-focus glow, desaturate the colors into a pastel palette, lift the shadows, and add a subtle halation or bloom effect in the highlights for a nostalgic, sun-drenched look.', bgStyle: { background: 'linear-gradient(to top left, #fff176, #b3e5fc, #ffcdd2)' } },
];


const Header: React.FC = () => (
  <header className="bg-background/80 backdrop-blur-sm p-4 border-b border-border sticky top-0 z-10">
    <div className="container mx-auto flex justify-between items-center">
      <h1 className="text-2xl font-serif text-foreground">
        Muted Image Editor
      </h1>
      <p className="text-sm text-muted hidden sm:block">AI-Powered Image Editing</p>
    </div>
  </header>
);

const ButtonSpinner: React.FC = () => (
  <svg className="animate-spin h-6 w-6 text-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const CheckIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);


const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<OriginalImage | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [appliedPreset, setAppliedPreset] = useState<string | null>(null);
  const [intensity, setIntensity] = useState<number>(100);
  
  const intensityDebounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirmationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Cleanup timeouts on unmount
    return () => {
      if (intensityDebounceTimeout.current) clearTimeout(intensityDebounceTimeout.current);
      if (confirmationTimeout.current) clearTimeout(confirmationTimeout.current);
    }
  }, []);

  const handleImageUpload = async (file: File) => {
    try {
      setError(null);
      setEditedImage(null);
      setSelectedPreset(null);
      setAppliedPreset(null);
      setIntensity(100);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        const { data: base64, mimeType } = await fileToBase64(file);
        setOriginalImage({ dataUrl, base64, mimeType });
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to process image file.');
      console.error(err);
    }
  };

  const generateEdit = useCallback(async (currentPrompt: string, currentIntensity: number, presetName: string) => {
    if (!originalImage) {
      setError("Please upload an image first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    if (presetName !== selectedPreset) {
        setEditedImage(null);
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const finalPrompt = `${currentPrompt} The desired intensity of this effect should be ${currentIntensity}%. A value of 100% is full strength, and a value of 0% should result in an almost unchanged image. Adjust the effect subtly for intermediate values.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: originalImage.base64,
                mimeType: originalImage.mimeType,
              },
            },
            {
              text: finalPrompt,
            },
          ],
        },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

      for (const part of response.candidates?.[0]?.content.parts ?? []) {
        if (part.inlineData) {
          setEditedImage(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
          setAppliedPreset(presetName);
          if (confirmationTimeout.current) clearTimeout(confirmationTimeout.current);
          confirmationTimeout.current = setTimeout(() => {
              setAppliedPreset(null);
          }, 2000);
          return;
        }
      }
      throw new Error("No image data found in the response.");
    } catch (err: any) {
      setError(err.message || "Failed to edit image. Please check your API key and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, selectedPreset]);

  const handlePresetClick = (presetName: string, presetPrompt: string) => {
    if (isLoading) return;
    
    if (intensityDebounceTimeout.current) clearTimeout(intensityDebounceTimeout.current);
    if (confirmationTimeout.current) clearTimeout(confirmationTimeout.current);
    setAppliedPreset(null);

    setSelectedPreset(presetName);
    setIntensity(100);
    generateEdit(presetPrompt, 100, presetName);
  };
  
  const handleIntensityChange = (newIntensity: number) => {
    setIntensity(newIntensity);

    if (intensityDebounceTimeout.current) clearTimeout(intensityDebounceTimeout.current);
    
    intensityDebounceTimeout.current = setTimeout(() => {
        const preset = PRESETS.find(p => p.name === selectedPreset);
        if (preset) {
            generateEdit(preset.prompt, newIntensity, preset.name);
        }
    }, 500); // 500ms debounce
  };

  const reset = () => {
    setOriginalImage(null);
    setEditedImage(null);
    setError(null);
    setIsLoading(false);
    setSelectedPreset(null);
    setAppliedPreset(null);
    setIntensity(100);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        {!originalImage ? (
          <Uploader onImageUpload={handleImageUpload} />
        ) : (
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              <ImageDisplay title="Original" imageUrl={originalImage.dataUrl} onReset={reset} />
              <ImageDisplay title="Edited" imageUrl={editedImage} isLoading={isLoading && !editedImage} />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-center">
                <p><strong>Error:</strong> {error}</p>
              </div>
            )}
            
            <div className="bg-transparent p-6 rounded-lg border border-border mt-4">
              <div className="text-center mb-6">
                <p className="text-lg font-medium text-foreground">Choose a preset to transform your image</p>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handlePresetClick(preset.name, preset.prompt)}
                    disabled={isLoading}
                    style={preset.bgStyle}
                    className={`
                      relative group aspect-square rounded-md overflow-hidden 
                      text-foreground text-center flex items-center justify-center 
                      transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background
                      disabled:cursor-not-allowed disabled:opacity-50
                      ${selectedPreset === preset.name ? 'ring-2 ring-accent ring-offset-2 ring-offset-background' : 'ring-0'}
                    `}
                    aria-pressed={selectedPreset === preset.name}
                  >
                    <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors duration-200"></div>
                     <div className="relative z-10 flex items-center justify-center h-full w-full">
                        {isLoading && selectedPreset === preset.name ? (
                            <ButtonSpinner />
                        ) : appliedPreset === preset.name ? (
                            <CheckIcon />
                        ) : (
                            <span className="text-xs font-medium p-1 break-words">
                                {preset.name}
                            </span>
                        )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedPreset && (
              <div className="bg-transparent p-6 rounded-lg border border-border">
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                      <label htmlFor="intensity-slider" className="text-lg font-medium text-foreground">
                          Filter Intensity
                      </label>
                      <span className="font-bold text-accent text-lg tabular-nums">{intensity}%</span>
                  </div>
                  <input
                      id="intensity-slider"
                      type="range"
                      min="0"
                      max="100"
                      value={intensity}
                      onChange={(e) => handleIntensityChange(Number(e.target.value))}
                      disabled={isLoading}
                      className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-accent disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;