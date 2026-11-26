import React, { useEffect, useRef, useState } from 'react';
import {
  BirthdayBackground,
  BirthdayElementSet,
  BirthdayElementTransform,
  BirthdayPerson,
} from '../types';
import {
  formatBirthdayDay,
  formatBirthdayDisplayName,
  formatBirthdayMonthShort,
} from '../utils/birthdayCanvas';
import { RotateCw } from 'lucide-react';

export type EditableBirthdayElementKey = 'date' | 'name' | 'message';

interface BirthdayInteractiveCanvasProps {
  background: BirthdayBackground;
  person: BirthdayPerson;
  messageText: string;
  elements: BirthdayElementSet;
  selectedElement: EditableBirthdayElementKey | null;
  onSelectElement: (key: EditableBirthdayElementKey | null) => void;
  onChangeElements: (updated: BirthdayElementSet) => void;
  readOnly?: boolean;
}

type DragMode =
  | {
      type: 'move';
      key: EditableBirthdayElementKey;
      startClientX: number;
      startClientY: number;
      origX: number;
      origY: number;
    }
  | {
      type: 'scale';
      key: EditableBirthdayElementKey;
      centerX: number;
      centerY: number;
      startDist: number;
      origScale: number;
    }
  | {
      type: 'rotate';
      key: EditableBirthdayElementKey;
      centerX: number;
      centerY: number;
      startAngle: number;
      origRotation: number;
    };

