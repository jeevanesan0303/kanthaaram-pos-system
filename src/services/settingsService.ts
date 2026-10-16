import { supabase } from '../lib/supabase';
import { StoreSettings } from '../types';

interface StoreSettingsDatabaseRow {
  id: string;
  store_name: string;
  address: string;
  phone: string;
  email: string;
  logo: string | null;
  banner: string | null;
  currency: string;
  tax_percentage: number | string;
  default_discount: number | string;
  receipt_footer: string;
  enable_notifications: boolean;
  low_stock_threshold: number | string;
  printer_name: string | null;
  auto_print_receipt: boolean;
  show_logo_on_receipt: boolean;
  show_address_on_receipt: boolean;
  show_points_on_receipt: boolean;
  show_qr_code_on_receipt: boolean;
  show_cashier_on_receipt: boolean;
  show_customer_on_receipt: boolean;
  show_notes_on_receipt: boolean;
  show_payment_method_on_receipt: boolean;
  show_tax_breakdown_on_receipt: boolean;
  receipt_paper_width: string;
  receipt_font_size: string;
  receipt_header_title: string | null;
  receipt_header_tagline: string | null;
}

const mapStoreSettings = (
  row: StoreSettingsDatabaseRow,
): StoreSettings => ({
  storeName: row.store_name ?? '',
  address: row.address ?? '',
  phone: row.phone ?? '',
  email: row.email ?? '',
  logo: row.logo ?? '',
  banner: row.banner ?? '',
  currency: row.currency ?? 'LKR',
  taxPercentage: Number(
    row.tax_percentage ?? 0,
  ),
  defaultDiscount: Number(
    row.default_discount ?? 0,
  ),
  receiptFooter:
    row.receipt_footer ||
    'Thank You! Visit Again',
  enableNotifications:
    row.enable_notifications ?? true,
  lowStockThreshold: Number(
    row.low_stock_threshold ?? 5,
  ),
  printerName: row.printer_name ?? '',
  autoPrintReceipt:
    row.auto_print_receipt ?? false,
  showLogoOnReceipt:
    row.show_logo_on_receipt ?? true,
  showAddressOnReceipt:
    row.show_address_on_receipt ?? true,
  showPointsOnReceipt:
    row.show_points_on_receipt ?? true,
  showQrCodeOnReceipt:
    row.show_qr_code_on_receipt ?? true,
  showCashierOnReceipt:
    row.show_cashier_on_receipt ?? true,
  showCustomerOnReceipt:
    row.show_customer_on_receipt ?? true,
  showNotesOnReceipt:
    row.show_notes_on_receipt ?? true,
  showPaymentMethodOnReceipt:
    row.show_payment_method_on_receipt ??
    true,
  showTaxBreakdownOnReceipt:
    row.show_tax_breakdown_on_receipt ??
    true,
  receiptPaperWidth:
    row.receipt_paper_width === '58mm'
      ? '58mm'
      : '80mm',
  receiptFontSize:
    row.receipt_font_size === 'Compact' ||
    row.receipt_font_size ===
      'Comfortable'
      ? row.receipt_font_size
      : 'Standard',
  receiptHeaderTitle:
    row.receipt_header_title ?? '',
  receiptHeaderTagline:
    row.receipt_header_tagline ?? '',
});

const getSettingsRow = async () => {
  const { data, error } = await supabase
    .from('store_settings')
    .select('*')
    .order('created_at', {
      ascending: true,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(
      'Store settings have not been created.',
    );
  }

  return data as StoreSettingsDatabaseRow;
};

export const settingsService = {
  async get(): Promise<StoreSettings> {
    return mapStoreSettings(
      await getSettingsRow(),
    );
  },

  async update(
    input: StoreSettings,
  ): Promise<StoreSettings> {
    const existing =
      await getSettingsRow();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw new Error(userError.message);
    }

    if (!user) {
      throw new Error(
        'Your session has expired. Please log in again.',
      );
    }

    const { data, error } = await supabase
      .from('store_settings')
      .update({
        store_name: input.storeName.trim(),
        address: input.address.trim(),
        phone: input.phone.trim(),
        email: input.email
          .trim()
          .toLowerCase(),

        logo: input.logo?.trim() || null,
        banner:
          input.banner?.trim() || null,
        currency: input.currency,

        tax_percentage:
          input.taxPercentage,
        default_discount:
          input.defaultDiscount,

        receipt_footer:
          input.receiptFooter.trim(),

        enable_notifications:
          input.enableNotifications,

        low_stock_threshold:
          input.lowStockThreshold,

        printer_name:
          input.printerName.trim(),

        auto_print_receipt:
          input.autoPrintReceipt,

        show_logo_on_receipt:
          input.showLogoOnReceipt,

        show_address_on_receipt:
          input.showAddressOnReceipt,

        show_points_on_receipt:
          input.showPointsOnReceipt,

        show_qr_code_on_receipt:
          input.showQrCodeOnReceipt,

        show_cashier_on_receipt:
          input.showCashierOnReceipt,

        show_customer_on_receipt:
          input.showCustomerOnReceipt,

        show_notes_on_receipt:
          input.showNotesOnReceipt,

        show_payment_method_on_receipt:
          input.showPaymentMethodOnReceipt,

        show_tax_breakdown_on_receipt:
          input.showTaxBreakdownOnReceipt,

        receipt_paper_width:
          input.receiptPaperWidth,

        receipt_font_size:
          input.receiptFontSize,

        receipt_header_title:
          input.receiptHeaderTitle?.trim() ||
          input.storeName.trim(),

        receipt_header_tagline:
          input.receiptHeaderTagline?.trim() ||
          null,

        updated_by: user.id,
        updated_at:
          new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapStoreSettings(
      data as StoreSettingsDatabaseRow,
    );
  },
};