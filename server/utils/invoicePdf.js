const PDFDocument = require("pdfkit");

// Simple, clean invoice PDF — buffer-e generate hoy (disk-e save hoy na),
// email attachment হিসেবে সরাসরি ব্যবহার করার জন্য।
const generateInvoicePdfBuffer = ({
  invoiceId,
  studentName,
  studentEmail,
  courseTitle,
  amount,
  discountAmount = 0,
  paymentMethod,
  transactionId,
  date,
  siteName = "LMS Platform",
}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // ── Header ──────────────────────────────────────────────────────────
      doc.fillColor("#0f172a").fontSize(22).font("Helvetica-Bold").text(siteName, 50, 50);
      doc.fillColor("#64748b").fontSize(10).font("Helvetica").text("Payment Invoice", 50, 78);

      doc.fillColor("#0f172a").fontSize(16).font("Helvetica-Bold").text("INVOICE", 400, 50, { align: "right" });
      doc.fillColor("#64748b").fontSize(10).font("Helvetica")
        .text(`Invoice ID: ${invoiceId}`, 400, 72, { align: "right" })
        .text(`Date: ${new Date(date).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}`, 400, 86, { align: "right" });

      doc.moveTo(50, 110).lineTo(545, 110).strokeColor("#e2e8f0").stroke();

      // ── Billed to ───────────────────────────────────────────────────────
      doc.fillColor("#64748b").fontSize(10).font("Helvetica").text("BILLED TO", 50, 130);
      doc.fillColor("#0f172a").fontSize(12).font("Helvetica-Bold").text(studentName || "Student", 50, 146);
      doc.fillColor("#64748b").fontSize(10).font("Helvetica").text(studentEmail || "", 50, 164);

      // ── Line item table ─────────────────────────────────────────────────
      const tableTop = 210;
      doc.fillColor("#0f172a").fontSize(10).font("Helvetica-Bold")
        .text("Description", 50, tableTop)
        .text("Payment Method", 300, tableTop)
        .text("Amount", 470, tableTop, { width: 75, align: "right" });
      doc.moveTo(50, tableTop + 18).lineTo(545, tableTop + 18).strokeColor("#e2e8f0").stroke();

      doc.fillColor("#334155").fontSize(10).font("Helvetica")
        .text(courseTitle || "Course Enrollment", 50, tableTop + 30, { width: 240 })
        .text(paymentMethod || "-", 300, tableTop + 30, { width: 150 })
        .text(`৳${Number(amount + discountAmount).toLocaleString()}`, 470, tableTop + 30, { width: 75, align: "right" });

      let y = tableTop + 60;
      if (discountAmount > 0) {
        doc.fillColor("#64748b").fontSize(10)
          .text("Discount", 300, y, { width: 150 })
          .text(`- ৳${Number(discountAmount).toLocaleString()}`, 470, y, { width: 75, align: "right" });
        y += 20;
      }

      doc.moveTo(300, y).lineTo(545, y).strokeColor("#e2e8f0").stroke();
      y += 10;
      doc.fillColor("#0f172a").fontSize(12).font("Helvetica-Bold")
        .text("Total Paid", 300, y, { width: 150 })
        .text(`৳${Number(amount).toLocaleString()}`, 470, y, { width: 75, align: "right" });

      y += 40;
      if (transactionId) {
        doc.fillColor("#64748b").fontSize(9).font("Helvetica").text(`Transaction ID: ${transactionId}`, 50, y);
        y += 16;
      }
      doc.fillColor("#94a3b8").fontSize(9).text("This is a computer-generated invoice and does not require a signature.", 50, y);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateInvoicePdfBuffer };
