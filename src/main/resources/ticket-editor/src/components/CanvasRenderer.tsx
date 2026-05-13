import React from 'react';
import { Group, Rect, Text as KonvaText } from 'react-konva';
import { Document } from '../model/document.class';
import { TextBox } from '../model/text-box.class';
import { Image } from '../model/image.class';
import { QrCode } from '../model/qr-code.class';
import { TextDecoration } from '../model/text-decoration.enum';
import AttachmentImage from './AttachmentImage';
import { TextAlign } from '../model/text-align.enum';
import { __ } from '../utils';

export interface CanvasRendererProps {
  templateDocument: Document | null | undefined;
  onElementPositionChange?: (id: string, x: number, y: number) => void;
}

function getKonvaTextDecoration(textDecoration: TextDecoration) {
  switch (textDecoration) {
    default:
    case TextDecoration.DECORATION_NONE:
      return '';
    case TextDecoration.DECORATION_UNDERLINE:
      return 'underline';
  }
}

const MM_TO_PX = 96 / 25.4;
const PT_TO_PX = 96 / 72;

const convertTextAlignToKonva = (textAlign: TextAlign) => {
  switch (textAlign) {
    case TextAlign.ALIGN_LEFT:
    default:
      return 'left';
    case TextAlign.ALIGN_CENTER:
      return 'center';
    case TextAlign.ALIGN_RIGHT:
      return 'right';
    case TextAlign.ALIGN_JUSTIFIED:
      return 'justified';
  }
};

const CanvasRenderer: React.FC<CanvasRendererProps> = ({
  templateDocument: doc,
  onElementPositionChange,
}) => {
  const elements = doc?.elements.map((el, key) => {
    if (el instanceof TextBox) {
      const draggable = Boolean(el.id && onElementPositionChange);
      return (
        <Group
          key={'eltb' + key}
          draggable={draggable}
          x={el.x * MM_TO_PX}
          y={el.y * MM_TO_PX}
          onDragEnd={(event) => {
            if (el.id && onElementPositionChange) {
              const position = event.target.position();
              onElementPositionChange(
                el.id,
                position.x / MM_TO_PX,
                position.y / MM_TO_PX
              );
            }
          }}
        >
          {el.backgroundColor ? (
            <Rect
              key={'elr' + key}
              x={0}
              y={0}
              width={el.width * MM_TO_PX}
              height={el.height * MM_TO_PX}
              fill={el.backgroundColor || undefined}
            />
          ) : null}
          <KonvaText
            key={'elt' + key}
            x={0}
            y={0}
            width={el.width * MM_TO_PX}
            height={el.height * MM_TO_PX}
            text={el.text}
            fontSize={el.fontSize * PT_TO_PX}
            fontFamily={el.fontFamily}
            fill={el.color}
            padding={3 * MM_TO_PX}
            align={convertTextAlignToKonva(el.textAlign)}
            textDecoration={getKonvaTextDecoration(el.textDecoration)}
          />
        </Group>
      );
    } else if (el instanceof Image) {
      return (
        <AttachmentImage
          key={'elimage' + key}
          x={el.x * MM_TO_PX}
          y={el.y * MM_TO_PX}
          width={el.width * MM_TO_PX}
          height={el.height * MM_TO_PX}
          imageData={el.imageData}
          scaleToFit={el.scaleToFit}
        />
      );
    } else if (el instanceof QrCode) {
      return (
        <Rect
          key={'elqrcode' + key}
          x={el.x * MM_TO_PX}
          y={el.y * MM_TO_PX}
          width={el.width * MM_TO_PX}
          height={el.height * MM_TO_PX}
          fill="#000000"
          draggable={Boolean(el.id && onElementPositionChange)}
          onDragEnd={(event) => {
            if (el.id && onElementPositionChange) {
              const position = event.target.position();
              onElementPositionChange(
                el.id,
                position.x / MM_TO_PX,
                position.y / MM_TO_PX
              );
            }
          }}
        />
      );
    } else {
      throw new Error(__('Unknown element type.', 'eccospro-easyticket'));
    }
  });
  return <>{elements}</>;
};

export default CanvasRenderer;
