import {createHash} from 'node:crypto';

// Full capture diagnostics stay in the private staged manifest. Public ledgers
// retain the checks and identities needed for reproducible acceptance without
// disclosing disposable host paths or copied stylesheet diagnostics.
export function publicMediaRecord(record) {
  const result=structuredClone(record),checks=result.crop?.checks;
  if(checks) {
    delete checks.accessibility_css_rules;
    for(const image of checks.images??[])if(typeof image.src==='string') {
      image.source_id=createHash('sha256').update(image.src).digest('hex');
      delete image.src;
    }
  }
  return result;
}
