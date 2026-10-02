import test from 'node:test';
import assert from 'node:assert/strict';
import {preselectMaterials} from '../reputation-preselection.mjs';
const item={url:'https://social.example/post',title:'Отзыв пользователя',snippet:'Короткий личный опыт'};
const connection={apiKey:'secret',settings:{model:'model-test'}};
test('preselection preserves public reviews with separate person, brand and company instructions',async()=>{
  for(const [type,expected] of [['person','Персона:'],['brand','Бренд:'],['company','Компания:']]) {
    const result=await preselectMaterials({name:'Объект',type,queries:['Объект'],profile:{}},[item],connection,{fetchImpl:async(url,options)=>{
      const request=JSON.parse(options.body);
      assert.ok(request.messages[0].content.includes(expected));
      assert.match(request.messages[0].content,/Не исключай отзыв, пользовательскую публикацию или соцсеть/);
      assert.match(request.messages[0].content,/При сомнении выбирай uncertain/);
      return Response.json({choices:[{message:{content:JSON.stringify({results:[{url:item.url,decision:'include',confidence:0.9,reason:'Публичный отзыв'}]})}}]});
    }});
    assert.equal(result[0].decision,'include');
  }
});
test('weak exclusions become uncertain and malformed or incomplete selections fail safely',async()=>{
  const run=results=>preselectMaterials({name:'Объект',type:'brand'},[item],connection,{fetchImpl:async()=>Response.json({choices:[{message:{content:JSON.stringify({results})}}]})});
  assert.equal((await run([{url:item.url,decision:'exclude',confidence:0.8,reason:'Сомнение'}]))[0].decision,'uncertain');
  await assert.rejects(run([]));
  await assert.rejects(run([{url:'https://other.example/',decision:'include',confidence:1,reason:'Подмена'}]));
});
