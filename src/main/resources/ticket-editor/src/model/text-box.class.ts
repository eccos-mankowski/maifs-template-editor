import { BaseElement } from './base-element.class';
import { FontWeight } from './font-weight.enum';
import { TextAlign } from './text-align.enum';
import { TextDecoration } from './text-decoration.enum';

export class TextBox extends BaseElement {
  static readonly ownElementType = 'text_box';

  text: string = '';
  textDecoration: TextDecoration = TextDecoration.DECORATION_NONE;
  fontFamily: string = 'Open Sans';
  fontSize: number = 12;
  textAlign: TextAlign = TextAlign.ALIGN_LEFT;
  fontWeight: FontWeight = FontWeight.WEIGHT_REGULAR;
  color: string = '#000000';
  backgroundColor: string | null = null;

  constructor(obj: any) {
    super(obj);
    Object.assign(this, { elementType: TextBox.ownElementType });
    this.text = String(obj.text || this.text);
    if (Object.values(TextDecoration).includes(obj.textDecoration)) {
      this.textDecoration = obj.textDecoration as TextDecoration;
    }
    this.fontFamily = String(obj.fontFamily || this.fontFamily);
    this.fontSize = Number(obj.fontSize || this.fontSize);
    if (Object.values(FontWeight).includes(obj.fontWeight)) {
      this.fontWeight = obj.fontWeight;
    }
    if (Object.values(TextAlign).includes(obj.textAlign)) {
      this.textAlign = obj.textAlign;
    }
    this.color = String(obj.color || this.color);
    this.backgroundColor =
      String(obj.backgroundColor || '') || this.backgroundColor;
  }
}
