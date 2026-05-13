import React, { useMemo, useState } from 'react';
import { Group, Line, Rect, Text as KonvaText } from 'react-konva';
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
const SNAP_TOLERANCE_PX = 6;

type GuideLine = {
  points: number[];
};

type Bounds = {
  id?: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

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
  const [guideLines, setGuideLines] = useState<GuideLine[]>([]);

  const bounds = useMemo<Bounds[]>(
    () =>
      (doc?.elements ?? []).map((el) => ({
        id: el.id,
        x: el.x * MM_TO_PX,
        y: el.y * MM_TO_PX,
        width: el.width * MM_TO_PX,
        height: el.height * MM_TO_PX,
      })),
    [doc]
  );

  const setCursor = (
    event: { target: { getStage: () => any } },
    cursor: string
  ) => {
    const stage = event.target.getStage();
    if (stage?.container()) {
      stage.container().style.cursor = cursor;
    }
  };

  const getSnappedPosition = (
    id: string | undefined,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    const verticalStops: number[] = [0, (doc?.width || 0) * MM_TO_PX / 2, (doc?.width || 0) * MM_TO_PX];
    const horizontalStops: number[] = [0, (doc?.height || 0) * MM_TO_PX / 2, (doc?.height || 0) * MM_TO_PX];
    bounds
      .filter((item) => item.id !== id)
      .forEach((item) => {
        verticalStops.push(item.x, item.x + item.width / 2, item.x + item.width);
        horizontalStops.push(item.y, item.y + item.height / 2, item.y + item.height);
      });

    const itemVerticals = [x, x + width / 2, x + width];
    const itemHorizontals = [y, y + height / 2, y + height];

    let snappedX = x;
    let snappedY = y;
    let bestVerticalDiff = Number.POSITIVE_INFINITY;
    let bestHorizontalDiff = Number.POSITIVE_INFINITY;
    let verticalGuide: number | null = null;
    let horizontalGuide: number | null = null;

    verticalStops.forEach((stop) => {
      itemVerticals.forEach((line, index) => {
        const diff = Math.abs(stop - line);
        if (diff < bestVerticalDiff && diff <= SNAP_TOLERANCE_PX) {
          bestVerticalDiff = diff;
          verticalGuide = stop;
          snappedX = stop - (index === 0 ? 0 : index === 1 ? width / 2 : width);
        }
      });
    });

    horizontalStops.forEach((stop) => {
      itemHorizontals.forEach((line, index) => {
        const diff = Math.abs(stop - line);
        if (diff < bestHorizontalDiff && diff <= SNAP_TOLERANCE_PX) {
          bestHorizontalDiff = diff;
          horizontalGuide = stop;
          snappedY = stop - (index === 0 ? 0 : index === 1 ? height / 2 : height);
        }
      });
    });

    const lines: GuideLine[] = [];
    if (verticalGuide !== null) {
      lines.push({
        points: [verticalGuide, 0, verticalGuide, (doc?.height || 0) * MM_TO_PX],
      });
    }
    if (horizontalGuide !== null) {
      lines.push({
        points: [0, horizontalGuide, (doc?.width || 0) * MM_TO_PX, horizontalGuide],
      });
    }

    setGuideLines(lines);

    return { x: snappedX, y: snappedY };
  };

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
            setGuideLines([]);
            setCursor(event, 'grab');
          }}
          onDragStart={(event) => {
            setCursor(event, 'grabbing');
          }}
          onDragMove={(event) => {
            if (!draggable) {
              return;
            }
            const snappedPosition = getSnappedPosition(
              el.id,
              event.target.x(),
              event.target.y(),
              el.width * MM_TO_PX,
              el.height * MM_TO_PX
            );
            event.target.position(snappedPosition);
          }}
          onMouseEnter={(event) => {
            if (draggable) {
              setCursor(event, 'grab');
            }
          }}
          onMouseLeave={(event) => {
            if (draggable) {
              setCursor(event, 'default');
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
      const draggable = Boolean(el.id && onElementPositionChange);
      return (
        <Group
          key={'elimagegroup' + key}
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
            setGuideLines([]);
            setCursor(event, 'grab');
          }}
          onDragStart={(event) => {
            if (draggable) {
              setCursor(event, 'grabbing');
            }
          }}
          onDragMove={(event) => {
            if (!draggable) {
              return;
            }
            const snappedPosition = getSnappedPosition(
              el.id,
              event.target.x(),
              event.target.y(),
              el.width * MM_TO_PX,
              el.height * MM_TO_PX
            );
            event.target.position(snappedPosition);
          }}
          onMouseEnter={(event) => {
            if (draggable) {
              setCursor(event, 'grab');
            }
          }}
          onMouseLeave={(event) => {
            if (draggable) {
              setCursor(event, 'default');
            }
          }}
        >
          <AttachmentImage
            key={'elimage' + key}
            x={0}
            y={0}
            width={el.width * MM_TO_PX}
            height={el.height * MM_TO_PX}
            imageData={el.imageData}
            scaleToFit={el.scaleToFit}
          />
        </Group>
      );
    } else if (el instanceof QrCode) {
      const draggable = Boolean(el.id && onElementPositionChange);
      return (
        <Rect
          key={'elqrcode' + key}
          x={el.x * MM_TO_PX}
          y={el.y * MM_TO_PX}
          width={el.width * MM_TO_PX}
          height={el.height * MM_TO_PX}
          fill="#000000"
          draggable={draggable}
          onDragEnd={(event) => {
            if (el.id && onElementPositionChange) {
              const position = event.target.position();
              onElementPositionChange(
                el.id,
                position.x / MM_TO_PX,
                position.y / MM_TO_PX
              );
            }
            setGuideLines([]);
            setCursor(event, 'grab');
          }}
          onDragStart={(event) => {
            if (draggable) {
              setCursor(event, 'grabbing');
            }
          }}
          onDragMove={(event) => {
            if (!draggable) {
              return;
            }
            const snappedPosition = getSnappedPosition(
              el.id,
              event.target.x(),
              event.target.y(),
              el.width * MM_TO_PX,
              el.height * MM_TO_PX
            );
            event.target.position(snappedPosition);
          }}
          onMouseEnter={(event) => {
            if (draggable) {
              setCursor(event, 'grab');
            }
          }}
          onMouseLeave={(event) => {
            if (draggable) {
              setCursor(event, 'default');
            }
          }}
        />
      );
    } else {
      throw new Error(__('Unknown element type.', 'eccospro-easyticket'));
    }
  });
  return (
    <>
      {elements}
      {guideLines.map((line, index) => (
        <Line
          key={`guide-${index}`}
          points={line.points}
          stroke="#137cbd"
          strokeWidth={1}
          dash={[6, 6]}
          listening={false}
        />
      ))}
    </>
  );
};

export default CanvasRenderer;
