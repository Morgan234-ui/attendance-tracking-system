import jsPDF from 'jspdf';
import 'jspdf-autotable';

export function generatePDFReport({ title, headers, data, filename }) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setTextColor(30, 58, 138);
  doc.text(title, 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

  doc.autoTable({
    head: [headers],
    body: data,
    startY: 36,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [241, 245, 249],
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
  });

  doc.save(`${filename}.pdf`);
  return doc;
}

export function generateExcelReport({ headers, data, filename }) {
  const XLSX = require('xlsx');
  const worksheetData = [headers, ...data];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  const colWidths = headers.map((header, i) => {
    const maxLen = Math.max(
      header.length,
      ...data.map(row => (row[i] ? row[i].toString().length : 0))
    );
    return { wch: Math.min(maxLen + 2, 30) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
  XLSX.writeFile(workbook, `${filename}.xlsx`);

  return workbook;
}
