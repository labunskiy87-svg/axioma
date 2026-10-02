import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeNegativeTopics,analyzeMaterialTopics} from '../reputation-negative-topics.mjs';
const material=(url,sentiment='negative')=>({url:`https://example.org/${url}`,title:url,fullText:`Текст ${url}: автор обсуждает конкретный сюжет.`,significant:true,analysis:{sentiment,topics:['СТАРЫЕ МЕТКИ'],claims:[]}});
const rows=[material('crime'),material('contracts'),material('factory','positive'),{...material('registry'),significant:false}];
const connection={apiKey:'secret',settings:{model:'test-model'}};
const response=data=>Response.json({model:'test-model',choices:[{message:{content:JSON.stringify(data)}}]});
test('negative topics use only negative article texts and assign every displayed article once',async()=>{
  const result=await analyzeNegativeTopics({name:'Объект'},rows,connection,{fetchImpl:async(url,options)=>{
    const request=JSON.parse(options.body),input=JSON.parse(request.messages[1].content);
    assert.equal(request.response_format.json_schema.name,'reputation_negative_topics');
    assert.deepEqual(input.articles.map(item=>item.url),rows.slice(0,2).map(item=>item.url));
    assert.ok(input.articles.every(item=>item.text.includes('Текст')));
    assert.doesNotMatch(options.body,/СТАРЫЕ МЕТКИ/);
    return response({topics:[{name:'Предполагаемые криминальные связи',description:'Обвинения автора',materialUrls:[rows[0].url]},{name:'Обвинения по контрактам',description:'Заявления автора',materialUrls:[rows[1].url]}]});
  }});
  assert.equal(result.materialCount,2);assert.deepEqual(result.topics.map(item=>item.count),[1,1]);
});
test('negative analysis rejects invented URLs, duplicate assignments, omissions and Other',async()=>{
  for(const topics of [
    [{name:'Тема',description:'Описание',materialUrls:['https://example.org/other']}],
    [{name:'Тема',description:'Описание',materialUrls:[rows[0].url,rows[0].url]}],
    [{name:'Тема',description:'Описание',materialUrls:[rows[0].url]}],
    [{name:'Прочие',description:'Описание',materialUrls:rows.slice(0,2).map(item=>item.url)}],
  ])await assert.rejects(analyzeNegativeTopics({name:'Объект'},rows,connection,{fetchImpl:async()=>response({topics})}));
});
test('material themes inspect all significant texts and require integer importance and full coverage',async()=>{
  const topics=[{name:'Обвинения',description:'Утверждения авторов',importance:90,tone:'negative',materialUrls:rows.slice(0,2).map(item=>item.url)},{name:'Развитие производства',description:'Позитивный сюжет',importance:60,tone:'positive',materialUrls:[rows[2].url]}];
  const result=await analyzeMaterialTopics({name:'Объект'},rows,connection,{fetchImpl:async(url,options)=>{
    assert.equal(JSON.parse(options.body).response_format.json_schema.name,'reputation_material_topics');
    assert.equal(JSON.parse(JSON.parse(options.body).messages[1].content).articles.length,3);
    return response({topics});
  }});
  assert.equal(result.materialCount,3);assert.deepEqual(result.topics.map(item=>item.importance),[90,60]);
  await assert.rejects(analyzeMaterialTopics({name:'Объект'},rows,connection,{fetchImpl:async()=>response({topics:topics.slice(0,1)})}));
  await assert.rejects(analyzeMaterialTopics({name:'Объект'},rows,connection,{fetchImpl:async()=>response({topics:topics.map(item=>({...item,importance:0.82}))})}));
});
test('empty cohorts need no model calls and missing full text is not replaced by old tags',async()=>{
  assert.equal((await analyzeNegativeTopics({},[],connection)).status,'empty');
  assert.equal((await analyzeMaterialTopics({},[],connection)).status,'empty');
  await assert.rejects(analyzeNegativeTopics({},[{...rows[0],fullText:''}],connection),/отсутствует текст/);
});
