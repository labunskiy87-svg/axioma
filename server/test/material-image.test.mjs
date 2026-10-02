import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {sanitizeMaterialBody} from '../material-content.mjs';
import {rewriteFixture} from './rewrite-fixture.mjs';

test('material images keep safe dimensions, caption and alternative text',()=>{
  const html=sanitizeMaterialBody('<figure onclick="alert(1)"><img src="https://example.org/image.png" width="320" height="180" alt="Описание" onerror="alert(1)"><figcaption>Подпись &amp; источник</figcaption></figure>');
  assert.match(html,/<figure>/);assert.match(html,/width="320"/);assert.match(html,/height="180"/);assert.match(html,/alt="Описание"/);assert.match(html,/<figcaption>Подпись &amp; источник<\/figcaption>/);
  assert.doesNotMatch(html,/onclick|onerror/);
  assert.doesNotMatch(sanitizeMaterialBody('<img src="https://example.org/i.png" width="99999" height="-1">'),/width|height/);
});

test('saved material retains image dimensions and visible caption through update',async()=>{
  const f=await rewriteFixture(async()=>{throw new Error('No provider request expected');});
  try {
    const body='<p>Текст</p><figure><img src="https://example.org/image.png" width="320" alt="Описание"><figcaption>Подпись</figcaption></figure>';
    const payload={title:'Материал с подписью',body,format:'article',advertiserId:null,projectId:null,metadata:{}};
    const create=await f.app.inject({method:'POST',url:'/api/materials/batch',headers:{origin:f.origin,cookie:f.cookie,'idempotency-key':randomUUID()},payload:[payload]});
    assert.equal(create.statusCode,200);const [material]=create.json();assert.equal(material.body,sanitizeMaterialBody(body));
    const updated=await f.app.inject({method:'PUT',url:`/api/materials/${material.id}`,headers:{origin:f.origin,cookie:f.cookie},payload:{...payload,version:material.version,body:body.replace('width="320"','width="240"')}});
    assert.equal(updated.statusCode,200);
    const list=await f.app.inject({method:'GET',url:'/api/materials',headers:{cookie:f.cookie}});
    const saved=list.json().find(row=>row.id===material.id);assert.match(saved.body,/width="240"/);assert.match(saved.body,/<figcaption>Подпись/);
  } finally {await f.close();}
});
