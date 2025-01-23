import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';
import Link from 'next/link';

import content from '@/content';

import { Badge } from '../ui';

export const ExperienceCards = () => (
  <ul className="relative left-4 gap-4 divide-y divide-dashed border-l">
    {content.experience.map(({ title, company, logo, dates, location, description, badges }) => (
      <li key={company} className="relative">
        <Avatar className="absolute -left-6 top-2 flex size-12 items-center justify-center overflow-hidden rounded-full border border-border bg-background">
          <AvatarImage src={logo} alt={company} className="object-contain" />
          <AvatarFallback>{company[0]}</AvatarFallback>
        </Avatar>

        <div className="flex flex-1 flex-col justify-start gap-1 py-4 pl-10">
          <h2 className="text-base font-semibold leading-none">{company}</h2>
          <h3 className="text-sm">{title}</h3>
          <time className="text-xs text-muted-foreground">{dates}</time>
          <p className="text-sm text-muted-foreground">{location}</p>
          <span className="prose dark:prose-invert text-sm text-muted-foreground">{description}</span>

          {badges && badges.length > 0 && (
            <div className="mt-2 flex flex-row flex-wrap items-start gap-2">
              {badges?.map(({ title, icon: Icon, href }, idx) => (
                <Link href={href} key={`${title}-${idx}`}>
                  <Badge title={title} className="flex gap-2">
                    <Icon className="size-4" />
                    {title}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </div>
      </li>
    ))}
  </ul>
);
