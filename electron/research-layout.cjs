const path = require('node:path');
const { segments } = require('../shared/investment-chain-segments.json');
function industry(value = '其他行业') {
  const result = segments.find(item => item.name === value || item.directory === value);
  if (!result) throw new Error('请选择有效的主题研究所属行业。');
  return result;
}
function industryFromPath(relative) { return segments.find(item => item.directory === relative.split(/[\\/]/)[0]); }
function isWithin(root, file) { const relative = path.relative(root,file); return relative === '' || (relative !== '..' && !relative.startsWith('..'+path.sep) && !path.isAbsolute(relative)); }
function rebaseLink(value, from, to) {
  if (!value || value.startsWith('#') || (/^[a-z][a-z\d+.-]*:/i.test(value) && !/^[a-z]:[\\/]/i.test(value)) || value.startsWith('//')) return value;
  const split = value.search(/[?#]/), local = split < 0 ? value : value.slice(0,split), suffix = split < 0 ? '' : value.slice(split);
  let decoded; try { decoded = decodeURIComponent(local); } catch { decoded = local; }
  const original = path.resolve(from,decoded), target = isWithin(from,original) ? path.join(to,path.relative(from,original)) : original;
  return (path.relative(to,target) || '.').split(path.sep).join('/') + suffix;
}
function rebaseFreeMarkdown(content, from, to) {
  const transform = text => text.replace(/(!?\[[^\]\n]*\]\()(<[^>\n]*>|[^\s)\n]+)([^)\n]*\))/g,(_all,start,destination,end) => {
    const angle = destination.startsWith('<'), raw = angle ? destination.slice(1,-1) : destination;
    const updated = rebaseLink(raw,from,to); return `${start}${angle ? '<'+updated+'>' : updated}${end}`;
  }).replace(/^(\s{0,3}\[[^\]]+\]:\s*)(<[^>\n]*>|[^\s]+)/,(_all,start,destination) => {
    const angle = destination.startsWith('<'), updated = rebaseLink(angle ? destination.slice(1,-1) : destination,from,to);
    return start+(angle ? '<'+updated+'>' : updated);
  });
  let fence = '';
  return content.split(/(\r?\n)/).map(line => {
    const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (marker) { if (!fence) fence=marker[1]; else if (marker[1][0]===fence[0] && marker[1].length>=fence.length) fence=''; return line; }
    if (fence) return line;
    let result='',cursor=0;
    while(cursor<line.length) {
      const start=line.indexOf('`',cursor); if(start<0) { result+=transform(line.slice(cursor)); break; }
      let end=start+1; while(line[end]==='`') end++;
      const closing=line.indexOf(line.slice(start,end),end);
      if(closing<0) { result+=transform(line.slice(cursor)); break; }
      result+=transform(line.slice(cursor,start))+line.slice(start,closing+end-start); cursor=closing+end-start;
    }
    return result;
  }).join('');
}
function rebaseTopicContent(content, from, to, name, markdown) {
  let result='',cursor=0;
  for(const note of markdown.researchNotes(content)) {
    result+=rebaseFreeMarkdown(content.slice(cursor,note.offset),from,to);
    result+=markdown.renderResearchNote({ ...note, sourcePath:rebaseLink(note.sourcePath || '',from,to), ...(note.imagePath ? {imagePath:rebaseLink(note.imagePath,from,to)} : {}) },rebaseFreeMarkdown(note.comment,from,to));
    cursor=note.offset+note.raw.length;
  }
  result+=rebaseFreeMarkdown(content.slice(cursor),from,to);
  if (/^domiResearchIndustry:.*$/m.test(result)) result=result.replace(/^domiResearchIndustry:.*$/m,`domiResearchIndustry: ${name}`);
  else result=result.replace(/^(domiResearchId: .+)$/m,`$1\ndomiResearchIndustry: ${name}`);
  return result;
}
module.exports={ segments, industry, industryFromPath, isWithin, rebaseTopicContent };
