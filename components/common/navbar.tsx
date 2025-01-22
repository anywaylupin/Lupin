import { ModeToggle } from '../common';
import { IconArticle, IconBrandGithub, IconBrandLinkedin, IconHome, IconMail } from '../icons';
import { FloatingDock } from '../ui';

const links = [
  {
    title: 'Home',
    icon: <IconHome />,
    href: '#'
  },

  {
    title: 'Blogs',
    icon: <IconArticle />,
    href: '#'
  },
  {
    title: 'GitHub',
    icon: <IconBrandGithub />,
    href: 'https://github.com/anywaylupin'
  },
  {
    title: 'Linkedin',
    icon: <IconBrandLinkedin />,
    href: 'https://www.linkedin.com/in/lupinnguyen'
  },
  {
    title: 'Send Email',
    icon: <IconMail />,
    href: 'mailto:lupin.nguyen@outlook.com'
  },
  {
    title: 'Theme',
    icon: <ModeToggle />,
    href: ''
  }
];

export const Navbar = () => {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto mb-4 flex h-full max-h-14 origin-bottom">
      <FloatingDock mobileClassName="translate-y-20" items={links} />
    </nav>
  );
};
