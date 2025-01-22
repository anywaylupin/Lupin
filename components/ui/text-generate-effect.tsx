'use client';

import { AnimationScope, motion, stagger, useAnimate, useInView, UseInViewOptions } from 'framer-motion';
import { useEffect } from 'react';

interface TextGenerateEffectProps extends React.ComponentProps<typeof motion.div> {
  words: string;
  active?: boolean;
  customScope?: AnimationScope | React.ForwardedRef<HTMLElement>;
  className?: string;
  filter?: boolean;
  duration?: number;
  options?: UseInViewOptions;
}

const TextGenerateEffect = ({
  active = true,
  words,
  customScope,
  className,
  filter = true,
  duration = 0.5,
  options,
  ...rest
}: TextGenerateEffectProps) => {
  const [scope, animate] = useAnimate();
  const isInView = useInView((customScope as AnimationScope) ?? scope, options);

  const wordsArray = words.split('');

  useEffect(() => {
    animate(
      'span',
      active && isInView
        ? { opacity: 1, filter: filter ? 'blur(0px)' : 'none' }
        : { opacity: 0, filter: filter ? 'blur(5px)' : 'none' },
      { duration, delay: stagger(0.02) }
    );
  }, [active, animate, duration, filter, isInView]);

  return (
    <motion.div ref={scope} className={className} {...rest}>
      {wordsArray.map((word, idx) => (
        <motion.span key={word + idx} className="opacity-0" style={{ filter: filter ? 'blur(5px)' : 'none' }}>
          {word}
          {''}
        </motion.span>
      ))}
    </motion.div>
  );
};

export { TextGenerateEffect, type TextGenerateEffectProps };
