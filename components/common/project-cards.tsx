import Image from 'next/image';
import Link from 'next/link';
import Markdown from 'react-markdown';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import content from '@/content';

import { IconBrandGithub, IconWorld } from '../icons';
import { HoverBorderGradient } from '../ui';

export const ProjectCards = () => {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {content.projects.map(({ title, image, description, tags, website, github, highlight }, id) => (
        <HoverBorderGradient key={`${title}-${id}`} className="h-full" highlight={highlight}>
          <Card className="flex h-full flex-col overflow-hidden rounded-xl border-none transition hover:shadow-md">
            <Link href={website} className="block cursor-pointer" target="_blank">
              {image && (
                <Image
                  src={image}
                  alt={title}
                  width={500}
                  height={300}
                  className="h-40 w-full overflow-hidden object-cover object-top"
                />
              )}
            </Link>

            <CardHeader>
              <CardTitle className="mt-1 text-start text-base">{title}</CardTitle>
              <div className="hidden text-xs underline print:visible">
                {website?.replace('https://', '').replace('www.', '').replace('/', '')}
              </div>
              <Markdown className="prose dark:prose-invert max-w-full text-pretty text-start text-xs text-muted-foreground">
                {description}
              </Markdown>
            </CardHeader>

            <CardContent className="mt-auto flex w-full flex-wrap gap-1">
              {tags?.map((tag) => (
                <Badge className="px-1 py-0 text-[10px]" variant="secondary" key={tag}>
                  {tag}
                </Badge>
              ))}
            </CardContent>

            <CardFooter>
              <div className="flex flex-row flex-wrap items-start gap-1">
                {website && (
                  <Link href={website} target="_blank">
                    <Badge className="flex gap-2 px-2 py-1 text-[10px]">
                      <IconWorld className="size-4" /> Website
                    </Badge>
                  </Link>
                )}
                {github && (
                  <Link href={github} target="_blank">
                    <Badge className="flex gap-2 px-2 py-1 text-[10px]">
                      <IconBrandGithub className="size-4" /> Source
                    </Badge>
                  </Link>
                )}
              </div>
            </CardFooter>
          </Card>
        </HoverBorderGradient>
      ))}
    </div>
  );
};
