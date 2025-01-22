'use client';

import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';

import { IconMoonStars,IconSun } from '../icons';

export const ModeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <Button variant="link" type="button" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      <IconSun className="text-neutral-800 dark:hidden dark:text-neutral-200" />
      <IconMoonStars className="hidden text-neutral-800 dark:block dark:text-neutral-200" />
    </Button>
  );
};
