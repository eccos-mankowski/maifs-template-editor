import { BaseElement } from './base-element.class';

export class QrCode extends BaseElement {
  static readonly ownElementType = 'qr_code';

  data: string = '';
  type: string = '';

  constructor(obj: any) {
    super(obj);
    Object.assign(this, { elementType: QrCode.ownElementType });
    this.data = String(obj.data || this.data);
    this.type = String(obj.type || this.type);
  }
}
