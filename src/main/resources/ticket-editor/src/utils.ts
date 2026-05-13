import { BaseElement } from './model/base-element.class';
import { Document } from './model/document.class';
import {
  FooterLayout,
  HeaderTitleBoxPosition,
  Settings,
  TicketPageFormat,
  TicketInfoBoxLayout,
} from './model/settings';
import { TextBox } from './model/text-box.class';
import { Image } from './model/image.class';
import { QrCode } from './model/qr-code.class';
import { FontWeight } from './model/font-weight.enum';
import { format } from 'date-fns';
import deLocale from 'date-fns/locale/de';
import { TextAlign } from './model/text-align.enum';

function getValidImageData(data: string | null | undefined): string | null {
    if (!data || data === "null" || data === "undefined") {
        return null;
    }
    if (data.includes('dummyimage.com') || data.includes('placehold.co')) {
        return null;
    }
    return data;
}

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const A5_WIDTH_MM = 148;
const A5_HEIGHT_MM = 210;
const MIN_CUSTOM_SIZE_MM = 10;

function getDocumentSize(settings: Settings) {
  if (settings.pageFormat === TicketPageFormat.A5) {
    return { width: A5_WIDTH_MM, height: A5_HEIGHT_MM };
  }
  if (settings.pageFormat === TicketPageFormat.CUSTOM) {
    const customWidth = Number(settings.customPageWidth);
    const customHeight = Number(settings.customPageHeight);
    return {
      width: Math.max(
        MIN_CUSTOM_SIZE_MM,
        Number.isFinite(customWidth) ? customWidth : A4_WIDTH_MM
      ),
      height: Math.max(
        MIN_CUSTOM_SIZE_MM,
        Number.isFinite(customHeight) ? customHeight : A4_HEIGHT_MM
      ),
    };
  }
  return { width: A4_WIDTH_MM, height: A4_HEIGHT_MM };
}

function getElementPosition(
  settings: Settings,
  id: string,
  x: number,
  y: number,
  scaleX: number,
  scaleY: number
) {
  const customPosition = settings.elementPositions[id];
  if (
    customPosition &&
    Number.isFinite(customPosition.x) &&
    Number.isFinite(customPosition.y)
  ) {
    return customPosition;
  }
  return {
    x: x * scaleX,
    y: y * scaleY,
  };
}

/**
 * Function converts a settings object to a template document.
 * @param settings Specifies the settings object.
 * @returns The template document.
 */
