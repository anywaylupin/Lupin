import content from '@/content';

import { FloatingDock } from '../ui';

export const Navbar = () => {
  return (
    <nav className="fixed bottom-4 z-50 mx-auto flex max-h-max origin-bottom items-center justify-center">
      <FloatingDock className="border shadow" mobileClassName="-translate-y-10" items={content.navbar} />
    </nav>
  );
};
