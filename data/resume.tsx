import { IconArticle, IconBrandGithub, IconBrandLinkedin, IconHome, IconMail, IconWorld } from '@/components/icons';

import { ModeToggle } from '@/components/common';

export default {
  name: 'Lupin Nguyen',
  initials: 'LN',
  url: 'https://dillion.io',
  location: 'Ho Chi Minh, Vietnam',
  locationLink: 'https://www.google.com/maps/place/sanfrancisco',
  greetings: ['Hi', 'Hello', 'Howdy', 'Hey there'],
  description:
    'I make magic through code (I think). Currently rolling as a Frontend Developer at TotallyAwesome. A part-time to-be problem-solver',
  summary:
    'Greetings, my name is Lupin a passionate problem-solver who excels in team environments. Working together as a team brings out the best in me and allows me to contribute my skills and ideas to achieve a common goal. As a child, I dreamed of becoming a Robotics engineer and still hold that aspiration close to my heart. The idea of robots and AI has always fascinated me, as they have the potential to solve problems both physically and logically, I firmly believe that in the future, robots and AI will play a significant role in our lives and will free up more time for us to focus on our physical and mental health, and maintain healthy relationships with others. My expertise in coding and computer science has grown significantly over the years, and I enjoy using my skills to develop practical solutions to real-world problems. I am adept at working with a range of programming languages and technologies and am always eager to learn more. In my free time, I enjoy playing sports such as tennis and soccer, which help me maintain my physical health while also providing an opportunity to bond with others. Music is also an essential part of my life, and I enjoy listening to a wide variety of genres. Rap and rock are my favorites. I find that music provides me with a sense of inspiration and motivation to keep pushing myself toward my goals. I am an avid gamer who enjoys playing games that require quick reflexes and strategic thinking. I find that gaming provides me with an opportunity to unwind and challenge myself mentally. Overall, I am a driven and motivated individual who is always looking for ways to improve and grow both personally and professionally. I believe in the power of teamwork, technology, and innovation to drive positive change in the world, and I am committed to making a meaningful impact in whatever I do.',
  avatarUrl: '/me.jpg',
  skills: ['React', 'Next.js', 'Typescript', 'Node.js', 'Python'],
  work: [
    {
      company: 'Interactive Frontend Developer',
      href: 'https://www.totallyawesome.tv',
      badges: [],
      location: 'District 10, Ho Chi Minh City, Vietnam',
      title: 'Interactive Frontend Developer',
      logoUrl: '/totally-awesome.jpg',
      start: 'Oct 2022',
      end: 'Present ',
      description: 'TotallyAwesome is the leading Youth-First engagement platform in APAC.'
    },
    {
      company: 'WinWin Tennis Club',
      badges: [],
      href: '',
      location: 'District 10, Ho Chi Minh City, Vietnam',
      title: 'Tennis Ball Boy',
      logoUrl: '/winwin-tennis-club.jpg',
      start: 'March 2022',
      end: 'July 2023',
      description: 'Competitions Committee. Retrieving and supplying tennis balls for players'
    },
    {
      company: 'Pacific Links Foundation',
      href: 'https://www.linkedin.com/company/pacificlinks',
      badges: [],
      location: 'Bình Thạnh, Ho Chi Minh City, Vietnam',
      title: 'Website Developer',
      logoUrl: '/pacific-links-foundation.jpg',
      start: 'September 2022',
      end: 'October 2022',
      description: "Builds, adjusts, and maintains Organization's Website using WordPress and Elementor."
    }
  ],
  education: [
    {
      school: 'Buildspace',
      href: 'https://buildspace.so',
      degree: 's3, s4, sf1, s5',
      logoUrl: '/buildspace.jpg',
      start: '2023',
      end: '2024'
    },
    {
      school: 'University of Waterloo',
      href: 'https://uwaterloo.ca',
      degree: "Bachelor's Degree of Computer Science (BCS)",
      logoUrl: '/waterloo.png',
      start: '2016',
      end: '2021'
    },
    {
      school: 'Wilfrid Laurier University',
      href: 'https://wlu.ca',
      degree: "Bachelor's Degree of Business Administration (BBA)",
      logoUrl: '/laurier.png',
      start: '2016',
      end: '2021'
    },
    {
      school: 'International Baccalaureate',
      href: 'https://ibo.org',
      degree: 'IB Diploma',
      logoUrl: '/ib.png',
      start: '2012',
      end: '2016'
    }
  ],
  projects: [
    {
      title: 'Chat Collect',
      href: 'https://chatcollect.com',
      dates: 'Jan 2024 - Feb 2024',
      active: true,
      description:
        'With the release of the [OpenAI GPT Store](https://openai.com/blog/introducing-the-gpt-store), I decided to build a SaaS which allows users to collect email addresses from their GPT users. This is a great way to build an audience and monetize your GPT API usage.',
      technologies: ['Next.js', 'Typescript', 'PostgreSQL', 'Prisma', 'TailwindCSS', 'Stripe', 'Shadcn UI', 'Magic UI'],
      links: [
        {
          type: 'Website',
          href: 'https://chatcollect.com',
          icon: <IconWorld className="size-3" />
        }
      ],
      image: '',
      video: 'https://pub-83c5db439b40468498f97946200806f7.r2.dev/chat-collect.mp4'
    },
    {
      title: 'Magic UI',
      href: 'https://magicui.design',
      dates: 'June 2023 - Present',
      active: true,
      description: 'Designed, developed and sold animated UI components for developers.',
      technologies: ['Next.js', 'Typescript', 'PostgreSQL', 'Prisma', 'TailwindCSS', 'Stripe', 'Shadcn UI', 'Magic UI'],
      links: [
        {
          type: 'Website',
          href: 'https://magicui.design',
          icon: <IconWorld className="size-3" />
        },
        {
          type: 'Source',
          href: 'https://github.com/magicuidesign/magicui',
          icon: <IconBrandGithub className="size-3" />
        }
      ],
      image: '',
      video: 'https://cdn.magicui.design/bento-grid.mp4'
    },
    {
      title: 'llm.report',
      href: 'https://llm.report',
      dates: 'April 2023 - September 2023',
      active: true,
      description:
        'Developed an open-source logging and analytics platform for OpenAI: Log your ChatGPT API requests, analyze costs, and improve your prompts.',
      technologies: [
        'Next.js',
        'Typescript',
        'PostgreSQL',
        'Prisma',
        'TailwindCSS',
        'Shadcn UI',
        'Magic UI',
        'Stripe',
        'Cloudflare Workers'
      ],
      links: [
        {
          type: 'Website',
          href: 'https://llm.report',
          icon: <IconWorld className="size-3" />
        },
        {
          type: 'Source',
          href: 'https://github.com/dillionverma/llm.report',
          icon: <IconBrandGithub className="size-3" />
        }
      ],
      image: '',
      video: 'https://cdn.llm.report/openai-demo.mp4'
    },
    {
      title: 'Automatic Chat',
      href: 'https://automatic.chat',
      dates: 'April 2023 - March 2024',
      active: true,
      description:
        'Developed an AI Customer Support Chatbot which automatically responds to customer support tickets using the latest GPT models.',
      technologies: [
        'Next.js',
        'Typescript',
        'PostgreSQL',
        'Prisma',
        'TailwindCSS',
        'Shadcn UI',
        'Magic UI',
        'Stripe',
        'Cloudflare Workers'
      ],
      links: [
        {
          type: 'Website',
          href: 'https://automatic.chat',
          icon: <IconWorld className="size-3" />
        }
      ],
      image: '',
      video: 'https://pub-83c5db439b40468498f97946200806f7.r2.dev/automatic-chat.mp4'
    }
  ],
  navbar: [
    { title: 'Home', icon: <IconHome />, href: '#' },

    { title: 'Blogs', icon: <IconArticle />, href: '#' },
    { title: 'GitHub', icon: <IconBrandGithub />, href: 'https://github.com/anywaylupin' },
    { title: 'Linkedin', icon: <IconBrandLinkedin />, href: 'https://www.linkedin.com/in/lupinnguyen' },
    { title: 'Send Email', icon: <IconMail />, href: 'mailto:lupin.nguyen@outlook.com' },
    { title: 'Theme', icon: <ModeToggle />, href: '' }
  ]
};