export function convertSettingsToTemplateDocument(
  settings: Settings
): Document {
  const documentSize = getDocumentSize(settings);
  const scaleX = documentSize.width / A4_WIDTH_MM;
  const scaleY = documentSize.height / A4_HEIGHT_MM;
  const elements: BaseElement[] = [];
  // Header
  // Header image
  elements.push(
    new Image({
      x: 0,
      y: 0,
      width: A4_WIDTH_MM * scaleX,
      height: 95 * scaleY,
      imageData: getValidImageData(settings.headerImageData),
      scaleToFit: true,
    })
  );
  // Header title element
  let headerTextAddend = 0;
  if (
    settings.headerTitleBoxPosition ===
    HeaderTitleBoxPosition.BELOW_HEADER_IMAGE
  ) {
    headerTextAddend = 40;
  }
  const titlePosition = getElementPosition(
    settings,
    'title',
    25,
    60 + headerTextAddend,
    scaleX,
    scaleY
  );
  elements.push(
    new TextBox({
      id: 'title',
      x: titlePosition.x,
      y: titlePosition.y,
      width: 160 * scaleX,
      height: 20 * scaleY,
      text: settings.headerTitle,
      fontSize: 48,
      textAlign: TextAlign.ALIGN_CENTER,
      fontWeight: FontWeight.WEIGHT_BOLD,
      color: settings.headerTitleBoxTextColor,
      backgroundColor: settings.headerTitleBoxBackgroundColor,
    })
  );
  // Header subtitle
  const subtitlePosition = getElementPosition(
    settings,
    'subtitle',
    25,
    80 + headerTextAddend,
    scaleX,
    scaleY
  );
  elements.push(
    new TextBox({
      id: 'subtitle',
      x: subtitlePosition.x,
      y: subtitlePosition.y,
      width: 160 * scaleX,
      height: 15 * scaleY,
      text: settings.headerSubtitle,
      fontSize: 18,
      textAlign: TextAlign.ALIGN_CENTER,
      fontWeight: FontWeight.WEIGHT_BOLD,
      color: settings.headerTitleBoxTextColor,
      backgroundColor: settings.headerTitleBoxBackgroundColor,
    })
  );

  // Content
  // Ticket text
  const ticketTextPosition = getElementPosition(
    settings,
    'ticket_text',
    15,
    99 + headerTextAddend,
    scaleX,
    scaleY
  );
  elements.push(
    new TextBox({
      id: 'ticket_text',
      x: ticketTextPosition.x,
      y: ticketTextPosition.y,
      width: 180 * scaleX,
      height: (55 - headerTextAddend) * scaleY,
      text: settings.ticketText,
      fontSize: 11,
      fontWeight: FontWeight.WEIGHT_REGULAR,
      color: settings.ticketTextBoxTextColor,
      backgroundColor: settings.ticketTextBoxBackgroundColor,
    })
  );

    // Person Name
  const personNamePosition = getElementPosition(
    settings,
    'person_name',
    15,
    156,
    scaleX,
    scaleY
  );
  elements.push(
    new TextBox({
      id: 'person_name',
      x: personNamePosition.x,
      y: personNamePosition.y,
      width: 180 * scaleX,
      height: 65 * scaleY,
      text: __('Person name demo text.', 'eccospro-reserve'),
      fontSize: 12,
      fontWeight: FontWeight.WEIGHT_REGULAR,
      color: settings.ticketTextBoxTextColor,
      fitted: true,
    })
  );

    // Personal message
  const personalMessagePosition = getElementPosition(
    settings,
    'personal_message',
    15,
    162,
    scaleX,
    scaleY
  );
  elements.push(
    new TextBox({
      id: 'personal_message',
      x: personalMessagePosition.x,
      y: personalMessagePosition.y,
      width: 180 * scaleX,
      height: 65 * scaleY,
      text: __('Personal message demo text.', 'eccospro-reserve'),
      fontSize: 11,
      fontWeight: FontWeight.WEIGHT_REGULAR,
      color: settings.ticketTextBoxTextColor,
      fitted: true,
    })
  );

  // QR Code + date + price_rate + code
  let codeX = 0;
  let dateX = 0;
  let priceRateX = 0;
  let textCodeX = 0;
  let detailDescriptionX = 0;
  if (settings.ticketInfoBoxLayout === TicketInfoBoxLayout.CODE_LEFT) {
    codeX = 15;
    dateX = 80;
    priceRateX = 80;
    textCodeX = 80;
    detailDescriptionX = 80;
  } else if (settings.ticketInfoBoxLayout === TicketInfoBoxLayout.CODE_RIGHT) {
    codeX = 145;
    dateX = 15;
    priceRateX = 15;
    textCodeX = 15;
    detailDescriptionX = 15;
  }

  // QR code
  const qrCodePosition = getElementPosition(
    settings,
    'qr_code',
    codeX,
    198,
    scaleX,
    scaleY
  );
  elements.push(
    new QrCode({
      id: 'qr_code',
      x: qrCodePosition.x,
      y: qrCodePosition.y,
      width: 35 * scaleX,
      height: 35 * scaleY,
      data: '',
    })
  );

  // Product description
  const validityFormattedPosition = getElementPosition(
    settings,
    'validity_formatted',
    dateX,
    198,
    scaleX,
    scaleY
  );
  elements.push(
    new TextBox({
      id: 'validity_formatted',
      x: validityFormattedPosition.x,
      y: validityFormattedPosition.y,
      width: 95 * scaleX,
      height: 15 * scaleY,
      text: '',
      fontSize: 12,
      fontWeight: FontWeight.WEIGHT_REGULAR,
      color: settings.ticketTextBoxTextColor,
    })
  );

  // Validity row
  const validityLabelPosition = getElementPosition(
    settings,
    'validity_label',
    dateX,
    208,
    scaleX,
    scaleY
  );
  elements.push(
    new TextBox({
      id: 'validity_label',
      x: validityLabelPosition.x,
      y: validityLabelPosition.y,
      width: 65 * scaleX,
      height: 15 * scaleY,
      text: 'Gültigkeit:',
      fontSize: 12,
      fontWeight: FontWeight.WEIGHT_REGULAR,
      color: settings.ticketTextBoxTextColor,
    })
  );
  const issueDatePosition = getElementPosition(
    settings,
    'issue_date',
    dateX + 65,
    208,
    scaleX,
    scaleY
  );
  elements.push(
    new TextBox({
      id: 'issue_date',
      x: issueDatePosition.x,
      y: issueDatePosition.y,
      width: 35 * scaleX,
      height: 15 * scaleY,
      text: format(new Date(), 'P', { locale: deLocale }),
      fontSize: 12,
      fontWeight: FontWeight.WEIGHT_REGULAR,
      color: settings.ticketTextBoxTextColor,
    })
  );

  // Issue date row
  const issueDateLabelPosition = getElementPosition(
    settings,
    'issue_date_label',
    priceRateX,
    218,
    scaleX,
    scaleY
  );
  elements.push(
    new TextBox({
      id: 'issue_date_label',
      x: issueDateLabelPosition.x,
      y: issueDateLabelPosition.y,
      width: 65 * scaleX,
      height: 15 * scaleY,
      text: 'Ausstellungsdatum:',
      fontSize: 12,
      fontWeight: FontWeight.WEIGHT_REGULAR,
      color: settings.ticketTextBoxTextColor,
    })
  );
  const priceRatePosition = getElementPosition(
    settings,
    'price_rate',
    priceRateX + 65,
    218,
    scaleX,
    scaleY
  );
  elements.push(
    new TextBox({
      id: 'price_rate',
      x: priceRatePosition.x,
      y: priceRatePosition.y,
      width: 35 * scaleX,
      height: 15 * scaleY,
      text: format(new Date(), 'P', { locale: deLocale }),
      fontSize: 12,
      fontWeight: FontWeight.WEIGHT_REGULAR,
      color: settings.ticketTextBoxTextColor,
    })
  );

  // Code in text format
  const codePosition = getElementPosition(
    settings,
    'code',
    textCodeX,
    228,
    scaleX,
    scaleY
  );
  elements.push(
    new TextBox({
      id: 'code',
      x: codePosition.x,
      y: codePosition.y,
      width: 85 * scaleX,
      height: 15 * scaleY,
      text: 'DEMO - DEMO - DEMO',
      fontSize: 12,
      fontWeight: FontWeight.WEIGHT_REGULAR,
      color: settings.ticketTextBoxTextColor,
    })
  );

  // Address + logo
  let addressX = 0;
  let logoX = 0;
  if (settings.footerLayout === FooterLayout.ADDRESS_LEFT_LOGO_RIGHT) {
    addressX = 15;
    logoX = 140;
  }
  // if (settings.footerLayout === FooterLayout.ADDRESS_RIGHT_LOGO_LEFT)
  else {
    addressX = 75;
    logoX = 15;
  }

  // Address
  const addressPosition = getElementPosition(
    settings,
    'address',
    addressX,
    255,
    scaleX,
    scaleY
  );
  elements.push(
    new TextBox({
      id: 'address',
      x: addressPosition.x,
      y: addressPosition.y,
      width: 120 * scaleX,
      height: 30 * scaleY,
      text: settings.address,
      fontSize: 12,
      fontWeight: FontWeight.WEIGHT_REGULAR,
      color: settings.ticketTextBoxTextColor,
    })
  );

  // Logo
  elements.push(
    new Image({
      x: logoX * scaleX,
      y: 250 * scaleY,
      width: 55 * scaleX,
      height: 30 * scaleY,
      imageData: getValidImageData(settings.logoImageData),
    })
  );

  // Footer
  // Legal text
  const legalText = settings.legalText.trim();
  if (legalText) {
    const legalTextPosition = getElementPosition(
      settings,
      'legal_text',
      12,
      285,
      scaleX,
      scaleY
    );
    elements.push(
      new TextBox({
        id: 'legal_text',
        x: legalTextPosition.x,
        y: legalTextPosition.y,
        width: 186 * scaleX,
        height: 10 * scaleY,
        text: legalText,
        fontSize: 12,
        fontWeight: FontWeight.WEIGHT_REGULAR,
        textAlign: TextAlign.ALIGN_CENTER,
        color: settings.ticketTextBoxTextColor,
      })
    );
  }
  return new Document({
    width: documentSize.width,
    height: documentSize.height,
    elements,
  });
}

export function __(key: string, domain: string) {
  const translations = window.MF_VE_OBJ.translations || {};

  return typeof translations[key] !== 'string' ? key : translations[key];
}
