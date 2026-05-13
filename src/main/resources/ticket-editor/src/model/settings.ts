import { __ } from '../utils';
import { TextAlign } from './text-align.enum';

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

export enum TicketPageFormat {
  A4 = 'A4',
  A5 = 'A5',
  CUSTOM = 'CUSTOM',
}

export interface ElementPosition {
  x: number;
  y: number;
}

function parseDimension(
  value: unknown,
  fallback: number
): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseTextAlign(value: unknown, fallback: TextAlign): TextAlign {
  return Object.values(TextAlign).includes(value as TextAlign)
    ? (value as TextAlign)
    : fallback;
}

export class Settings {
  public active: boolean = false;
  public pageFormat: TicketPageFormat = TicketPageFormat.A4;
  public customPageWidth: number = 210;
  public customPageHeight: number = 297;
  public elementPositions: Record<string, ElementPosition> = {};
  public headerImageData: string | null = null;
  public headerImageHeight: number = 95;
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
  public personalMessage: string = '';
  public personalMessageFontSize: number = 11;
  public personalMessageTextAlign: TextAlign = TextAlign.ALIGN_LEFT;
  public voucherValue: string = '10 €';
  public voucherValueFontSize: number = 20;
  public voucherValueTextAlign: TextAlign = TextAlign.ALIGN_CENTER;
  public validityFontSize: number = 12;
  public validityFormattedTextAlign: TextAlign = TextAlign.ALIGN_LEFT;
  public validityLabelTextAlign: TextAlign = TextAlign.ALIGN_LEFT;
  public issueDateTextAlign: TextAlign = TextAlign.ALIGN_LEFT;
  public issueDateFontSize: number = 12;
  public issueDateLabelTextAlign: TextAlign = TextAlign.ALIGN_LEFT;
  public priceRateTextAlign: TextAlign = TextAlign.ALIGN_LEFT;
  public codeFontSize: number = 12;
  public codeTextAlign: TextAlign = TextAlign.ALIGN_LEFT;
  public ticketInfoBoxLayout: TicketInfoBoxLayout =
    TicketInfoBoxLayout.CODE_LEFT;
  public footerLayout: FooterLayout = FooterLayout.ADDRESS_LEFT_LOGO_RIGHT;
  public address: string = '';
  public logoImageData: string | null = null;
  public logoImageHeight: number = 30;
  public qrCodeSize: number = 35;
  public addressFontSize: number = 12;
  public addressTextAlign: TextAlign = TextAlign.ALIGN_LEFT;
  public legalText: string = '';
  public legalTextAlign: TextAlign = TextAlign.ALIGN_CENTER;
  public ticketAltText: string = '';

