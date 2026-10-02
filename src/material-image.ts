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
      const view=parent(props),figure=document.createElement('figure'),caption=document.createElement('figcaption');
      figure.append(view.dom,caption);
      const sync=node=>{
        caption.textContent=node.attrs.caption||'';caption.hidden=!node.attrs.caption;
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
        stopEvent:event=>view.stopEvent?.(event)??false,
        ignoreMutation:mutation=>mutation.target===caption||view.ignoreMutation?.(mutation)===true,
        destroy:()=>view.destroy?.(),
      };
    };
  },
});
