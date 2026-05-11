import { BaseElement } from './model/base-element.class';
import { Document } from './model/document.class';
import {
  FooterLayout,
  HeaderTitleBoxPosition,
  Settings,
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

/**
 * Function converts a settings object to a template document.
 * @param settings Specifies the settings object.
 * @returns The template document.
 */
export function convertSettingsToTemplateDocument(
  settings: Settings
): Document {
  const elements: BaseElement[] = [];
  // Header
  // Header image
  elements.push(
    new Image({
      x: 0,
      y: 0,
      width: 210,
      height: 95,
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
  elements.push(
    new TextBox({
      id: 'title',
      x: 25,
      y: 60 + headerTextAddend,
      width: 160,
      height: 20,
      text: settings.headerTitle,
      fontSize: 48,
      textAlign: TextAlign.ALIGN_CENTER,
      fontWeight: FontWeight.WEIGHT_BOLD,
      color: settings.headerTitleBoxTextColor,
      backgroundColor: settings.headerTitleBoxBackgroundColor,
    })
  );
  // Header subtitle
  elements.push(
    new TextBox({
      id: 'subtitle',
      x: 25,
      y: 80 + headerTextAddend,
      width: 160,
      height: 15,
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
  elements.push(
    new TextBox({
      id: 'ticket_text',
      x: 15,
      y: 99 + headerTextAddend,
      width: 180,
      height: 55 - headerTextAddend,
      text: settings.ticketText,
      fontSize: 11,
      fontWeight: FontWeight.WEIGHT_REGULAR,
      color: settings.ticketTextBoxTextColor,
      backgroundColor: settings.ticketTextBoxBackgroundColor,
    })
  );

    // Person Name
    elements.push(
        new TextBox({
            id: 'person_name',
            x: 15,
            y: 156,
            width: 180,
            height: 65,
            text: __('Person name demo text.', 'eccospro-reserve'),
            fontSize: 12,
            fontWeight: FontWeight.WEIGHT_REGULAR,
            color: settings.ticketTextBoxTextColor,
            fitted: true,
        })
    );

    // Personal message
    elements.push(
        new TextBox({
            id: 'personal_message',
            x: 15,
            y: 162,
            width: 180,
            height: 65,
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
  elements.push(
    new QrCode({
      id: 'qr_code',
      x: codeX,
      y: 198,
      width: 35,
      height: 35,
      data: '',
    })
  );

  // Product description
  elements.push(
    new TextBox({
      id: 'validity_formatted',
      x: dateX,
      y: 198,
      width: 95,
      height: 15,
      text: '',
      fontSize: 12,
      fontWeight: FontWeight.WEIGHT_REGULAR,
      color: settings.ticketTextBoxTextColor,
    })
  );

  // Issue date
  elements.push(
    new TextBox({
      x: dateX,
      y: 208,
      width: 65,
      height: 15,
      text: 'Gültigkeit:',
      fontSize: 12,
      fontWeight: FontWeight.WEIGHT_REGULAR,
      color: settings.ticketTextBoxTextColor,
    })
  );
  elements.push(
    new TextBox({
      id: 'issue_date',
      x: dateX + 65,
      y: 208,
      width: 35,
      height: 15,
      text: format(new Date(), 'P', { locale: deLocale }),
      fontSize: 12,
      fontWeight: FontWeight.WEIGHT_REGULAR,
      color: settings.ticketTextBoxTextColor,
    })
  );

  // Price rate
  elements.push(
    new TextBox({
      x: priceRateX,
      y: 218,
      width: 65,
      height: 15,
      text:  'Ausstellungsdatum:',
      fontSize: 12,
      fontWeight: FontWeight.WEIGHT_REGULAR,
      color: settings.ticketTextBoxTextColor,
    })
  );
  elements.push(
    new TextBox({
      id: 'price_rate',
      x: priceRateX + 65,
      y: 218,
      width: 35,
      height: 15,
      text: format(new Date(), 'P', { locale: deLocale }),
      fontSize: 12,
      fontWeight: FontWeight.WEIGHT_REGULAR,
      color: settings.ticketTextBoxTextColor,
    })
  );

  // Code in text format
  elements.push(
    new TextBox({
      id: 'code',
      x: textCodeX,
      y: 228,
      width: 85,
      height: 15,
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
  elements.push(
    new TextBox({
      x: addressX,
      y: 255,
      width: 120,
      height: 30,
      text: settings.address,
      fontSize: 12,
      fontWeight: FontWeight.WEIGHT_REGULAR,
      color: settings.ticketTextBoxTextColor,
    })
  );

  // Logo
  elements.push(
    new Image({
      x: logoX,
      y: 250,
      width: 55,
      height: 30,
      imageData: getValidImageData(settings.logoImageData),
    })
  );

  // Footer
  // Legal text
  const legalText = settings.legalText.trim();
  if (legalText) {
    elements.push(
      new TextBox({
        x: 12,
        y: 285,
        width: 186,
        height: 10,
        text: legalText,
        fontSize: 12,
        fontWeight: FontWeight.WEIGHT_REGULAR,
        textAlign: TextAlign.ALIGN_CENTER,
        color: settings.ticketTextBoxTextColor,
      })
    );
  }
  return new Document({ elements });
}

export function __(key: string, domain: string) {
  const translations = window.MF_VE_OBJ.translations || {};

  return typeof translations[key] !== 'string' ? key : translations[key];
}
