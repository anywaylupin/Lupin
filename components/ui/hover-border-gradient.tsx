'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

type Direction = 'TOP' | 'LEFT' | 'BOTTOM' | 'RIGHT';

interface Props extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  containerClassName?: string;
  highlight?: string;
  duration?: number;
  clockwise?: boolean;
}

export const HoverBorderGradient = ({
  children,
  containerClassName,
  className,
  as: Tag = 'div',
  highlight = '#3275F8',
  duration = 1,
  clockwise = true,
  ...props
}: Props) => {
  const [hovered, setHovered] = useState<boolean>(false);
  const [direction, setDirection] = useState<Direction>('TOP');

  const movingMap: Record<Direction, string> = {
    TOP: 'radial-gradient(20.7% 50% at 50% 0%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)',
    LEFT: 'radial-gradient(16.6% 43.1% at 0% 50%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)',
    BOTTOM: 'radial-gradient(20.7% 50% at 50% 100%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)',
    RIGHT: 'radial-gradient(16.2% 41.199999999999996% at 100% 50%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)'
  };

  const background = `radial-gradient(75% 181.15942028985506% at 50% 50%, ${highlight} 0%, rgba(255, 255, 255, 0) 100%)`;

  useEffect(() => {
    const rotateDirection = (currentDirection: Direction): Direction => {
      const directions: Direction[] = ['TOP', 'LEFT', 'BOTTOM', 'RIGHT'];
      const currentIndex = directions.indexOf(currentDirection);
      const nextIndex = clockwise
        ? (currentIndex - 1 + directions.length) % directions.length
        : (currentIndex + 1) % directions.length;
      return directions[nextIndex];
    };

    if (!hovered) {
      const interval = setInterval(() => {
        setDirection((prevState) => rotateDirection(prevState));
      }, duration * 1000);
      return () => clearInterval(interval);
    }
  }, [clockwise, duration, hovered]);

  return (
    <Tag
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'relative flex w-fit flex-col flex-nowrap content-center items-center justify-center gap-10 overflow-visible rounded-xl border decoration-clone transition duration-500',
        containerClassName
      )}
      {...props}
    >
      <div className={cn('z-10 w-auto rounded-[inherit]', className)}>{children}</div>
      <motion.div
        className={cn('absolute inset-0 z-0 size-full flex-none overflow-hidden rounded-[inherit] blur-[2px]')}
        initial={{ background: movingMap[direction] }}
        animate={{ background: hovered ? [movingMap[direction], background] : movingMap[direction] }}
        transition={{ ease: 'linear', duration: duration ?? 1 }}
      />
      <div className="z-1 absolute inset-[2px] flex-none" />
    </Tag>
  );
};
