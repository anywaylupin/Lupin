export const isFirst = <T>(array: T[], item: T) => array.indexOf(item) === 0;

export const isLast = <T>(array: T[], item: T) => array.indexOf(item) === array.length - 1;

export const isArray = (item: unknown): item is unknown[] => Array.isArray(item);

export const getRandom = <T>(array: T[]) => array[Math.floor(Math.random() * array.length)];
