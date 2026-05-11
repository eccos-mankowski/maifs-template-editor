import { BaseElement } from './base-element.class';
import { TextBox } from './text-box.class';
import { Image } from './image.class';
import { QrCode } from './qr-code.class';
import { __ } from '../utils';

export class Document {
  public width: number;
  public height: number;
  public elements: BaseElement[];

  constructor(obj: any) {
    this.width = Number(obj.width || 210);
    this.height = Number(obj.height || 297);
    // Initialize the elements.
    this.elements = (obj.elements || []).map((el: any) => {
      if (el instanceof BaseElement) {
        return el;
      }
      switch (el.elementType) {
        case TextBox.ownElementType:
          return new TextBox(el);
        case Image.ownElementType:
          return new Image(el);
        case QrCode.ownElementType:
          return new QrCode(el);
        default:
          throw new Error(
            __('Unknown element type.', 'eccospro-easyticket')
          );
      }
    });
  }
}
