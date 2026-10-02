import React, {useEffect, useRef, useState} from 'react';
import {NodeViewWrapper, ReactNodeViewRenderer, mergeAttributes, type NodeViewProps} from '@tiptap/react';
import {CaptionInput, ImageResizer, ResizableImage, type ResizableImageNodeViewRendererProps} from 'tiptap-extension-resizable-image';
import {MaterialImageControls} from './material-image-controls';

const captionText = (html: string) => {
  const element = document.createElement('div');
  element.innerHTML = html;
  return (element.textContent || '').slice(0,300);
};

export function setMaterialImageDragPreview(event: DragEvent, image: HTMLImageElement) {
  if(!event.dataTransfer || !image.naturalWidth)return;
  const preview=document.createElement('canvas');
  preview.width=Math.min(256,image.naturalWidth);
  preview.height=Math.round(preview.width*image.naturalHeight/image.naturalWidth);
  preview.getContext('2d')?.drawImage(image,0,0,preview.width,preview.height);
  preview.style.cssText='position:fixed;left:-10000px;top:0;pointer-events:none';
  document.body.appendChild(preview);
  event.dataTransfer.setDragImage(preview,preview.width/2,preview.height/2);
  setTimeout(()=>preview.remove(),0);
}

function MaterialImageView(props: NodeViewProps) {
  const {editor, node, getPos, updateAttributes, selected} = props;
  const image = useRef<HTMLImageElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const editable = editor.isEditable;
  const attrs = node.attrs;
  useEffect(() => {
    if(!open) return;
    const outside = (event: PointerEvent) => {if(!root.current?.contains(event.target as Node)) setOpen(false);};
    const escape = (event: KeyboardEvent) => {if(event.key === 'Escape') setOpen(false);};
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {document.removeEventListener('pointerdown', outside);document.removeEventListener('keydown', escape);};
  }, [open]);
  // The package caption editor uses HTML internally; materials store plain text.
  const encodedCaption = document.createElement('div');
  encodedCaption.textContent = attrs.caption || '';
  const captionNode=node.type.create({...attrs, caption: encodedCaption.innerHTML},node.content,node.marks) as ResizableImageNodeViewRendererProps['node'];
  const captionProps = {...props, node: captionNode, updateAttributes: (values) => updateAttributes({...values, caption: captionText(values.caption || '')})} as ResizableImageNodeViewRendererProps;
  const select = () => {
    const pos = getPos();
    if(pos !== undefined) editor.chain().focus().setNodeSelection(pos).run();
  };
  return <NodeViewWrapper as="figure" className="material-image-node" data-image-open={open && editable ? 'true' : undefined}>
    <div ref={root} className="material-image-frame" contentEditable={false}>
      <div className="image-component material-image-visual" style={{width: attrs.width ? `${attrs.width}px` : '100%'}}>
        <img ref={image} src={attrs.src} alt={attrs.alt || ''} title={attrs.title || undefined} width={attrs.width || undefined} height={attrs.height || undefined} draggable={false} style={{width: attrs.width ? `${attrs.width}px` : '100%', height: 'auto', maxWidth: '100%'}} onClick={event => {if(!editable)return;event.preventDefault();event.stopPropagation();select();setOpen(value => !value);}}/>
        {editable && (open || selected) && <ImageResizer editor={editor} imageRef={image} minWidth={80} maxWidth={Math.min(4096, editor.view.dom.clientWidth - 48)} minHeight={40} maxHeight={4096} keepRatio onResizeStart={select} onResizeEnd={(width,height) => {if(image.current){image.current.style.height='auto';image.current.style.maxWidth='100%';}updateAttributes({width: Math.round(width),height: Math.round(height)});}}/>}
      </div>
      {editable && open && <MaterialImageControls editor={editor} width={attrs.width || image.current?.clientWidth || 0} onUpdate={width => updateAttributes({width, height: null})} onRemove={() => {const pos=getPos();if(pos!==undefined)editor.commands.deleteRange({from:pos,to:pos+node.nodeSize});}} onClose={() => setOpen(false)}/>}
      {(attrs.caption || (editable && open)) && <figcaption className="material-image-caption"><CaptionInput {...captionProps}/></figcaption>}
    </div>
  </NodeViewWrapper>;
}

export const MaterialImage = ResizableImage.extend({
  group: 'block',
  inline: false,
  addAttributes() {
    return {...this.parent?.(),width:{default:null},height:{default:null},caption:{default:'',rendered:false}};
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
    const {style,...attributes}=HTMLAttributes;
    const image=['img',mergeAttributes(this.options.HTMLAttributes,attributes)] as const;
    return node.attrs.caption?['figure',{},image,['figcaption',{},node.attrs.caption]]:image;
  },
  addNodeView() {
    return ReactNodeViewRenderer(MaterialImageView, {stopEvent:({event}) => !!(event.target as HTMLElement)?.closest('.material-image-controls, .material-image-caption')});
  },
});
