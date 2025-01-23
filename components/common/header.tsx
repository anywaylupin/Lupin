import content from '@/content';
import { BLUR_FADE_DELAY } from '@/lib/constants';
import { getRandom } from '@/lib/utils';

import { EmojiBee } from '../emojis';
import { BlurFade, TextGenerateEffect } from '../ui';

export const Header = () => {
  const message = `${getRandom(content.greetings)}, I'm ${content.name.split(' ')[0]} `;

  return (
    <header id="hero" className="flex w-full max-w-2xl items-center justify-between gap-2 px-6 pt-12 sm:pt-24">
      <div className="flex flex-1 flex-col gap-1.5">
        <TextGenerateEffect
          className="text-3xl font-bold sm:text-5xl xl:text-6xl/none"
          transition={{ delay: BLUR_FADE_DELAY }}
          words={message}
        />

        <TextGenerateEffect
          transition={{ delay: BLUR_FADE_DELAY }}
          className="max-w-[600px] text-sm md:text-xl"
          words={content.description}
        />
      </div>
      <BlurFade delay={BLUR_FADE_DELAY * 1.5}>
        <EmojiBee />
      </BlurFade>
    </header>
  );
};
