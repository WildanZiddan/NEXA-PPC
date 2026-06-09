/**
 * Export helper functions for PDF and Excel (CSV)
 */

export function exportToPDF(title: string, headers: string[], rows: any[][]) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const htmlHeaders = headers
    .map(
      (h) =>
        `<th style="border: 1px solid #cbd5e1; background-color: #f8fafc; padding: 12px 8px; font-size: 11px; text-align: left; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.05em;">${h}</th>`
    )
    .join("");

  const htmlRows = rows
    .map(
      (row) =>
        `<tr style="border-bottom: 1px solid #f1f5f9;">${row
          .map(
            (cell) =>
              `<td style="padding: 10px 8px; font-size: 11px; color: #475569; font-family: ui-sans-serif, system-ui, sans-serif;">${
                cell !== null && cell !== undefined ? String(cell) : ""
              }</td>`
          )
          .join("")}</tr>`
    )
    .join("");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <meta charset="utf-8" />
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          body {
            font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
            padding: 40px 24px;
            color: #1e293b;
            background-color: #ffffff;
          }
          .header {
            margin-bottom: 30px;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 16px;
          }
          .header h1 {
            font-size: 20px;
            font-weight: 700;
            margin: 0;
            color: #0f172a;
          }
          .header p {
            font-size: 12px;
            color: #64748b;
            margin: 6px 0 0 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th {
            border-bottom: 2px solid #cbd5e1;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .footer {
            margin-top: 40px;
            font-size: 9px;
            color: #94a3b8;
            text-align: right;
            border-top: 1px solid #e2e8f0;
            padding-top: 12px;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <p>Laporan Sistem PPC NEXA - Diekspor pada ${new Date().toLocaleString("id-ID")}</p>
        </div>
        <table>
          <thead>
            <tr>${htmlHeaders}</tr>
          </thead>
          <tbody>
            ${htmlRows}
          </tbody>
        </table>
        <div class="footer">NEXA-PPC Production Planning & Control System • Rahasia Internal</div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

export function exportToExcel(filename: string, headers: string[], rows: any[][]) {
  // Convert rows to CSV strings with double quotes wrapping and escaping
  const csvContent = [
    headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(","),
    ...rows.map((row) =>
      row
        .map((cell) => {
          const rawString = cell !== null && cell !== undefined ? String(cell) : "";
          return `"${rawString.replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ].join("\r\n");

  // Excel needs UTF-8 BOM to correctly recognize Unicode/UTF-8 content
  const blob = new Blob(["\ufeff" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