  constructor(obj: any) {
    if (!obj) {
      return;
    }
    this.active = Boolean(obj.active);
    this.pageFormat = Object.values(TicketPageFormat).includes(obj.pageFormat)
      ? (obj.pageFormat as TicketPageFormat)
      : this.pageFormat;
    this.customPageWidth = parseDimension(
      obj.customPageWidth,
      this.customPageWidth
    );
    this.customPageHeight = parseDimension(
      obj.customPageHeight,
      this.customPageHeight
    );
    this.elementPositions =
      obj.elementPositions && typeof obj.elementPositions === 'object'
        ? Object.keys(obj.elementPositions).reduce(
            (acc: Record<string, ElementPosition>, key: string) => {
              const value = obj.elementPositions[key];
              const x = Number(value?.x);
              const y = Number(value?.y);
              if (Number.isFinite(x) && Number.isFinite(y)) {
                acc[key] = { x, y };
              }
              return acc;
            },
            {}
          )
        : {};
    this.headerImageData = String(obj.headerImageData) || obj.headerImageData;
    this.headerImageHeight = parseDimension(
      obj.headerImageHeight,
      this.headerImageHeight
    );
    this.headerTitleBoxPosition = Object.values(
      HeaderTitleBoxPosition
    ).includes(obj.headerTitleBoxPosition)
      ? (obj.headerTitleBoxPosition as HeaderTitleBoxPosition)
      : this.headerTitleBoxPosition;
    this.headerTitleBoxTextColor = String(
      obj.headerTitleBoxTextColor || this.headerTitleBoxTextColor
    );
    this.headerTitleBoxBackgroundColor = String(
      obj.headerTitleBoxBackgroundColor || this.headerTitleBoxBackgroundColor
    );
    this.headerTitle = String(obj.headerTitle || this.headerTitle);
    this.headerSubtitle = String(obj.headerSubtitle || this.headerSubtitle);
    this.ticketTextBoxTextColor = String(
      obj.ticketTextBoxTextColor || this.ticketTextBoxTextColor
    );
    this.personalMessage = String(obj.personalMessage ?? this.personalMessage);
    this.personalMessageFontSize = parseDimension(
      obj.personalMessageFontSize,
      this.personalMessageFontSize
    );
    this.personalMessageTextAlign = parseTextAlign(
      obj.personalMessageTextAlign,
      this.personalMessageTextAlign
    );
    this.voucherValue = String(obj.voucherValue ?? this.voucherValue);
    this.voucherValueFontSize = parseDimension(
      obj.voucherValueFontSize,
      this.voucherValueFontSize
    );
    this.voucherValueTextAlign = parseTextAlign(
      obj.voucherValueTextAlign,
      this.voucherValueTextAlign
    );
    this.validityFontSize = parseDimension(
      obj.validityFontSize,
      this.validityFontSize
    );
    this.validityFormattedTextAlign = parseTextAlign(
      obj.validityFormattedTextAlign,
      this.validityFormattedTextAlign
    );
    this.validityLabelTextAlign = parseTextAlign(
      obj.validityLabelTextAlign,
      this.validityLabelTextAlign
    );
    this.issueDateTextAlign = parseTextAlign(
      obj.issueDateTextAlign,
      this.issueDateTextAlign
    );
    this.issueDateFontSize = parseDimension(
      obj.issueDateFontSize,
      this.issueDateFontSize
    );
    this.issueDateLabelTextAlign = parseTextAlign(
      obj.issueDateLabelTextAlign,
      this.issueDateLabelTextAlign
    );
    this.priceRateTextAlign = parseTextAlign(
      obj.priceRateTextAlign,
      this.priceRateTextAlign
    );
    this.codeFontSize = parseDimension(obj.codeFontSize, this.codeFontSize);
    this.codeTextAlign = parseTextAlign(obj.codeTextAlign, this.codeTextAlign);
    this.ticketInfoBoxLayout = Object.values(TicketInfoBoxLayout).includes(
      obj.ticketInfoBoxLayout
    )
      ? (obj.ticketInfoBoxLayout as TicketInfoBoxLayout)
      : this.ticketInfoBoxLayout;
    this.footerLayout = Object.values(FooterLayout).includes(obj.footerLayout)
      ? (obj.footerLayout as FooterLayout)
      : this.footerLayout;
    this.address = String(obj.address || this.address);
    this.logoImageData = (obj.logoImageData && String(obj.logoImageData)) || null;
    this.logoImageHeight = parseDimension(
      obj.logoImageHeight,
      this.logoImageHeight
    );
    this.qrCodeSize = parseDimension(obj.qrCodeSize, this.qrCodeSize);
    this.addressFontSize = parseDimension(
      obj.addressFontSize,
      this.addressFontSize
    );
    this.addressTextAlign = parseTextAlign(
      obj.addressTextAlign,
      this.addressTextAlign
    );
    this.legalText = String(obj.legalText || this.legalText);
    this.legalTextAlign = parseTextAlign(
      obj.legalTextAlign,
      this.legalTextAlign
    );
    this.ticketAltText = String(obj.ticketAltText || this.ticketAltText );
  }
}
