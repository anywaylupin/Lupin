import Image from 'next/image';

import resume from '@/data/resume';
import { BLUR_FADE_DELAY } from '@/lib/constants';
import { getRandom } from '@/lib/utils';

import { Avatar, AvatarFallback, AvatarImage, BlurFade, TextGenerateEffect } from '../ui';

export const Header = () => {
  const message = `${getRandom(resume.greetings)}, I'm ${resume.name.split(' ')[0]} `;

  return (
    <header id="hero" className="flex w-full max-w-2xl justify-between gap-2">
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
          words={resume.description}
        />
      </div>
      <Avatar className="size-28 border">
        <AvatarImage alt={resume.name} src={resume.avatarUrl} />
        <AvatarFallback>{resume.initials}</AvatarFallback>
      </Avatar>
    </header>
  );
};
