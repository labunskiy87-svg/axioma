import React, {useEffect, useRef} from 'react';
import {createPortal} from 'react-dom';
import type {Editor} from '@tiptap/react';
import {Trash2, X} from 'lucide-react';

export function MaterialImageControls({editor, image, onClose}: {editor: Editor; image: HTMLImageElement; onClose: () => void}) {
  const panel = useRef<HTMLDivElement>(null);
  const host = image.closest('figure')?.querySelector('[data-image-controls]');
  useEffect(() => {
    const outside = (event: PointerEvent) => {if(!image.closest('figure')?.contains(event.target as Node)) onClose();};
    const escape = (event: KeyboardEvent) => {if(event.key === 'Escape') onClose();};
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [editor, image, onClose]);
  let imagePosition: number | undefined;
  editor.state.doc.descendants((node,pos)=>{if(node.type.name==='image'&&(editor.view.nodeDOM(pos) as HTMLElement)?.contains(image)){imagePosition=pos;return false;}});
  const node = imagePosition === undefined ? null : editor.state.doc.nodeAt(imagePosition);
  const attrs = node?.attrs || {};
  const update = (attributes: Record<string, unknown>) => {if(imagePosition!==undefined&&node)editor.view.dispatch(editor.state.tr.setNodeMarkup(imagePosition,undefined,{...attrs,...attributes}));};
  const remove = () => {if(imagePosition!==undefined&&node)editor.commands.deleteRange({from:imagePosition,to:imagePosition+node.nodeSize});onClose();};
  if(!host) return null;
  const iconClass = 'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#476788] hover:bg-[#e7f1ff] hover:text-[#006bff]';
  return createPortal(<div ref={panel} role="region" aria-label="Настройки изображения" className="flex w-full flex-wrap items-end gap-3 rounded-b-lg border border-[#d4e0ed] bg-[#edf3fa] p-3">
    <div className="space-y-1"><span className="text-xs font-medium text-[#476788]">Ширина</span><div className="flex flex-wrap items-center gap-2">
      {[25,50,75,100].map(percent => <button key={percent} type="button" className="rounded-lg border border-[#d4e0ed] px-2 py-1.5 text-xs font-semibold text-[#0b3558] hover:border-[#006bff]" onClick={() => update({width: Math.max(80, Math.round((editor.view.dom.clientWidth - 48) * percent / 100)), height: null})}>{percent}%</button>)}
      <label className="flex items-center gap-1 text-xs text-[#476788]"><input aria-label="Ширина изображения в пикселях" type="number" min={80} max={4096} className="w-20 rounded-lg border border-[#476788] bg-white px-2 py-1.5 text-sm text-[#0b3558]" value={attrs.width || ''} onChange={event => {const width = Number(event.target.value); if(width >= 80 && width <= 4096) update({width, height: null});}}/>px</label>
    </div></div>
    <div className="ml-auto flex items-center gap-1"><button type="button" className={iconClass} title="Удалить изображение" aria-label="Удалить изображение" onClick={remove}><Trash2 className="h-4 w-4"/></button><button type="button" className={iconClass} title="Закрыть настройки изображения" aria-label="Закрыть настройки изображения" onClick={onClose}><X className="h-4 w-4"/></button></div>
  </div>, host);
}
