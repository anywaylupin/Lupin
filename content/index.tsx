import { IconArticle, IconBrandGithub, IconBrandLinkedin, IconHome, IconMail, IconWorld } from '@/components/icons';

export default {
  name: 'Nhân',
  shortname: 'Nhân Nguyễn',
  fullname: 'Nguyễn Chơn Trọng Nhân',
  initials: 'NCTN',
  domain: 'https://anywaylupin.vercel.app',
  greetings: ['Hi', 'Hello', 'Howdy', 'Hey'],
  description:
    "Conjuring magic through code. Currently thriving as a Frontend Developer at TotallyAwesome, I'm on a part-time journey to become a master problem-solver.",
  about:
    "Hello! I'm Lupin—a dedicated problem-solver who thrives in collaborative settings. My childhood dream of becoming a Robotics engineer still inspires me. I am fascinated by the potential of robots and AI to address challenges in our lives. With a growing expertise in coding and computer science, I aim to develop innovative solutions. I also enjoy sports, music, and gaming, which keep me balanced and motivated.",
  experience: [
    {
      title: 'Interactive Frontend Developer',
      company: 'TotallyAwesome',
      logo: '/totally-awesome.jpg',
      dates: 'October 2022 - Present',
      location: 'District 10, Ho Chi Minh City, Vietnam',
      badges: [
        { title: 'Website', icon: IconWorld, href: 'https://www.totallyawesome.tv' },
        { title: 'Linkedin', icon: IconBrandLinkedin, href: 'https://www.linkedin.com/company/totallyawesome' }
      ],
      description:
        'Creating interactive and engaging digital experiences, including rich media creatives that enhance user engagement and brand awareness, encompass various formats such as mini-games, carousels, 3D elements, and multimedia showcases. I also develop and maintain internal tools and software that help improve workflows and efficiency.'
    },
    {
      title: 'Website Developer',
      company: 'Pacific Links Foundation',
      logo: '/pacific-links-foundation.jpg',
      dates: 'September 2022 - October 2022',
      location: 'Binh Thanh District, Ho Chi Minh City, Vietnam',
      badges: [
        { title: 'Website', icon: IconWorld, href: 'https://pacificlinks.org' },
        { title: 'Linkedin', icon: IconBrandLinkedin, href: 'https://www.linkedin.com/company/pacificlinks' }
      ],
      description: "Responsible for building and maintaining the organization's website using WordPress and Elementor."
    }
  ],
  skills: ['React', 'Next.js', 'Typescript', 'Node.js', 'Python'],
  projects: [
    {
      title: 'Shopper Landing Page',
      image: '/shopper.png',
      description:
        'Showcasing a dynamic ad banner platform with a demo preview. Users can visualize banners in various sizes and product amounts, with the ability to scrape data from e-commerce sites for potential real-time updates.',
      tags: ['Next.js', 'TailwindCSS', 'Phaser', 'GSAP', 'Shadcn UI', 'Aceternity UI', 'Embla Carousel'],
      website: 'https://slp-dev.vercel.app',
      highlight: '#0047CB'
    },
    {
      title: 'ChopKyHoa',
      image: '/chopkyhoa.png',
      description:
        'Interactive portfolio for a pickleball coach showcasing programs and client testimonials. Features smooth horizontal scrolling and booking options for a seamless user experience.',
      tags: ['Next.js', 'TailwindCSS', 'Shadcn UI', 'GSAP', 'Nodemailer'],
      website: 'https://thaivanthuc.vercel.app',
      github: 'https://github.com/anywaylupin/ChopKyHoa',
      highlight: '#d7ff01'
    },
    {
      title: 'HieuNhan',
      image: '/hieunhan.png',
      description:
        'Portfolio and blog designed for a university student to highlight academic activities and share insights. The clean layout allows for easy presentation of achievements and reflections.',
      tags: ['React', 'Astro', 'TailwindCSS', 'Aceternity UI', 'Framer Motion'],
      website: 'https://hieunhan.vercel.app',
      github: 'https://github.com/anywaylupin/HieuNhan',
      highlight: '#F9E6F0'
    }
  ],
  navbar: [
    { title: 'Home', icon: <IconHome />, href: '/' },
    { title: 'Blogs', icon: <IconArticle />, href: '/blog' },
    { title: 'GitHub', icon: <IconBrandGithub />, href: 'https://github.com/anywaylupin' },
    { title: 'Linkedin', icon: <IconBrandLinkedin />, href: 'https://www.linkedin.com/in/lupinnguyen' },
    { title: 'Send Email', icon: <IconMail />, href: 'mailto:lupin.nguyen@outlook.com' }
  ]
};
