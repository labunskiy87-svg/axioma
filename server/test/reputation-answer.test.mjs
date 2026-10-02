import test from 'node:test';
import assert from 'node:assert/strict';
import {formatAnswer} from '../../src/reputation-answer.mjs';

const text=value=>({type:'text',value});
const paragraph=(...children)=>({type:'paragraph',children});
test('AI answer formats zero-based citations and removes duplicated references and boilerplate',()=>{
  const tree={type:'root',children:[paragraph(text('Ответ [0] [1].')),paragraph(text('Если нужны подробности, дайте знать.')),
    {type:'heading',depth:2,children:[text('References')]},
    paragraph(text('[0] '),{type:'link',url:'https://example.org/a',children:[text('Статья')]}),
    paragraph(text('[1] '),{type:'link',url:'https://example.org/b',children:[text('Статья')]}),
  ]};
  formatAnswer()()(tree);
  assert.equal(tree.children.length,1);
  const links=tree.children[0].children.filter(node=>node.type==='link');
  assert.deepEqual(links.map(node=>node.url),['https://example.org/a','https://example.org/b']);
  assert.deepEqual(links.map(node=>node.children[0].value),['1','2']);
});
test('AI formatting preserves existing Markdown links and matches explicit source indexes',()=>{
  const link={type:'link',url:'https://example.org/original',children:[text('Название [0]')]};
  const tree={type:'root',children:[paragraph(link,text(' Текст [4].'))]};
  formatAnswer([{index:4,url:'https://example.org/source'}])()(tree);
  assert.deepEqual(tree.children[0].children[0],link);
  assert.equal(tree.children[0].children[2].url,'https://example.org/source');
});
test('Google answer removes reference footer without a heading and generic continuation suggestions',()=>{
  const tree={type:'root',children:[paragraph(text('Содержательный ответ.')),
    {type:'list',children:[{type:'listItem',children:[paragraph(text('Информация о производственных мощностях.'))]},{type:'listItem',children:[paragraph(text('Подробный перечень проектов.'))]}]},
    paragraph(text('[0] - '),{type:'link',url:'https://example.org/source',children:[text('Дублирующий источник')]})]};
  formatAnswer([{index:0,url:'https://example.org/source'}])()(tree);
  assert.equal(tree.children.length,1);assert.equal(tree.children[0].children[0].value,'Содержательный ответ.');
});
