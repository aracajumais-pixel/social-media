// Export market analysis and table data as Excel-compatible CSV (.csv / .xlsx format)
export function exportToExcelCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  // UTF-8 BOM to make Excel render characters (accents, ç, R$) correctly
  let csvContent = '\uFEFF';

  // Format headers
  csvContent += headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(';') + '\n';

  // Format rows
  rows.forEach(row => {
    const formattedRow = row.map(cell => {
      const val = cell === null || cell === undefined ? '' : String(cell);
      return `"${val.replace(/"/g, '""')}"`;
    }).join(';');
    csvContent += formattedRow + '\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
