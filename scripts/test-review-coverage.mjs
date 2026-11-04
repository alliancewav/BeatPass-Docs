import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {validateReviewCoverage} from './review-coverage.mjs';
const sha=value=>createHash('sha256').update(value).digest('hex');
const entry={path:'help/example.mdx',reviewed:true,reviewed_sha256:sha('Reviewed'),source_paths:['resources/client/example.tsx'],remaining_gaps:[]};
test('review coverage requires every current MDX and the exact reviewed bytes',()=>{
  const documents=new Map([['help/example.mdx','Reviewed']]);
  assert.deepEqual(validateReviewCoverage(documents,{pages:[entry]}),[]);
  documents.set('help/example.mdx','Changed');documents.set('help/new.mdx','New');
  const errors=validateReviewCoverage(documents,{pages:[entry]}).join('\n');
  assert.match(errors,/requires editorial review/);assert.match(errors,/missing editorial review/);
});
test('generated coverage cannot bypass editorial review for help pages',()=>{
  assert.match(validateReviewCoverage(new Map([['help/example.mdx','Reviewed']]),{pages:[{...entry,generated:true}]}).join('\n'),/only catalog-generated/);
});
