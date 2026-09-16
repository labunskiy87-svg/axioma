import ts from 'typescript';
import {readFile,writeFile} from 'node:fs/promises';
const source=await readFile('axioma_pr.tsx','utf8');
const file=ts.createSourceFile('axioma_pr.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const result=[];
function visit(node,component='module') {
  if(ts.isVariableDeclaration(node)&&node.initializer&&(ts.isArrowFunction(node.initializer)||ts.isFunctionExpression(node.initializer)))component=node.name.getText(file);
  if(ts.isJsxElement(node)||ts.isJsxSelfClosingElement(node)) {
    const opening=ts.isJsxElement(node)?node.openingElement:node;
    if(['Button','button'].includes(opening.tagName.getText(file))) {
      const handler=opening.attributes.properties.find(a=>ts.isJsxAttribute(a)&&a.name.getText(file)==='onClick');
      const label=ts.isJsxElement(node)?node.children.map(c=>c.getText(file)).join(' ').replace(/\s+/g,' ').trim():'';
      result.push({component,line:file.getLineAndCharacterOfPosition(node.getStart(file)).line+1,label,handler:handler?.initializer?.getText(file)||null});
    }
  }
  ts.forEachChild(node,child=>visit(child,component));
}
visit(file);
await writeFile('docs/button-inventory.json',JSON.stringify(result,null,2));
console.log(`Indexed ${result.length} buttons; handlers require semantic review, not all buttons write data.`);