export const BirthdayInteractiveCanvas: React.FC<BirthdayInteractiveCanvasProps> = ({
  background,
  person,
  messageText,
  elements,
  selectedElement,
  onSelectElement,
  onChangeElements,
  readOnly = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState<{ width: number; height: number }>({
    width: 440,
    height: 440,
  });
  const [dragMode, setDragMode] = useState<DragMode | null>(null);

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setStageSize({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    const obs = new ResizeObserver(updateSize);
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [background.width, background.height]);

  useEffect(() => {
    if (!dragMode) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const currentEl = elements[dragMode.key];
      let nextTransform: BirthdayElementTransform = currentEl;

      if (dragMode.type === 'move') {
        const dxPct = ((e.clientX - dragMode.startClientX) / rect.width) * 100;
        const dyPct = ((e.clientY - dragMode.startClientY) / rect.height) * 100;
        nextTransform = {
          ...currentEl,
          xPct: Math.max(5, Math.min(95, Number((dragMode.origX + dxPct).toFixed(2)))),
          yPct: Math.max(4, Math.min(96, Number((dragMode.origY + dyPct).toFixed(2)))),
        };
      } else if (dragMode.type === 'scale') {
        const dist = Math.hypot(e.clientX - dragMode.centerX, e.clientY - dragMode.centerY);
        const ratio = dist / Math.max(12, dragMode.startDist);
        nextTransform = {
          ...currentEl,
          scale: Math.max(0.45, Math.min(2.4, Number((dragMode.origScale * ratio).toFixed(2)))),
        };
      } else if (dragMode.type === 'rotate') {
        const angleRad = Math.atan2(e.clientY - dragMode.centerY, e.clientX - dragMode.centerX);
        const angleDeg = (angleRad * 180) / Math.PI;
        let nextRot = dragMode.origRotation + (angleDeg - dragMode.startAngle);
        while (nextRot > 180) nextRot -= 360;
        while (nextRot < -180) nextRot += 360;
        // Snap suave perto de 0°
        if (Math.abs(nextRot) < 2.5) nextRot = 0;
        nextTransform = {
          ...currentEl,
          rotation: Number(nextRot.toFixed(1)),
        };
      }

      onChangeElements({
        ...elements,
        [dragMode.key]: nextTransform,
      });
    };

    const handlePointerUp = () => {
      setDragMode(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragMode, elements, onChangeElements]);

  const startMove = (e: React.PointerEvent, key: EditableBirthdayElementKey) => {
    if (readOnly) return;
    e.stopPropagation();
    onSelectElement(key);
    setDragMode({
      type: 'move',
      key,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origX: elements[key].xPct,
      origY: elements[key].yPct,
    });
  };

  const getObjectScreenCenter = (key: EditableBirthdayElementKey) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { cx: 0, cy: 0 };
    const el = elements[key];
    return {
      cx: rect.left + (el.xPct / 100) * rect.width,
      cy: rect.top + (el.yPct / 100) * rect.height,
    };
  };

  const startScale = (e: React.PointerEvent, key: EditableBirthdayElementKey) => {
    if (readOnly) return;
    e.stopPropagation();
    const { cx, cy } = getObjectScreenCenter(key);
    const startDist = Math.max(16, Math.hypot(e.clientX - cx, e.clientY - cy));
    setDragMode({
      type: 'scale',
      key,
      centerX: cx,
      centerY: cy,
      startDist,
      origScale: elements[key].scale,
    });
  };

  const startRotate = (e: React.PointerEvent, key: EditableBirthdayElementKey) => {
    if (readOnly) return;
    e.stopPropagation();
    const { cx, cy } = getObjectScreenCenter(key);
    const startAngle = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
    setDragMode({
      type: 'rotate',
      key,
      centerX: cx,
      centerY: cy,
      startAngle,
      origRotation: elements[key].rotation,
    });
  };

  const aspectW = background.width || 1080;
  const aspectH = background.height || 1080;
  const baseUnit = Math.min(stageSize.width, stageSize.height);
  const cutout = background.cutoutRect;

  // Coordenadas do recorte transparente com leve margem atrás do PNG
  const padX = cutout.width * 0.14;
  const padY = cutout.height * 0.14;
  const photoBoxLeft = Math.max(0, cutout.x - padX);
  const photoBoxTop = Math.max(0, cutout.y - padY);
  const photoBoxWidth = Math.min(100 - photoBoxLeft, cutout.width + padX * 2);
  const photoBoxHeight = Math.min(100 - photoBoxTop, cutout.height + padY * 2);

  const dayStr = formatBirthdayDay(person.birthDay);
  const monthStr = formatBirthdayMonthShort(person.birthMonth);
  const displayName = formatBirthdayDisplayName(person.name);

  const renderHandles = (key: EditableBirthdayElementKey) => {
    if (selectedElement !== key || readOnly) return null;
    const cornerClass =
      'absolute w-3.5 h-3.5 rounded-full bg-white border-2 border-indigo-600 shadow-md z-30 hover:scale-125 transition-transform';

    return (
      <>
        {/* Borda de seleção */}
        <div className="absolute -inset-1.5 border-2 border-dashed border-indigo-500 rounded-lg pointer-events-none" />

        {/* Pontinhos nos 4 cantos para dimensionar (aumentar / diminuir) */}
        <button
          type="button"
          onPointerDown={(e) => startScale(e, key)}
          title="Arraste para aumentar ou diminuir"
          className={`${cornerClass} -top-2.5 -left-2.5 cursor-nwse-resize`}
        />
        <button
          type="button"
          onPointerDown={(e) => startScale(e, key)}
          title="Arraste para aumentar ou diminuir"
          className={`${cornerClass} -top-2.5 -right-2.5 cursor-nesw-resize`}
        />
        <button
          type="button"
          onPointerDown={(e) => startScale(e, key)}
          title="Arraste para aumentar ou diminuir"
          className={`${cornerClass} -bottom-2.5 -left-2.5 cursor-nesw-resize`}
        />
        <button
          type="button"
          onPointerDown={(e) => startScale(e, key)}
          title="Arraste para aumentar ou diminuir"
          className={`${cornerClass} -bottom-2.5 -right-2.5 cursor-nwse-resize`}
        />

        {/* Pontinho superior de rotação */}
        <div className="absolute left-1/2 -top-8 -translate-x-1/2 flex flex-col items-center pointer-events-none">
          <button
            type="button"
            onPointerDown={(e) => startRotate(e, key)}
            title="Arraste para girar este objeto"
            className="pointer-events-auto w-5 h-5 rounded-full bg-indigo-600 text-white border-2 border-white shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
          >
            <RotateCw className="w-2.5 h-2.5" />
          </button>
          <div className="w-0.5 h-2.5 bg-indigo-500" />
        </div>
      </>
    );
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div
        ref={containerRef}
        onClick={() => !readOnly && onSelectElement(null)}
        className="relative w-full max-w-[480px] rounded-2xl overflow-hidden bg-white shadow-2xl border border-slate-700 select-none touch-none"
        style={{ aspectRatio: `${aspectW} / ${aspectH}` }}
      >
        {/* CAMADA 1: Foto do aniversariante posicionada atrás do recorte transparente */}
        {person.photoUrl && (
          <div
            className="absolute overflow-hidden pointer-events-none"
            style={{
              left: `${photoBoxLeft}%`,
              top: `${photoBoxTop}%`,
              width: `${photoBoxWidth}%`,
              height: `${photoBoxHeight}%`,
            }}
          >
            <img
              src={person.photoUrl}
              alt={person.name}
              draggable={false}
              className="w-full h-full object-cover"
              style={{
                transform: `translate(${person.photoTransform?.offsetX || 0}%, ${person.photoTransform?.offsetY || 0}%) scale(${person.photoTransform?.scale || 1})`,
                transformOrigin: 'center center',
              }}
            />
          </div>
        )}

        {/* CAMADA 2: Plano de fundo PNG com janela transparente por cima da foto */}
        <img
          src={background.imageUrl}
          alt={background.name}
          draggable={false}
          className="absolute inset-0 w-full h-full object-fill pointer-events-none"
        />

        {/* CAMADA 3A: OBJETO DATA (Número em cima + 3 letras MAIÚSCULAS do mês embaixo, SEMPRE PRETO) */}
        <div
          onPointerDown={(e) => startMove(e, 'date')}
          onClick={(e) => e.stopPropagation()}
          className={`absolute flex flex-col items-center justify-center text-center leading-none ${
            readOnly ? '' : 'cursor-move'
          }`}
          style={{
            left: `${elements.date.xPct}%`,
            top: `${elements.date.yPct}%`,
            transform: `translate(-50%, -50%) rotate(${elements.date.rotation}deg)`,
            color: '#000000',
            padding: '4px 8px',
            zIndex: selectedElement === 'date' ? 30 : 20,
          }}
        >
          {renderHandles('date')}
          <span
            style={{
              fontSize: `${Math.max(12, baseUnit * 0.068 * elements.date.scale)}px`,
              fontWeight: 800,
              color: '#000000',
              lineHeight: 0.95,
            }}
          >
            {dayStr}
          </span>
          <span
            style={{
              fontSize: `${Math.max(9, baseUnit * 0.03 * elements.date.scale)}px`,
              fontWeight: 800,
              color: '#000000',
              letterSpacing: '0.06em',
              marginTop: '2px',
            }}
          >
            {monthStr}
          </span>
        </div>

        {/* CAMADA 3B: OBJETO NOME ("{nome}!" em fonte manuscrita, SEMPRE PRETO) */}
        <div
          onPointerDown={(e) => startMove(e, 'name')}
          onClick={(e) => e.stopPropagation()}
          className={`absolute flex flex-col items-center justify-center text-center ${
            readOnly ? '' : 'cursor-move'
          }`}
          style={{
            left: `${elements.name.xPct}%`,
            top: `${elements.name.yPct}%`,
            width: `${elements.name.widthPct}%`,
            transform: `translate(-50%, -50%) rotate(${elements.name.rotation}deg)`,
            color: '#000000',
            padding: '4px 8px',
            zIndex: selectedElement === 'name' ? 30 : 20,
          }}
        >
          {renderHandles('name')}
          <div
            style={{
              fontFamily: '"Dancing Script", cursive',
              fontWeight: 700,
              fontSize: `${Math.max(14, baseUnit * 0.056 * elements.name.scale)}px`,
              lineHeight: 1.08,
              color: '#000000',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            <div>{displayName}</div>
          </div>
        </div>

        {/* CAMADA 3C: OBJETO MENSAGEM DE PARABÉNS (SEMPRE PRETO) */}
        {messageText.trim() && (
          <div
            onPointerDown={(e) => startMove(e, 'message')}
            onClick={(e) => e.stopPropagation()}
            className={`absolute flex items-center justify-center text-center ${
              readOnly ? '' : 'cursor-move'
            }`}
            style={{
              left: `${elements.message.xPct}%`,
              top: `${elements.message.yPct}%`,
              width: `${elements.message.widthPct}%`,
              transform: `translate(-50%, -50%) rotate(${elements.message.rotation}deg)`,
              color: '#000000',
              padding: '4px 8px',
              zIndex: selectedElement === 'message' ? 30 : 20,
            }}
          >
            {renderHandles('message')}
            <p
              style={{
                fontWeight: 600,
                fontSize: `${Math.max(9, baseUnit * 0.026 * elements.message.scale)}px`,
                lineHeight: 1.32,
                color: '#000000',
                margin: 0,
                wordBreak: 'break-word',
              }}
            >
              {messageText}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
