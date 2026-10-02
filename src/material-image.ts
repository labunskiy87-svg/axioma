import Image from '@tiptap/extension-image';
import {mergeAttributes} from '@tiptap/react';

export const MaterialImage=Image.extend({
  addAttributes() {
    return {...this.parent?.(),caption:{default:'',rendered:false}};
  },
  parseHTML() {
    return [
      {tag:'figure',getAttrs:element=>{
        const figure=element as HTMLElement,image=figure.querySelector('img');
        if(!image||(!this.options.allowBase64&&/^data:/i.test(image.getAttribute('src')||'')))return false;
        return {src:image.getAttribute('src'),alt:image.getAttribute('alt'),title:image.getAttribute('title'),width:image.getAttribute('width'),height:image.getAttribute('height'),caption:figure.querySelector('figcaption')?.textContent||''};
      }},
      ...(this.parent?.()||[]),
    ];
  },
  renderHTML({node,HTMLAttributes}) {
    const image=['img',mergeAttributes(this.options.HTMLAttributes,HTMLAttributes)] as const;
    return node.attrs.caption?['figure',{},image,['figcaption',{},node.attrs.caption]]:image;
  },
  addNodeView() {
    const parent=this.parent?.();if(!parent)return null;
    return props=>{
      const view=parent(props),figure=document.createElement('figure'),caption=document.createElement('figcaption'),controls=document.createElement('div');
      controls.dataset.imageControls='';controls.contentEditable='false';
      caption.contentEditable='true';caption.setAttribute('role','textbox');caption.setAttribute('aria-label','Подпись изображения');caption.dataset.placeholder='Добавить подпись';
      figure.append(view.dom,controls,caption);
      caption.addEventListener('input',()=>{
        const pos=props.getPos();if(pos===undefined)return;
        const node=props.editor.state.doc.nodeAt(pos);if(!node)return;
        const text=(caption.textContent||'').slice(0,300);
        props.editor.view.dispatch(props.editor.state.tr.setNodeMarkup(pos,undefined,{...node.attrs,caption:text}));
      });
      const dragPreview=(event:DragEvent)=>{const image=figure.querySelector('img');if(image&&event.dataTransfer)event.dataTransfer.setDragImage(image,Math.min(image.clientWidth/2,120),Math.min(image.clientHeight/2,80));};
      figure.addEventListener('dragstart',dragPreview);
      const sync=node=>{
        if(document.activeElement!==caption)caption.textContent=node.attrs.caption||'';caption.hidden=!node.attrs.caption;
        const image=figure.querySelector('img');
        if(image){image.style.width=node.attrs.width?`${Number(node.attrs.width)}px`:'';image.style.height='auto';}
      };
      sync(props.node);
      // Keep the library's resize handles and lifecycle while adding a visible caption.
      return {
        dom:figure,
        update:(node,...args)=>{const updated=view.update?.(node,...args);if(updated)sync(node);return updated;},
        selectNode:()=>{figure.classList.add('ProseMirror-selectednode');view.selectNode?.();},
        deselectNode:()=>{figure.classList.remove('ProseMirror-selectednode');view.deselectNode?.();},
        stopEvent:event=>caption.contains(event.target as Node)||controls.contains(event.target as Node)||view.stopEvent?.(event)===true,
        ignoreMutation:mutation=>controls.contains(mutation.target)||caption.contains(mutation.target)||view.ignoreMutation?.(mutation)===true,
        destroy:()=>view.destroy?.(),
      };
    };
  },
});
