import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adjacentComment, anchorRange, orderedComments } from '../src/document-comments.ts';
const annotation = (id, anchor = {}, extra = {}) => ({ id, kind:'text', anchor:{quote:id,...anchor}, comment:'评论', createdAt:10, ...extra });
test('评论按原文顺序浏览，整篇评论置顶，空评论和纯高亮不进入导航', () => {
  const input = [annotation('late',{documentOffset:90},{createdAt:1}),annotation('snapshot',{noteId:'note',offset:0,documentOffset:30}),annotation('early',{offset:5}),annotation('whole',{}, {kind:'document'}),annotation('highlight',{}, {comment:'  '})];
  const result = orderedComments(input);
  assert.deepEqual(result.map(item=>item.id),['whole','early','snapshot','late']);
  assert.equal(input[0].id,'late','不能改写原批注数组');
  assert.equal(adjacentComment(result,'late',1).id,'whole');
  assert.equal(adjacentComment(result,'whole',-1).id,'late');
  assert.equal(adjacentComment(result,'missing',1).id,'whole');
  assert.equal(adjacentComment(result,'missing',-1).id,'late');
  assert.equal(adjacentComment([],'',1),undefined);
});
test('PDF 评论按页码及页面从上到下、从左到右排序', () => {
  const pdf = (id,page,rect) => annotation(id,{pages:[{page,rects:[rect]}]});
  assert.deepEqual(orderedComments([pdf('page2',2,[0,600,30,620]),pdf('bottom',1,[0,20,30,40]),pdf('right',1,[80,600,100,620]),pdf('left',1,[10,600,40,620])]).map(item=>item.id),['left','right','bottom','page2']);
});
test('原文变化后只允许唯一匹配，拒绝用旧偏移猜测重复选段', () => {
  assert.deepEqual(anchorRange('前文 原句 后文',{quote:'原句',offset:3}),{start:3,end:5});
  assert.deepEqual(anchorRange('改过前文 原句 新后文',{quote:'原句',prefix:'旧前文',offset:0},false),{start:5,end:7});
  assert.equal(anchorRange('原句 和 原句',{quote:'原句',offset:0},false),null);
  assert.deepEqual(anchorRange('原句 和 原句',{quote:'原句',prefix:' 和 ',offset:0},false),{start:5,end:7});
  assert.equal(anchorRange('已删除',{quote:'原句',offset:0},false),null);
  assert.equal(anchorRange('abc',{quote:''}),null);
});
