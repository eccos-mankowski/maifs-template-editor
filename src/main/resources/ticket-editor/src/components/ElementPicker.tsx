import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Popover,
  Menu,
  MenuItem,
  Position,
} from '@blueprintjs/core';

export interface ElementPickerProps<ID, E> {
  value: E;
  onChange: (key: ID) => void;
  options: E[];
  renderListItem: (
    value: E
  ) => { text: React.ReactNode; label: React.ReactNode };
  previewItem: (value: E) => React.ReactNode;
  getId: (value: E) => ID;
  disabled?: boolean;
  className?: string;
}

interface ElementMenuProps<ID, E> {
  options: E[];
  renderListItem: (
    value: E
  ) => { text: React.ReactNode; label: React.ReactNode };
  getId: (value: E) => ID;
  onSelect: (key: ID) => void;
  selected: E;
  disabled?: boolean;
}

const ElementMenuFactory = <ID, E>(): React.FC<ElementMenuProps<ID, E>> => (
  props
) => (
  <Menu>
    {props.options.map((e, key) => {
      const item = props.renderListItem(e);
      return (
        <MenuItem
          key={key}
          disabled={props.disabled || props.selected === e}
          onClick={() => {
            props.onSelect(props.getId(e));
          }}
          text={item.text}
          icon="style"
          labelElement={item.label}
        />
      );
    })}
  </Menu>
);

const ElementPickerFactory = <ID, E>(): React.FC<ElementPickerProps<ID, E>> => (
  props
) => {
  const ElementMenu = useMemo(() => ElementMenuFactory<ID, E>(), []);
  const [value, setValue] = useState(props.value);

  const handleSelect = useCallback(
    (key: ID) => {
      props.onChange(key);
    },
    [props.onChange]
  );
  useEffect(() => {
    setValue(props.value);
  }, [props.value]);

  return (
    <Popover
      position={Position.BOTTOM_LEFT}
      content={
        <ElementMenu
          renderListItem={props.renderListItem}
          options={props.options}
          onSelect={handleSelect}
          getId={props.getId}
          selected={value}
          disabled={props.disabled}
        />
      }
    >
      <Button disabled={props.disabled} rightIcon="caret-down">
        {props.previewItem(value)}
      </Button>
    </Popover>
  );
};

export default ElementPickerFactory;
