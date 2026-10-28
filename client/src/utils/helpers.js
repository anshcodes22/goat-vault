export const PREDEFINED_TOPICS = [
  'Arrays',
  'Strings',
  'Hashing',
  'Binary Search',
  'Two Pointers',
  'Sliding Window',
  'Linked Lists',
  'Stacks',
  'Queues',
  'Trees',
  'Binary Search Trees',
  'Heaps',
  'Graphs',
  'Dynamic Programming',
  'Greedy',
  'Backtracking',
  'Recursion',
  'Sorting',
  'Bit Manipulation',
  'Tries',
  'Disjoint Set Union',
  'Topological Sort',
  'Shortest Paths',
  'Segment Trees',
  'Fenwick Trees',
  'Math',
  'Number Theory',
  'Prefix Sums',
  'Monotonic Stack',
  'Other'
];

export const SUPPORTED_PLATFORMS = [
  'LeetCode',
  'TakeUForward',
  'AtCoder',
  'CodeChef',
  'Codeforces',
  'CSES',
  'Other'
];

export const SUPPORTED_LANGUAGES = [
  { value: 'C++', label: 'C++', monaco: 'cpp' },
  { value: 'Java', label: 'Java', monaco: 'java' },
  { value: 'Python', label: 'Python', monaco: 'python' },
  { value: 'JavaScript', label: 'JavaScript', monaco: 'javascript' },
  { value: 'TypeScript', label: 'TypeScript', monaco: 'typescript' },
  { value: 'Rust', label: 'Rust', monaco: 'rust' },
  { value: 'Go', label: 'Go', monaco: 'go' },
  { value: 'C', label: 'C', monaco: 'c' }
];

export const formatDate = (dateString, includeTime = false) => {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid date';

  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {})
  };

  return new Intl.DateTimeFormat(undefined, options).format(date);
};

export const formatRelativeTime = (dateString) => {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid date';

  const now = new Date();
  const diffInMs = now - date;
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    if (diffInHours === 0) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} mins ago`;
    }
    return `${diffInHours} hr${diffInHours > 1 ? 's' : ''} ago`;
  }
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 30) return `${diffInDays} days ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} mo${diffInMonths > 1 ? 's' : ''} ago`;
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} yr${diffInYears > 1 ? 's' : ''} ago`;
};

export const getDifficultyStyle = (difficulty) => {
  switch (difficulty) {
    case 'Easy':
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
        badge: 'bg-emerald-100 text-emerald-800'
      };
    case 'Medium':
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
        badge: 'bg-amber-100 text-amber-800'
      };
    case 'Hard':
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500',
        badge: 'bg-rose-100 text-rose-800'
      };
    default:
      return {
        bg: 'bg-slate-50 text-slate-700 border-slate-200',
        dot: 'bg-slate-400',
        badge: 'bg-slate-100 text-slate-700'
      };
  }
};

export const getPlatformBadgeStyle = (platform) => {
  switch (platform) {
    case 'LeetCode':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'TakeUForward':
    case 'TUF':
      return 'bg-blue-50 text-blue-800 border-blue-200';
    case 'Codeforces':
    case 'CF':
      return 'bg-red-50 text-red-800 border-red-200';
    case 'CodeChef':
      return 'bg-orange-50 text-orange-800 border-orange-200';
    case 'AtCoder':
      return 'bg-zinc-100 text-zinc-900 border-zinc-300';
    case 'CSES':
      return 'bg-indigo-50 text-indigo-800 border-indigo-200';
    default:
      return 'bg-sky-50 text-sky-800 border-sky-200';
  }
};

export const isVariantFilled = (variant) => {
  if (!variant) return false;
  return Boolean(
    (variant.code && variant.code.trim().length > 0) ||
    (variant.explanation && variant.explanation.trim().length > 0) ||
    (variant.timeComplexity && variant.timeComplexity.trim().length > 0) ||
    (variant.spaceComplexity && variant.spaceComplexity.trim().length > 0) ||
    (variant.notes && variant.notes.trim().length > 0)
  );
};

export const getFilledVariants = (approaches = []) => {
  if (!Array.isArray(approaches)) return [];
  return approaches.filter(isVariantFilled);
};

