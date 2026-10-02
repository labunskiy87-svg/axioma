import sanitizeHtml from 'sanitize-html';

export const sanitizeMaterialBody=body=>sanitizeHtml(body,{
  allowedTags:['p','br','h1','h2','strong','b','em','i','ul','ol','li','blockquote','a','img','font','span'],
  allowedAttributes:{a:['href','target','rel'],img:['src','alt'],font:['face','size'],span:['style']},
  allowedSchemes:['http','https','mailto'],
  allowedStyles:{span:{'font-family':[/^(Manrope|Arial|Georgia)$/],'font-size':[/^(10|12|14|16|18|20|24|28|32|36|48)px$/]}},
  transformTags:{a:(tag,attrs)=>({tagName:tag,attribs:{...attrs,target:'_blank',rel:'noopener noreferrer'}})},
}).trim();

export const materialText=body=>sanitizeHtml(body,{allowedTags:[],allowedAttributes:{}}).trim();
export function materialAssets(body) {
  const assets=new Set();
  sanitizeHtml(body,{transformTags:{
    a:(tag,attrs)=>{if(attrs.href)assets.add(`link:${attrs.href}`);return {tagName:tag,attribs:attrs};},
    img:(tag,attrs)=>{if(attrs.src)assets.add(`image:${attrs.src}`);return {tagName:tag,attribs:attrs};},
  }});
  return assets;
}
