import resume from '@/data/resume';

import { FloatingDock } from '../ui';

export const Navbar = () => {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto mb-4 flex h-full max-h-14 origin-bottom">
      <FloatingDock className="shadow" mobileClassName="translate-y-20" items={resume.navbar} />
    </nav>
  );
};
