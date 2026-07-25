export type Outcome = {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  label: string;
};

export const outcomes: Outcome[] = [
  {
    value: 1.5,
    suffix: ' mo',
    decimals: 1,
    label: 'of blocked R&D unblocked in three hours',
  },
  {
    value: 1,
    prefix: '< ',
    suffix: ' min',
    label: 'for four-level annotation planning',
  },
  {
    value: 90,
    suffix: '%',
    label: 'less time spent syncing camera sessions',
  },
  {
    value: 50,
    suffix: '+',
    label: 'operators served by one capture timebase',
  },
];
