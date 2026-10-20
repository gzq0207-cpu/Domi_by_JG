import chain from '../shared/investment-chain-segments.json' with { type:'json' };
export const RESEARCH_INDUSTRIES = chain.segments;
export function researchIndustryForPath(path: string) {
  const parts=path.split(/[\\/]/);
  return RESEARCH_INDUSTRIES.find(item=>parts.includes(item.directory))?.name || '其他行业';
}
