export abstract class BaseElement {
  public id?: string;
  public x: number = 0;
  public y: number = 0;
  public width: number = 0;
  public height: number = 0;
  public zIndex: number = 0;
  public children: BaseElement[] | null = null;

  protected constructor(obj: any) {
    this.id = obj.id ? String(obj.id) : undefined;
    this.x = Number(obj.x) || obj.x;
    this.y = Number(obj.y) || obj.y;
    this.width = Number(obj.width) || obj.width;
    this.height = Number(obj.height) || obj.height;
    this.zIndex = Number(obj.zIndex) || 0;
    this.children = null;
  }
}
