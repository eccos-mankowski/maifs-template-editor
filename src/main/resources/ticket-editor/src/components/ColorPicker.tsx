import {
  Button,
  Colors,
  Icon,
  Intent,
  Popover,
  Tooltip,
} from '@blueprintjs/core';
import React, { useCallback, useEffect, useState } from 'react';
import { ColorResult, SketchPicker } from 'react-color';
import { IconNames } from '@blueprintjs/icons';
import styles from './ColorPicker.module.css';
import { __ } from '../utils';

export interface ColorPickerProps {
  value: string;
  onChange?: (value: string) => void;
  onChangeComplete?: (value: string) => void;
  allowTransparent?: boolean;
}

function parseColor(color: string) {
  if (!color || typeof color !== 'string') {
    return null;
  }
  let matches = color.match(/^#([0-9a-fA-F]{6})$/i);
  if (!matches || !matches[1]) {
    return null;
  }
  const match = matches[1];
  return [
    parseInt(match.substr(0, 2), 16),
    parseInt(match.substr(2, 2), 16),
    parseInt(match.substr(4, 2), 16),
  ];
}

function getContrastColor(color: string) {
  const rgb = parseColor(color);
  if (rgb === null) {
    return undefined;
  }
  const [r, g, b] = rgb;
  const brightness = Math.round((r * 299 + g * 587 + b * 114) / 1000);
  return brightness > 125 ? Colors.BLACK : Colors.WHITE;
}

export const ColorPicker: React.FC<ColorPickerProps> = (props) => {
  const [color, setColor] = useState(props.value);
  const allowTransparent =
    props.allowTransparent !== undefined ? props.allowTransparent : false;

  // Update color from props.
  useEffect(() => {
    setColor(props.value);
  }, [props.value]);

  // Handle color change, without final change.
  const handleChangeColor = useCallback((color: ColorResult) => {
    setColor(color.hex);
    if (props.onChange) {
      props.onChange(color.hex);
    }
  }, []);

  // Handle final color change.
  const handleFinalColorChange = useCallback((color: ColorResult) => {
    setColor(color.hex);
    if (props.onChangeComplete) {
      props.onChangeComplete(color.hex);
    }
  }, []);

  const handleResetColor = useCallback(() => {
    setColor('');
    if (props.onChange) {
      props.onChange('');
    }
    if (props.onChangeComplete) {
      props.onChangeComplete('');
    }
  }, []);

  const contractColor = getContrastColor(color);
  return (
    <>
      <Popover
        interactionKind="click"
        usePortal={false}
        position="right-top"
        boundary="viewport"
      >
        <>
          <Button
            icon={<Icon icon={IconNames.TINT} color={contractColor} />}
            style={{ backgroundColor: color, color: contractColor }}
          >
            Open color picker
          </Button>
        </>
        <SketchPicker
          color={color}
          onChange={handleChangeColor}
          onChangeComplete={handleFinalColorChange}
        />
      </Popover>
      {allowTransparent ? (
        <Tooltip content={__('Reset color', 'eccospro-easyticket')}>
          <Button
            className={styles.removeButton}
            icon="graph-remove"
            intent={Intent.DANGER}
            onClick={handleResetColor}
            minimal
          />
        </Tooltip>
      ) : null}
    </>
  );
};
