'use client';

import { useTheme } from 'next-themes';

import content from '@/content';

import { IconMoonStars, IconSun } from '../icons';
import { Button, FloatingDock } from '../ui';

export const ModeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <Button variant="link" type="button" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      <IconSun className="text-neutral-800 dark:hidden dark:text-neutral-200" />
      <IconMoonStars className="hidden text-neutral-800 dark:block dark:text-neutral-200" />
    </Button>
  );
};

export const Navbar = () => {
  const navItems = [...content.navbar, { title: 'Theme', icon: <ModeToggle /> }];

  return (
    <nav className="fixed bottom-4 z-50 mx-auto flex max-h-max origin-bottom items-center justify-center">
      <FloatingDock className="border shadow" mobileClassName="-translate-y-10" items={navItems} />
    </nav>
  );
};
