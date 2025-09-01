import { type Bucket } from '@/components/charts/stacked-bars';

export function calcPercents(buckets: Array<{ label: string; male: number; female: number }>, total: number): Bucket[] {
  return buckets.map(bucket => {
    const rowTotal = bucket.male + bucket.female;
    const percent = total > 0 ? (rowTotal / total) * 100 : 0;
    
    return {
      ...bucket,
      percent
    };
  });
}