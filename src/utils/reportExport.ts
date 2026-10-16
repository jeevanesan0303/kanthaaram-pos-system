import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export type ReportCell =
  | string
  | number
  | boolean
  | null
  | undefined;

export interface ReportColumn {
  key: string;
  label: string;
}

export interface ReportExportOptions {
  reportName: string;
  storeName: string;
  period: string;
  columns: ReportColumn[];
  rows: Record<string, ReportCell>[];
  currency?: string;
}

const sanitizeFileName = (
  value: string,
): string =>
  value
    .trim()
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();

const getFileName = (
  reportName: string,
): string => {
  const date = new Date()
    .toISOString()
    .slice(0, 10);

  return `${sanitizeFileName(
    reportName,
  )}_${date}`;
};

const downloadBlob = (
  blob: Blob,
  fileName: string,
) => {
  const url =
    window.URL.createObjectURL(blob);

  const anchor =
    document.createElement('a');

  anchor.href = url;
  anchor.download = fileName;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.URL.revokeObjectURL(url);
};

const escapeCSVValue = (
  value: ReportCell,
): string => {
  const stringValue =
    value === null || value === undefined
      ? ''
      : String(value);

  return `"${stringValue.replace(
    /"/g,
    '""',
  )}"`;
};

export const exportReportCSV = (
  options: ReportExportOptions,
): void => {
  const header = options.columns
    .map((column) =>
      escapeCSVValue(column.label),
    )
    .join(',');

  const body = options.rows.map((row) =>
    options.columns
      .map((column) =>
        escapeCSVValue(row[column.key]),
      )
      .join(','),
  );

  // BOM helps Excel display UTF-8 text correctly.
  const csvContent = [
    '\uFEFF',
    header,
    ...body,
  ].join('\r\n');

  downloadBlob(
    new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    }),
    `${getFileName(options.reportName)}.csv`,
  );
};

export const exportReportExcel = (
  options: ReportExportOptions,
): void => {
  const titleRows: ReportCell[][] = [
    [options.storeName],
    [`${options.reportName} Report`],
    [`Period: ${options.period}`],
    [
      `Generated: ${new Date().toLocaleString()}`,
    ],
    [],
  ];

  const headerRow = options.columns.map(
    (column) => column.label,
  );

  const dataRows = options.rows.map(
    (row) =>
      options.columns.map(
        (column) => row[column.key] ?? '',
      ),
  );

  const worksheet =
    XLSX.utils.aoa_to_sheet([
      ...titleRows,
      headerRow,
      ...dataRows,
    ]);

  worksheet['!cols'] =
    options.columns.map((column) => ({
      wch: Math.max(
        14,
        Math.min(column.label.length + 8, 30),
      ),
    }));

  worksheet['!freeze'] = {
    xSplit: 0,
    ySplit: 6,
  };

  const workbook =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    options.reportName.slice(0, 31),
  );

  XLSX.writeFile(
    workbook,
    `${getFileName(options.reportName)}.xlsx`,
  );
};

export const exportReportPDF = (
  options: ReportExportOptions,
): void => {
  const landscape =
    options.columns.length > 6;

  const document = new jsPDF({
    orientation:
      landscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  document.setFont('helvetica', 'bold');
  document.setFontSize(16);
  document.setTextColor(17, 24, 39);

  document.text(
    options.storeName || 'Store Report',
    14,
    16,
  );

  document.setFontSize(12);
  document.text(
    `${options.reportName} Report`,
    14,
    24,
  );

  document.setFont(
    'helvetica',
    'normal',
  );

  document.setFontSize(9);
  document.setTextColor(100, 116, 139);

  document.text(
    `Period: ${options.period}`,
    14,
    31,
  );

  document.text(
    `Generated: ${new Date().toLocaleString()}`,
    14,
    36,
  );

  autoTable(document, {
    startY: 42,

    head: [
      options.columns.map(
        (column) => column.label,
      ),
    ],

    body: options.rows.map((row) =>
      options.columns.map((column) => {
        const value = row[column.key];

        return value === null ||
          value === undefined
          ? ''
          : String(value);
      }),
    ),

    theme: 'grid',

    headStyles: {
      fillColor: [245, 158, 11],
      textColor: [69, 26, 3],
      fontStyle: 'bold',
      fontSize: 8,
    },

    bodyStyles: {
      fontSize: 7.5,
      textColor: [31, 41, 55],
      cellPadding: 2,
    },

    alternateRowStyles: {
      fillColor: [255, 251, 235],
    },

    styles: {
      overflow: 'linebreak',
      valign: 'middle',
    },

    margin: {
      top: 42,
      left: 10,
      right: 10,
      bottom: 15,
    },

    didDrawPage: () => {
      const pageCount =
        document.getNumberOfPages();

      document.setFontSize(8);
      document.setTextColor(
        148,
        163,
        184,
      );

      document.text(
        `Page ${pageCount}`,
        document.internal.pageSize.width -
          22,
        document.internal.pageSize.height -
          7,
      );
    },
  });

  document.save(
    `${getFileName(options.reportName)}.pdf`,
  );
};