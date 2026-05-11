import { __ } from '../utils';

export enum HeaderTitleBoxPosition {
  OVERLAP_HEADER_IMAGE = 1,
  BELOW_HEADER_IMAGE = 2,
}

export enum TicketInfoBoxLayout {
  CODE_LEFT = 1,
  CODE_RIGHT = 2,
}

export enum FooterLayout {
  ADDRESS_LEFT_LOGO_RIGHT = 1,
  ADDRESS_RIGHT_LOGO_LEFT = 2,
}

export class Settings {
  public active: boolean = false;
  public headerImageData: string | null = null;
  public headerTitleBoxPosition: HeaderTitleBoxPosition =
    HeaderTitleBoxPosition.OVERLAP_HEADER_IMAGE;
  public headerTitleBoxTextColor: string = '#FFFFFF';
  public headerTitleBoxBackgroundColor: string = '#000000';
  public headerTitle: string = __('Ticket', 'eccospro-easyticket');
  public headerSubtitle: string = __(
    'Ticket Subtitle',
    'eccospro-easyticket'
  );
  public ticketTextBoxTextColor: string = '#000000';
  public ticketTextBoxBackgroundColor: string = '';
  public ticketText: string = '';
  public ticketInfoBoxLayout: TicketInfoBoxLayout =
    TicketInfoBoxLayout.CODE_LEFT;
  public footerLayout: FooterLayout = FooterLayout.ADDRESS_LEFT_LOGO_RIGHT;
  public address: string = '';
  public logoImageData: string | null = null;
  public legalText: string = '';
  public ticketAltText: string = '';

  constructor(obj: any) {
    if (!obj) {
      return;
    }
    this.active = Boolean(obj.active);
    this.headerImageData = String(obj.headerImageData) || obj.headerImageData;
    this.headerTitleBoxPosition = Object.values(
      HeaderTitleBoxPosition
    ).includes(obj.headerTitleBoxPosition)
      ? (obj.headerTitleBoxPosition as HeaderTitleBoxPosition)
      : this.headerTitleBoxPosition;
    this.headerTitleBoxTextColor = String(
      obj.headerTitleBoxTextColor || this.headerTitleBoxTextColor
    );
    this.headerTitle = String(obj.headerTitle || this.headerTitle);
    this.headerSubtitle = String(obj.headerSubtitle || this.headerSubtitle);
    this.ticketTextBoxTextColor = String(
      obj.ticketTextBoxTextColor || this.ticketTextBoxTextColor
    );
    this.headerTitleBoxBackgroundColor = String(
      obj.headerTitleBoxBackgroundColor || this.headerTitleBoxBackgroundColor
    );
    this.ticketTextBoxBackgroundColor = String(
      obj.ticketTextBoxBackgroundColor || this.ticketTextBoxBackgroundColor
    );
    this.ticketText = String(obj.ticketText || this.ticketText);
    this.ticketInfoBoxLayout = Object.values(TicketInfoBoxLayout).includes(
      obj.ticketInfoBoxLayout
    )
      ? (obj.ticketInfoBoxLayout as TicketInfoBoxLayout)
      : this.ticketInfoBoxLayout;
    this.footerLayout = Object.values(FooterLayout).includes(obj.footerLayout)
      ? (obj.footerLayout as FooterLayout)
      : this.footerLayout;
    this.address = String(obj.address || this.address);
    this.logoImageData = String(this.logoImageData) || obj.logoImageData;
    this.legalText = String(obj.legalText || this.legalText);
    this.ticketAltText = String(obj.ticketAltText || this.ticketAltText );
  }
}
