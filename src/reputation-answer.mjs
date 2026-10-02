export function formatAnswer(sources=[]) {
  return ()=>tree=>{
    const text=node=>node.type==='text'?node.value:(node.children??[]).map(text).join('');
    const links=new Map(sources.map((source,index)=>[source.index??index+1,source.url]));
    const referenceStart=tree.children.findIndex(node=>['heading','paragraph'].includes(node.type)&&/^(references|sources|источники|ссылки)$/i.test(text(node).trim()));
    const referenceNodes=referenceStart>=0?tree.children.slice(referenceStart+1):tree.children.filter(node=>node.type==='paragraph'&&/^\s*\[\d+\]\s*[-–—]?\s*/.test(text(node)));
    if(referenceNodes.length) {
      for(const node of referenceNodes) {
        const number=text(node).match(/^\s*\[(\d+)\]/);
        const findLink=entry=>entry.type==='link'?entry.url:(entry.children??[]).map(findLink).find(Boolean);
        const url=findLink(node);
        if(number&&url)links.set(Number(number[1]),url);
      }
      if(referenceStart>=0)tree.children.splice(referenceStart);
      else tree.children=tree.children.filter(node=>!referenceNodes.includes(node));
    }
    const indexed=sources.some(source=>Number.isInteger(source.index))||links.has(0);
    tree.children=tree.children.filter(node=>!(node.type==='paragraph'&&/^Если(?:\s|,)[\s\S]*дайте знать[.!]?$/i.test(text(node).trim())));
    tree.children=tree.children.filter(node=>!(node.type==='list'&&node.children.every(item=>/^(?:Информация о |Подробный перечень |Детали структуры |Могу рассказать |Хотите узнать )/i.test(text(item).trim()))));
    const visit=node=>{
      if(!node.children||['link','linkReference','code','inlineCode'].includes(node.type))return;
      node.children=node.children.flatMap(child=>{
        if(child.type!=='text'){visit(child);return [child];}
        const result=[];let start=0;
        for(const match of child.value.matchAll(/\[(\d+)\]/g)) {
          const number=Number(match[1]),url=links.get(number);
          if(!url||!/^https?:\/\//i.test(url))continue;
          if(match.index>start)result.push({type:'text',value:child.value.slice(start,match.index)});
          result.push({type:'link',url,children:[{type:'text',value:String(indexed?number+1:number)}]});
          start=match.index+match[0].length;
        }
        if(start<child.value.length)result.push({type:'text',value:child.value.slice(start)});
        return result.length?result:[child];
      });
    };
    visit(tree);
  };
}
