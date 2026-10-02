import React from 'react';
import type {Editor} from '@tiptap/react';
import {MoveHorizontal, Trash2, X} from 'lucide-react';

export function MaterialImageControls({editor, width, onUpdate, onRemove, onClose}: {editor: Editor; width: number; onUpdate: (width:number)=>void; onRemove: ()=>void; onClose: ()=>void}) {
  const available = editor.view.dom.clientWidth - 48;
  const iconClass = 'material-image-action';
  return <div role="region" aria-label="Настройки изображения" className="material-image-controls">
    <div className="material-image-sizing">
      <span className="material-image-width-label"><MoveHorizontal className="h-4 w-4"/><span>Ширина</span></span>
      <div className="material-image-presets" role="group" aria-label="Ширина изображения">
        {[25,50,75,100].map(percent => {
          const target = Math.max(80,Math.round(available * percent / 100));
          return <button key={percent} type="button" aria-pressed={Math.abs(width-target)<2} onClick={()=>onUpdate(target)}>{percent}%</button>;
        })}
      </div>
      <label className="material-image-size-input"><input aria-label="Ширина изображения в пикселях" type="number" min={80} max={4096} value={Math.round(width) || ''} onChange={event=>{const value=Number(event.target.value);if(value>=80&&value<=4096)onUpdate(value);}}/><span>px</span></label>
    </div>
    <div className="material-image-actions">
      <button type="button" className={`${iconClass} material-image-delete`} title="Удалить изображение" aria-label="Удалить изображение" onClick={onRemove}><Trash2 className="h-4 w-4"/></button>
      <button type="button" className={iconClass} title="Закрыть настройки изображения" aria-label="Закрыть настройки изображения" onClick={onClose}><X className="h-4 w-4"/></button>
    </div>
  </div>;
}
