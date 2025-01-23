import Image from 'next/image';

import content from '@/content';
import { BLUR_FADE_DELAY } from '@/lib/constants';
import { getRandom } from '@/lib/utils';

import { Avatar, AvatarFallback, AvatarImage, BlurFade, TextGenerateEffect } from '../ui';

export const Header = () => {
  const message = `${getRandom(content.greetings)}, I'm ${content.name.split(' ')[0]} `;

  return (
    <header id="hero" className="flex w-full max-w-2xl justify-between gap-2 px-6 pt-12 sm:pt-24">
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-3 text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
          <TextGenerateEffect transition={{ delay: BLUR_FADE_DELAY }} words={message} />
          <BlurFade delay={BLUR_FADE_DELAY}>
            <Image src="/alien-monster.png" alt="Alien Monster" width="50" height="50" />
          </BlurFade>
        </div>

        <TextGenerateEffect
          transition={{ delay: BLUR_FADE_DELAY }}
          className="max-w-[600px] md:text-xl"
          words={content.description}
        />
      </div>
      <Avatar className="size-28 border">
        <AvatarImage alt={content.name} src={content.avatarUrl} />
        <AvatarFallback>{content.initials}</AvatarFallback>
      </Avatar>
    </header>
  );
};
