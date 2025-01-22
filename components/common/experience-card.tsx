import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';

import resume from '@/data/resume';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui';

export const ExperienceCard = () => (
  <Accordion className="flex flex-col gap-2" type="multiple">
    {resume.work.map(({ company, logoUrl, description, start, end }) => (
      <AccordionItem key={company} value={company}>
        <AccordionTrigger className="flex w-full gap-4">
          <Avatar className="size-12 overflow-hidden rounded-full border bg-muted dark:bg-foreground">
            <AvatarImage src={logoUrl} alt={company} className="object-contain" />
            <AvatarFallback>{company[0]}</AvatarFallback>
          </Avatar>
          <h3 className="text-lg">{company}</h3>

          <span className="ml-auto text-gray-500">
            {start} - {end}
          </span>
        </AccordionTrigger>
        <AccordionContent>{description}</AccordionContent>
      </AccordionItem>
    ))}
  </Accordion>
);
