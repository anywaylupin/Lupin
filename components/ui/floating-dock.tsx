'use client';

import { AnimatePresence, motion, MotionValue, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Link from 'next/link';
import { useRef, useState } from 'react';

import { cn } from '@/lib/utils';

import { IconLayoutNavbarCollapse } from '../icons';

type FloatingDockItem = { title: string; icon: React.ReactNode; href: string };

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
    <div className={cn('relative block md:hidden', className)}>
      <AnimatePresence>
        {open && (
          <motion.div layoutId="nav" className="absolute inset-x-0 bottom-full mb-2 flex flex-col gap-2">
            {items.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10, transition: { delay: idx * 0.05 } }}
                transition={{ delay: (items.length - 1 - idx) * 0.05 }}
              >
                <Link
                  href={item.href}
                  key={item.title}
                  target="_blank"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-neutral-900"
                >
                  <div className="h-4 w-4">{item.icon}</div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-neutral-800"
      >
        <IconLayoutNavbarCollapse className="h-5 w-5 text-neutral-500 dark:text-neutral-400" />
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
      className={cn(
        'mx-auto hidden h-14 items-center rounded-2xl bg-white px-4 py-8 dark:bg-neutral-900 md:flex',
        className
      )}
      layout
    >
      {items.map((item) => (
        <li key={item.title} className="p-2">
          <IconContainer mouseX={mouseX} {...item} />
        </li>
      ))}
    </motion.ul>
  );
};

const IconContainer = ({ mouseX, title, icon, href }: FloatingDockItem & { mouseX: MotionValue }) => {
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
    <Link href={href} target={href.startsWith('http') ? '_blank' : undefined}>
      <motion.div
        ref={ref}
        style={{ width, height }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative flex aspect-square items-center justify-center rounded-full hover:bg-gray-50 dark:hover:bg-neutral-800"
        layout
      >
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 1, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 2, x: '-50%' }}
              className="absolute -top-8 left-1/2 w-fit -translate-x-1/2 whitespace-pre rounded-md border border-neutral-200 bg-white px-2 py-0.5 text-xs font-semibold text-black dark:border-neutral-900 dark:bg-neutral-800 dark:text-white md:text-sm"
              layout
            >
              {title}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          style={{ width: widthIcon, height: heightIcon }}
          className="flex items-center justify-center"
          layout
        >
          {icon}
        </motion.div>
      </motion.div>
    </Link>
  );
};

export { FloatingDock };
