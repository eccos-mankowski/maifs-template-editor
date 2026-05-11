import {BaseElement} from "./base-element.class";

export class Image extends BaseElement {
    static readonly ownElementType = 'image';

    // Renamed from attachmentId to imageData
    imageData: string | null;
    scaleToFit: boolean;

    constructor(obj: any) {
        super(obj);
        Object.assign(this, { elementType: Image.ownElementType });

        // Support both names for a smoother transition if needed
        this.imageData = obj.imageData || obj.attachmentId || null;
        this.scaleToFit = Boolean(obj.scaleToFit || false);
    }
}