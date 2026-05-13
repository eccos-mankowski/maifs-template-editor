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
// Distance at which proximity guides are shown (in px)
const PROXIMITY_THRESHOLD_PX = 60;
const GUIDE_COLOR = '#137cbd';
const HOVER_BORDER_COLOR = '#137cbd';
const DISTANCE_LABEL_COLOR = '#e84393';
const DISTANCE_LINE_COLOR = '#e84393';

type GuideLine = {
  points: number[];
  isDistance?: boolean;
  label?: string;
  // mid-point for label placement
  labelX?: number;
  labelY?: number;
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
   * Compute snap-to guides AND proximity distance indicators.
   * Returns the (possibly snapped) position and updates guide line state.
   */
  const getSnappedPosition = (
    id: string | undefined,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    const docW = (doc?.width || 0) * MM_TO_PX;
    const docH = (doc?.height || 0) * MM_TO_PX;

    // --- Snap stops: document edges/center + other element edges/centers ---
    const verticalStops: number[] = [0, docW / 2, docW];
    const horizontalStops: number[] = [0, docH / 2, docH];

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

    // Use the (possibly snapped) coords for guide rendering
    const fx = snappedX;
    const fy = snappedY;

    // Full-canvas alignment guides
    if (verticalGuide !== null) {
      lines.push({ points: [verticalGuide, 0, verticalGuide, docH] });
    }
    if (horizontalGuide !== null) {
      lines.push({ points: [0, horizontalGuide, docW, horizontalGuide] });
    }

    // --- Proximity: distance guides to nearby elements ---
    otherBounds.forEach((other) => {
      // Horizontal gap: element to the right of dragged item
      const gapRight = other.x - (fx + width);
      if (gapRight >= 0 && gapRight <= PROXIMITY_THRESHOLD_PX) {
        const lineY = fy + height / 2;
        lines.push({
          isDistance: true,
          points: [fx + width, lineY, other.x, lineY],
          label: `${Math.round(gapRight / MM_TO_PX)} mm`,
          labelX: fx + width + gapRight / 2,
          labelY: lineY - 10,
        });
      }
      // Horizontal gap: element to the left
      const gapLeft = fx - (other.x + other.width);
      if (gapLeft >= 0 && gapLeft <= PROXIMITY_THRESHOLD_PX) {
        const lineY = fy + height / 2;
        lines.push({
          isDistance: true,
          points: [other.x + other.width, lineY, fx, lineY],
          label: `${Math.round(gapLeft / MM_TO_PX)} mm`,
          labelX: other.x + other.width + gapLeft / 2,
          labelY: lineY - 10,
        });
      }
      // Vertical gap: element below dragged item
      const gapBelow = other.y - (fy + height);
      if (gapBelow >= 0 && gapBelow <= PROXIMITY_THRESHOLD_PX) {
        const lineX = fx + width / 2;
        lines.push({
          isDistance: true,
          points: [lineX, fy + height, lineX, other.y],
          label: `${Math.round(gapBelow / MM_TO_PX)} mm`,
          labelX: lineX + 4,
          labelY: fy + height + gapBelow / 2 - 6,
        });
      }
      // Vertical gap: element above
      const gapAbove = fy - (other.y + other.height);
      if (gapAbove >= 0 && gapAbove <= PROXIMITY_THRESHOLD_PX) {
        const lineX = fx + width / 2;
        lines.push({
          isDistance: true,
          points: [lineX, other.y + other.height, lineX, fy],
          label: `${Math.round(gapAbove / MM_TO_PX)} mm`,
          labelX: lineX + 4,
          labelY: other.y + other.height + gapAbove / 2 - 6,
        });
      }

      // Center-X alignment guide (other element's horizontal center is close to dragged center)
      const dragCenterX = fx + width / 2;
      const otherCenterX = other.x + other.width / 2;
      if (Math.abs(dragCenterX - otherCenterX) <= SNAP_TOLERANCE_PX * 2) {
        lines.push({ points: [otherCenterX, Math.min(fy, other.y), otherCenterX, Math.max(fy + height, other.y + other.height)] });
      }

      // Top-edge alignment guide
      if (Math.abs(fy - other.y) <= SNAP_TOLERANCE_PX * 2) {
        lines.push({ points: [Math.min(fx, other.x), other.y, Math.max(fx + width, other.x + other.width), other.y] });
      }
      // Bottom-edge alignment guide
      if (Math.abs((fy + height) - (other.y + other.height)) <= SNAP_TOLERANCE_PX * 2) {
        const edgeY = other.y + other.height;
        lines.push({ points: [Math.min(fx, other.x), edgeY, Math.max(fx + width, other.x + other.width), edgeY] });
      }
    });

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
            padding={3 * MM_TO_PX}
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
      {guideLines.map((line, index) =>
        line.isDistance ? (
          <React.Fragment key={`dist-${index}`}>
            <Line
              points={line.points}
              stroke={DISTANCE_LINE_COLOR}
              strokeWidth={1}
              dash={[3, 3]}
              listening={false}
            />
            {line.label && line.labelX !== undefined && line.labelY !== undefined && (
              <KonvaText
                x={line.labelX}
                y={line.labelY}
                text={line.label}
                fontSize={10}
                fill={DISTANCE_LABEL_COLOR}
                listening={false}
              />
            )}
          </React.Fragment>
        ) : (
          <Line
            key={`guide-${index}`}
            points={line.points}
            stroke={GUIDE_COLOR}
            strokeWidth={1}
            dash={[6, 6]}
            listening={false}
          />
        )
      )}
    </>
  );
};

export default CanvasRenderer;
