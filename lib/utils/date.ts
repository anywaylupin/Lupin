export const formatDate = (date: string) => {
  const currentDate = new Date();
  const targetDate = new Date(date.includes('T') ? date : `${date}T00:00:00`);
  const timeDifference = currentDate.getTime() - targetDate.getTime();
  const daysAgo = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

  const fullDate = targetDate.toLocaleString('en-us', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  switch (true) {
    case daysAgo < 1:
      return 'Today';
    case daysAgo < 7:
      return `${fullDate} (${daysAgo}d ago)`;
    case daysAgo < 30: {
      const weeksAgo = Math.floor(daysAgo / 7);
      return `${fullDate} (${weeksAgo}w ago)`;
    }
    case daysAgo < 365: {
      const monthsAgo = Math.floor(daysAgo / 30);
      return `${fullDate} (${monthsAgo}mo ago)`;
    }
    default: {
      const yearsAgo = Math.floor(daysAgo / 365);
      return `${fullDate} (${yearsAgo}y ago)`;
    }
  }
};
