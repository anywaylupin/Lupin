'use client';

import { AnimatePresence, motion, MotionValue, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Link from 'next/link';
import { useRef, useState } from 'react';

import { cn } from '@/lib/utils';

import { IconLayoutNavbarCollapse } from '../icons';

type FloatingDockItem = { title: string; icon: React.ReactNode; href?: string };

type FloatingDockProps = { items: FloatingDockItem[]; className?: string; mobileClassName?: string };

const FloatingDock = ({ items, className, mobileClassName }: FloatingDockProps) => {
  return (
    <>
      <FloatingDockDesktop items={items} className={className} />
      <FloatingDockMobile items={items} className={mobileClassName} />
    </>
  );
};

const FloatingDockMobile = ({ items, className }: { items: FloatingDockItem[]; className?: string }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn('absolute top-0 block md:hidden', className)}>
      <AnimatePresence>
        {open && (
          <motion.ul layoutId="nav" className="absolute inset-x-0 bottom-full flex flex-col gap-2">
            {items.map((item, idx) => (
              <motion.li
                key={item.title}
                className="flex size-10 items-center justify-center rounded-full border border-border bg-background"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: -8 }}
                exit={{ opacity: 0, y: 10, transition: { delay: idx * 0.05 } }}
                transition={{ delay: (items.length - 1 - idx) * 0.05 }}
              >
                {item.href ? (
                  <Link href={item.href} key={item.title} target="_blank">
                    {item.icon}
                  </Link>
                ) : (
                  item.icon
                )}
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen(!open)}
        className="flex size-10 items-center justify-center rounded-full border border-border bg-background"
      >
        <IconLayoutNavbarCollapse className="text=primary h-5 w-5" />
      </button>
    </div>
  );
};

const FloatingDockDesktop = ({ items, className }: FloatingDockProps) => {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.ul
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn('mx-auto hidden h-14 items-center rounded-2xl bg-background px-4 py-8 md:flex', className)}
      layout
    >
      {items.map((item) => (
        <li key={item.title} className="p-2">
          {item.href ? (
            <Link href={item.href} className="size-full" target={item.href.startsWith('http') ? '_blank' : undefined}>
              <IconContainer mouseX={mouseX} {...item} />
            </Link>
          ) : (
            <IconContainer mouseX={mouseX} {...item} />
          )}
        </li>
      ))}
    </motion.ul>
  );
};

const IconContainer = ({ mouseX, title, icon }: { title: string; icon: React.ReactNode; mouseX: MotionValue }) => {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };

    return val - bounds.x - bounds.width / 2;
  });

  const widthTransform = useTransform(distance, [-150, 0, 150], [30, 60, 30]);
  const heightTransform = useTransform(distance, [-150, 0, 150], [30, 60, 30]);

  const widthTransformIcon = useTransform(distance, [-150, 0, 150], [20, 40, 20]);
  const heightTransformIcon = useTransform(distance, [-150, 0, 150], [20, 40, 20]);

  const width = useSpring(widthTransform, { mass: 0.1, stiffness: 150, damping: 10 });
  const height = useSpring(heightTransform, { mass: 0.1, stiffness: 150, damping: 10 });

  const widthIcon = useSpring(widthTransformIcon, { mass: 0.1, stiffness: 150, damping: 10 });
  const heightIcon = useSpring(heightTransformIcon, { mass: 0.1, stiffness: 150, damping: 10 });

  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      style={{ width, height }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex aspect-square items-center justify-center rounded-full hover:bg-muted"
      layout
    >
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 1, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 2, x: '-50%' }}
            className="absolute -top-8 left-1/2 w-fit -translate-x-1/2 whitespace-pre rounded-md border border-border bg-background px-2 py-0.5 text-xs font-semibold text-primary md:text-sm"
            layout
          >
            {title}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        style={{ width: widthIcon, height: heightIcon }}
        className="flex items-center justify-center text-primary"
        layout
      >
        {icon}
      </motion.div>
    </motion.div>
  );
};

export { FloatingDock };
