import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('xlsx', () => ({
  utils: {
    json_to_sheet: vi.fn(() => ({})),
    book_new: vi.fn(() => ({})),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

import * as XLSX from 'xlsx';
import { exportToExcel, exportMultiSheet } from '../lib/export-utils';

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── exportToExcel ──────────────────────────────────────────────────────────

describe('exportToExcel', () => {
  it('calls XLSX.writeFile with the correct filename', () => {
    const data = [{ name: 'Product A', price: 100 }];
    exportToExcel(data, 'test-export');

    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith(data);
    expect(XLSX.utils.book_new).toHaveBeenCalled();
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalled();
    expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), 'test-export.xlsx');
  });

  it('uses the provided sheet name', () => {
    const data = [{ col: 'val' }];
    exportToExcel(data, 'report', 'MySheet');

    expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'MySheet',
    );
  });

  it('defaults the sheet name to "Data"', () => {
    const data = [{ col: 'val' }];
    exportToExcel(data, 'report');

    expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'Data',
    );
  });

  it('handles empty data array without throwing', () => {
    expect(() => exportToExcel([], 'empty')).not.toThrow();
    expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), 'empty.xlsx');
  });

  it('handles data with special characters in values', () => {
    const data = [
      { name: 'Produit éàü', description: 'Rendement < 5% & > 2%' },
      { name: 'Côté "sûr"', description: "L'assurance-vie" },
    ];
    expect(() => exportToExcel(data, 'special-chars')).not.toThrow();
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith(data);
  });

  it('handles data with null and undefined values', () => {
    const data = [
      { name: 'Product A', price: null, notes: undefined },
    ];
    expect(() => exportToExcel(data, 'nullable')).not.toThrow();
    expect(XLSX.writeFile).toHaveBeenCalled();
  });

  it('handles a single row of data', () => {
    const data = [{ id: 1, value: 42 }];
    exportToExcel(data, 'single-row');

    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledTimes(1);
    expect(XLSX.writeFile).toHaveBeenCalledTimes(1);
  });
});

// ─── exportMultiSheet ───────────────────────────────────────────────────────

describe('exportMultiSheet', () => {
  it('creates a workbook with multiple sheets', () => {
    const sheets = [
      { name: 'Sheet1', data: [{ a: 1 }] },
      { name: 'Sheet2', data: [{ b: 2 }] },
    ];
    exportMultiSheet(sheets, 'multi');

    expect(XLSX.utils.book_new).toHaveBeenCalledTimes(1);
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledTimes(2);
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(2);
    expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), 'multi.xlsx');
  });

  it('appends each sheet with its correct name', () => {
    const sheets = [
      { name: 'Products', data: [{ id: 1 }] },
      { name: 'Commitments', data: [{ id: 2 }] },
      { name: 'Commissions', data: [{ id: 3 }] },
    ];
    exportMultiSheet(sheets, 'report');

    expect(XLSX.utils.book_append_sheet).toHaveBeenNthCalledWith(
      1, expect.anything(), expect.anything(), 'Products',
    );
    expect(XLSX.utils.book_append_sheet).toHaveBeenNthCalledWith(
      2, expect.anything(), expect.anything(), 'Commitments',
    );
    expect(XLSX.utils.book_append_sheet).toHaveBeenNthCalledWith(
      3, expect.anything(), expect.anything(), 'Commissions',
    );
  });

  it('handles an empty sheets array without throwing', () => {
    expect(() => exportMultiSheet([], 'empty-multi')).not.toThrow();
    expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), 'empty-multi.xlsx');
  });

  it('handles sheets with empty data arrays', () => {
    const sheets = [
      { name: 'EmptySheet', data: [] },
    ];
    expect(() => exportMultiSheet(sheets, 'empty-data')).not.toThrow();
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith([]);
  });
});
