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
const GUIDE_COLOR = '#137cbd';
const HOVER_BORDER_COLOR = '#137cbd';

type GuideLine = {
  points: number[];
  dashed?: boolean;
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
  // hoveredId: id of element under pointer (while not dragging)
  const [hoveredId, setHoveredId] = useState<string | undefined>(undefined);
  // isDragging: true while any element is being dragged
  const [isDragging, setIsDragging] = useState(false);

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

  /**
   * Compute snap position and helper guides:
   * - dashed guides for element-to-element alignment
   * - solid guides for page-center alignment
   */
  const getSnappedPosition = (
    id: string | undefined,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    const verticalStops: number[] = [
      0,
      ((doc?.width || 0) * MM_TO_PX) / 2,
      (doc?.width || 0) * MM_TO_PX,
    ];
    const horizontalStops: number[] = [
      0,
      ((doc?.height || 0) * MM_TO_PX) / 2,
      (doc?.height || 0) * MM_TO_PX,
    ];
    const otherBounds = bounds.filter((item) => item.id !== id);

    otherBounds.forEach((item) => {
      verticalStops.push(item.x, item.x + item.width / 2, item.x + item.width);
      horizontalStops.push(item.y, item.y + item.height / 2, item.y + item.height);
    });

    const itemVerticals = [x, x + width / 2, x + width];
    const itemHorizontals = [y, y + height / 2, y + height];

    let snappedX = x;
    let snappedY = y;
    let bestVerticalDiff = Number.POSITIVE_INFINITY;
    let bestHorizontalDiff = Number.POSITIVE_INFINITY;

    verticalStops.forEach((stop) => {
      itemVerticals.forEach((line, index) => {
        const diff = Math.abs(stop - line);
        if (diff < bestVerticalDiff && diff <= SNAP_TOLERANCE_PX) {
          bestVerticalDiff = diff;
          snappedX = stop - (index === 0 ? 0 : index === 1 ? width / 2 : width);
        }
      });
    });

    horizontalStops.forEach((stop) => {
      itemHorizontals.forEach((line, index) => {
        const diff = Math.abs(stop - line);
        if (diff < bestHorizontalDiff && diff <= SNAP_TOLERANCE_PX) {
          bestHorizontalDiff = diff;
          snappedY = stop - (index === 0 ? 0 : index === 1 ? height / 2 : height);
        }
      });
    });

    const lines: GuideLine[] = [];
    const docWidthPx = (doc?.width || 0) * MM_TO_PX;
    const docHeightPx = (doc?.height || 0) * MM_TO_PX;
    const snappedTop = snappedY;
    const snappedCenter = snappedY + height / 2;
    const snappedBottom = snappedY + height;
    const snappedLeft = snappedX;
    const snappedMiddle = snappedX + width / 2;
    const snappedRight = snappedX + width;
    let bestHorizontalGuide: GuideLine | null = null;
    let bestHorizontalGuideDiff = Number.POSITIVE_INFINITY;
    let bestHorizontalGuideNearness = Number.POSITIVE_INFINITY;
    let bestVerticalGuide: GuideLine | null = null;
    let bestVerticalGuideDiff = Number.POSITIVE_INFINITY;
    let bestVerticalGuideNearness = Number.POSITIVE_INFINITY;

    otherBounds.forEach((other) => {
      const otherTop = other.y;
      const otherCenter = other.y + other.height / 2;
      const otherBottom = other.y + other.height;
      const otherLines = [otherTop, otherCenter, otherBottom];
      const draggedLines = [snappedTop, snappedCenter, snappedBottom];

      draggedLines.forEach((draggedLine) => {
        otherLines.forEach((otherLine) => {
          const diff = Math.abs(draggedLine - otherLine);
          if (diff > SNAP_TOLERANCE_PX * 2) {
            return;
          }
          const nearness = Math.abs(
            snappedX + width / 2 - (other.x + other.width / 2)
          );
          if (
            diff < bestHorizontalGuideDiff ||
            (diff === bestHorizontalGuideDiff &&
              nearness < bestHorizontalGuideNearness)
          ) {
            bestHorizontalGuideDiff = diff;
            bestHorizontalGuideNearness = nearness;
            bestHorizontalGuide = {
              points: [
                Math.min(snappedX, other.x),
                otherLine,
                Math.max(snappedX + width, other.x + other.width),
                otherLine,
              ],
              dashed: true,
            };
          }
        });
      });

      const otherLeft = other.x;
      const otherMiddle = other.x + other.width / 2;
      const otherRight = other.x + other.width;
      const otherVerticals = [otherLeft, otherMiddle, otherRight];
      const draggedVerticals = [snappedLeft, snappedMiddle, snappedRight];

      draggedVerticals.forEach((draggedLine) => {
        otherVerticals.forEach((otherLine) => {
          const diff = Math.abs(draggedLine - otherLine);
          if (diff > SNAP_TOLERANCE_PX * 2) {
            return;
          }
          const nearness = Math.abs(
            snappedY + height / 2 - (other.y + other.height / 2)
          );
          if (
            diff < bestVerticalGuideDiff ||
            (diff === bestVerticalGuideDiff &&
              nearness < bestVerticalGuideNearness)
          ) {
            bestVerticalGuideDiff = diff;
            bestVerticalGuideNearness = nearness;
            bestVerticalGuide = {
              points: [
                otherLine,
                Math.min(snappedY, other.y),
                otherLine,
                Math.max(snappedY + height, other.y + other.height),
              ],
              dashed: true,
            };
          }
        });
      });
    });

    if (bestHorizontalGuide) {
      lines.push(bestHorizontalGuide);
    }
    if (bestVerticalGuide) {
      lines.push(bestVerticalGuide);
    }

    const docCenterX = docWidthPx / 2;
    const docCenterY = docHeightPx / 2;
    if (Math.abs(snappedMiddle - docCenterX) <= SNAP_TOLERANCE_PX) {
      lines.push({
        points: [docCenterX, 0, docCenterX, docHeightPx],
      });
    }
    if (Math.abs(snappedCenter - docCenterY) <= SNAP_TOLERANCE_PX) {
      lines.push({
        points: [0, docCenterY, docWidthPx, docCenterY],
      });
    }

    setGuideLines(lines);

    return { x: snappedX, y: snappedY };
  };

  /**
   * Build drag event handlers shared across all element types.
   */
  const makeDragHandlers = (
    elId: string | undefined,
    elWidthPx: number,
    elHeightPx: number
  ) => ({
    onDragStart: (event: any) => {
      setIsDragging(true);
      setCursor(event, 'grabbing');
    },
    onDragMove: (event: any) => {
      const snapped = getSnappedPosition(
        elId,
        event.target.x(),
        event.target.y(),
        elWidthPx,
        elHeightPx
      );
      event.target.position(snapped);
    },
    onDragEnd: (event: any) => {
      setIsDragging(false);
      setGuideLines([]);
      setCursor(event, 'default');
      if (elId && onElementPositionChange) {
        const position = event.target.position();
        onElementPositionChange(elId, position.x / MM_TO_PX, position.y / MM_TO_PX);
      }
    },
  });

  /**
   * Hover handlers: show border rect on enter, hide on leave.
   * Cursor stays default (no grab) unless actively dragging.
   */
  const makeHoverHandlers = (elId: string | undefined) => ({
    onMouseEnter: () => {
      if (!isDragging) {
        setHoveredId(elId);
      }
    },
    onMouseLeave: () => {
      setHoveredId(undefined);
    },
  });

  const elements = doc?.elements.map((el, key) => {
    if (el instanceof TextBox) {
      const draggable = Boolean(el.id && onElementPositionChange);
      const wPx = el.width * MM_TO_PX;
      const hPx = el.height * MM_TO_PX;
      const hovered = hoveredId === el.id && !isDragging;
      return (
        <Group
          key={'eltb' + key}
          draggable={draggable}
          x={el.x * MM_TO_PX}
          y={el.y * MM_TO_PX}
          {...(draggable ? makeDragHandlers(el.id, wPx, hPx) : {})}
          {...(draggable ? makeHoverHandlers(el.id) : {})}
        >
          {el.backgroundColor ? (
            <Rect
              key={'elr' + key}
              x={0}
              y={0}
              width={wPx}
              height={hPx}
              fill={el.backgroundColor || undefined}
            />
          ) : null}
          <KonvaText
            key={'elt' + key}
            x={0}
            y={0}
            width={wPx}
            height={hPx}
            text={el.text}
            fontSize={el.fontSize * PT_TO_PX}
            fontFamily={el.fontFamily}
            fill={el.color}
            align={convertTextAlignToKonva(el.textAlign)}
            textDecoration={getKonvaTextDecoration(el.textDecoration)}
          />
          {hovered && (
            <Rect
              x={0}
              y={0}
              width={wPx}
              height={hPx}
              stroke={HOVER_BORDER_COLOR}
              strokeWidth={1}
              dash={[4, 4]}
              fill="transparent"
              listening={false}
            />
          )}
        </Group>
      );
    } else if (el instanceof Image) {
      const draggable = Boolean(el.id && onElementPositionChange);
      const wPx = el.width * MM_TO_PX;
      const hPx = el.height * MM_TO_PX;
      const hovered = hoveredId === el.id && !isDragging;
      return (
        <Group
          key={'elimagegroup' + key}
          draggable={draggable}
          x={el.x * MM_TO_PX}
          y={el.y * MM_TO_PX}
          {...(draggable ? makeDragHandlers(el.id, wPx, hPx) : {})}
          {...(draggable ? makeHoverHandlers(el.id) : {})}
        >
          <AttachmentImage
            key={'elimage' + key}
            x={0}
            y={0}
            width={wPx}
            height={hPx}
            imageData={el.imageData}
            scaleToFit={el.scaleToFit}
          />
          {hovered && (
            <Rect
              x={0}
              y={0}
              width={wPx}
              height={hPx}
              stroke={HOVER_BORDER_COLOR}
              strokeWidth={1}
              dash={[4, 4]}
              fill="transparent"
              listening={false}
            />
          )}
        </Group>
      );
    } else if (el instanceof QrCode) {
      const draggable = Boolean(el.id && onElementPositionChange);
      const wPx = el.width * MM_TO_PX;
      const hPx = el.height * MM_TO_PX;
      const hovered = hoveredId === el.id && !isDragging;
      return (
        <Group
          key={'elqrcodegroup' + key}
          draggable={draggable}
          x={el.x * MM_TO_PX}
          y={el.y * MM_TO_PX}
          {...(draggable ? makeDragHandlers(el.id, wPx, hPx) : {})}
          {...(draggable ? makeHoverHandlers(el.id) : {})}
        >
          <Rect
            key={'elqrcode' + key}
            x={0}
            y={0}
            width={wPx}
            height={hPx}
            fill="#000000"
          />
          {hovered && (
            <Rect
              x={0}
              y={0}
              width={wPx}
              height={hPx}
              stroke={HOVER_BORDER_COLOR}
              strokeWidth={1}
              dash={[4, 4]}
              fill="transparent"
              listening={false}
            />
          )}
        </Group>
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
          stroke={GUIDE_COLOR}
          strokeWidth={1}
          dash={line.dashed ? [6, 6] : undefined}
          listening={false}
        />
      ))}
    </>
  );
};

export default CanvasRenderer;
