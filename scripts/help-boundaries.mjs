// Keep customer task guidance separate from the developer reference.
export function validateHelpBoundaries(config, documents) {
  const errors=[];
  const pages=groups=>(groups || []).flatMap(group=>(group.pages || []).flatMap(page=>typeof page==='string'?[page]:pages([page])));
  const help=config.navigation?.tabs?.find(tab=>tab.tab==='Help Center');
  const developer=config.navigation?.tabs?.find(tab=>tab.tab==='API & Developers');
  for(const page of pages(help?.groups)) {
    if(!page.startsWith('help/'))errors.push('Customer Help navigation cannot contain developer or release pages: '+page);
    if(page==='help/account-settings/developer-api')errors.push('Keep integration-token help accessible by URL, outside the primary customer task navigation.');
  }
  for(const page of pages(developer?.groups))if(!page.startsWith('developers/'))errors.push('API & Developers must keep its own reference: '+page);
  for(const [name,source] of documents)if(name.startsWith('help/') && /<(?:ParamField|ResponseField|RequestExample|ResponseExample|CodeGroup)\b/.test(source))errors.push(name+': API reference components belong under developers/.');
  return errors;
}
