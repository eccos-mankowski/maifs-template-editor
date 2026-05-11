import React from 'react';
import { Image } from 'react-konva';
import useImage from 'use-image';
import { IRect } from 'konva/types/types';

export interface AttachmentImageProps {
    x: number;
    y: number;
    width: number;
    height: number;
    // Renamed for clarity and changed type to string
    imageData: string | null;
    scaleToFit: boolean;
}

function getPlaceholderImageUrl(width: number, height: number) {
    return `https://dummyimage.com/${width}x${height}`;
}

const AttachmentImage: React.FC<AttachmentImageProps> = ({
                                                             x,
                                                             y,
                                                             width,
                                                             height,
                                                             imageData,
                                                             scaleToFit,
                                                         }) => {
    const widthPx = Math.round(width);
    const heightPx = Math.round(height);

    const isValidImageData =
        imageData &&
        imageData !== "null" &&
        imageData !== "undefined" &&
        imageData.trim() !== "";

    const url = (isValidImageData
        ? imageData
        : getPlaceholderImageUrl(widthPx, heightPx)) || '';

    // useImage handles Base64 strings automatically
    const isBase64 = url.startsWith('data:');
    const [image, status] = useImage(url, isBase64 ? undefined : 'anonymous');

    React.useEffect(() => {
        console.log(`Image Status: ${status} | URL starts with: ${url.substring(0, 30)}...`);
        if (status === 'failed') {
            console.error("Image loading failed. Check CORS headers or URL validity.");
        }
    }, [status, url]);

    const loaded = status === 'loaded';
    let crop: IRect | undefined = undefined;

    if (loaded && image) {
        if (scaleToFit) {
            // Logic for "Cover" (filling the box, potentially clipping sides)
            const containerRatio = width / height;
            const imageRatio = image.width / image.height;

            let newWidth: number;
            let newHeight: number;
            if (containerRatio >= imageRatio) {
                newWidth = image.width;
                newHeight = image.width / containerRatio;
            } else {
                newWidth = image.height * containerRatio;
                newHeight = image.height;
            }

            crop = {
                x: (image.width - newWidth) / 2,
                y: (image.height - newHeight) / 2,
                width: newWidth,
                height: newHeight,
            } as IRect;
        } else {
            // Logic for "Contain" (fitting image inside box without clipping)
            const widthRatio = widthPx / image.width;
            const heightRatio = heightPx / image.height;
            let newWidth = image.width;
            let newHeight = image.height;
            let offsetX = 0;
            let offsetY = 0;

            if (widthRatio >= heightRatio) {
                offsetX = (widthPx / heightRatio - image.width) / 2;
                newWidth += offsetX * 2;
                newHeight = image.height;
            } else {
                offsetY = (heightPx / widthRatio - image.height) / 2;
                newWidth = image.width;
                newHeight += offsetY * 2;
            }

            crop = {
                x: -offsetX,
                y: -offsetY,
                width: newWidth,
                height: newHeight,
            } as IRect;
        }
    }

    return (
        <Image
            x={x}
            y={y}
            width={widthPx}
            height={heightPx}
            crop={crop}
            image={loaded ? image : undefined}
        />
    );
};

export default AttachmentImage;