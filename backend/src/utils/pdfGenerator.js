const PDFDocument = require('pdfkit');

const generateInvoicePDF = (invoice) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = doc.page.width;
    const blue = '#1a237e';
    const green = '#2e7d32';
    const gray = '#757575';

    doc.rect(0, 0, W, 80).fill(blue);
    doc.fontSize(22).fillColor('white').font('Helvetica-Bold')
      .text('NEXUS CORPORATE SERVICES', 50, 20);
    doc.fontSize(10).font('Helvetica').fillColor('rgba(255,255,255,0.75)')
      .text('123 Business Ave, New York, NY 10001  |  billing@nexuscorp.com', 50, 48);

    doc.fillColor('#000000');
    let y = 100;

    if (invoice.status === 'Paid') {
      doc.save();
      // lineBreak:false prevents PDFKit from triggering a new page for this absolute-positioned text
      doc.fontSize(90).fillColor('#c8f7c5').font('Helvetica-Bold')
        .rotate(-30, { origin: [W / 2, 380] })
        .text('PAID', 130, 350, { lineBreak: false });
      doc.restore();
      doc.fillColor('#000000');
    }

    doc.fontSize(18).font('Helvetica-Bold').fillColor(blue)
      .text('INVOICE', 50, y);
    y += 28;

    const metaLeft = 50;
    const metaRight = 320;
    doc.fontSize(10).font('Helvetica').fillColor(gray);

    const meta = [
      ['Invoice Number', invoice.invoiceNumber],
      ['Issue Date', new Date(invoice.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
      ['Due Date', new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
    ];
    if (invoice.paidAt) {
      meta.push(['Paid On', new Date(invoice.paidAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })]);
    }

    meta.forEach(([label, value]) => {
      doc.font('Helvetica-Bold').text(label + ':', metaLeft, y, { continued: false });
      doc.font('Helvetica').fillColor('#000').text(value, metaRight, y);
      doc.fillColor(gray);
      y += 18;
    });

    y += 10;
    doc.moveTo(50, y).lineTo(W - 50, y).strokeColor('#e0e0e0').lineWidth(1).stroke();
    y += 14;

    doc.fontSize(9).font('Helvetica-Bold').fillColor(gray).text('BILL TO', 50, y);
    y += 14;
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#000')
      .text(invoice.client.name, 50, y);
    y += 16;
    if (invoice.client.company) {
      doc.fontSize(10).font('Helvetica').text(invoice.client.company, 50, y);
      y += 14;
    }
    doc.fontSize(10).fillColor(gray).text(invoice.client.email, 50, y);
    y += 28;

    doc.moveTo(50, y).lineTo(W - 50, y).strokeColor('#e0e0e0').lineWidth(1).stroke();
    y += 14;

    const colDesc = 50;
    const colQty = 320;
    const colUnit = 390;
    const colTotal = 470;
    const colEnd = W - 50;

    doc.fontSize(9).font('Helvetica-Bold').fillColor(gray);
    doc.text('DESCRIPTION', colDesc, y);
    doc.text('QTY', colQty, y, { width: 60, align: 'center' });
    doc.text('UNIT PRICE', colUnit, y, { width: 70, align: 'right' });
    doc.text('TOTAL', colTotal, y, { width: colEnd - colTotal, align: 'right' });
    y += 16;
    doc.moveTo(50, y).lineTo(W - 50, y).strokeColor('#e0e0e0').lineWidth(0.5).stroke();
    y += 8;

    doc.fillColor('#000');
    invoice.items.forEach((item) => {
      const lineTotal = item.quantity * item.unitPrice;
      doc.fontSize(10).font('Helvetica').text(item.description, colDesc, y, { width: colQty - colDesc - 10 });
      doc.text(item.quantity.toString(), colQty, y, { width: 60, align: 'center' });
      doc.text(`$${item.unitPrice.toFixed(2)}`, colUnit, y, { width: 70, align: 'right' });
      doc.text(`$${lineTotal.toFixed(2)}`, colTotal, y, { width: colEnd - colTotal, align: 'right' });
      y += 20;
    });

    y += 4;
    doc.moveTo(50, y).lineTo(W - 50, y).strokeColor('#bdbdbd').lineWidth(1).stroke();
    y += 12;

    doc.fontSize(13).font('Helvetica-Bold').fillColor(blue)
      .text(`TOTAL DUE: $${invoice.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 50, y, { align: 'right', width: W - 100 });
    y += 32;

    if (invoice.notes) {
      doc.fontSize(9).font('Helvetica-Bold').fillColor(gray).text('NOTES', 50, y);
      y += 14;
      doc.fontSize(10).font('Helvetica').fillColor('#000').text(invoice.notes, 50, y, { width: W - 100 });
      y += doc.heightOfString(invoice.notes, { width: W - 100 }) + 20;
    }

    // PDFKit auto-adds a blank page when text is drawn past (height - bottom margin).
    // Drop the bottom margin to 0 to safely place the footer at the very bottom, then restore.
    const savedBottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    const footerH = 46;
    const footerY = doc.page.height - footerH;
    doc.rect(0, footerY, W, footerH).fill('#f5f5f5');
    doc.fontSize(9).fillColor(gray).font('Helvetica')
      .text('Thank you for your business. Payment is due by the date stated above.', 50, footerY + 14, { align: 'center', width: W - 100, lineBreak: false });
    doc.text('© Nexus Corporate Services  |  (212) 555-0100  |  www.nexuscorp.com', 50, footerY + 28, { align: 'center', width: W - 100, lineBreak: false });

    doc.page.margins.bottom = savedBottomMargin;

    doc.end();
  });
};

module.exports = { generateInvoicePDF };
