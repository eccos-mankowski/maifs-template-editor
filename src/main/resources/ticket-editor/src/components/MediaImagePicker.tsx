import { Button } from '@blueprintjs/core';
import React, { useCallback, useRef } from 'react';

export interface MediaImagePickerProps {
    buttonText: string;
    value: string | null; // Changed from number/File to string (Base64)
    onChange?: (value: string | null) => void;
    accept?: string;
}

export const MediaImagePicker: React.FC<MediaImagePickerProps> = (props) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleButtonClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                if (props.onChange) {
                    props.onChange(base64String);
                }
            };
            reader.readAsDataURL(file);
        }
    }, [props.onChange]);

    return (
        <>
            <Button
                icon={"upload"}
                onClick={handleButtonClick}
            >
                {props.buttonText}
            </Button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept={props.accept || "image/*"}
                style={{ display: 'none' }}
            />
        </>
    );
};