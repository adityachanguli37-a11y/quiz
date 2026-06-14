const PDFDocument = require('pdfkit');
const Certificate = require('../models/Certificate');

const generateCertificatePDF = async (certificateId, outputStream) => {
  const cert = await Certificate.findOne({ certificateId, isDeleted: false });
  if (!cert) {
    throw new Error('Certificate not found.');
  }

  // Create a landscape PDF document (A4 size: 841.89 x 595.28)
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margins: { top: 40, bottom: 40, left: 40, right: 40 }
  });

  doc.pipe(outputStream);

  // Styling Constants
  const navyColor = '#0F172A';   // Dark Slate
  const goldColor = '#D97706';   // Amber Gold
  const blueColor = '#0284C7';   // Cyber Blue
  const whiteColor = '#FFFFFF';
  
  // 1. Draw Background
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(navyColor);

  // 2. Draw Borders (Double frame)
  doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
     .lineWidth(3)
     .stroke(goldColor);

  doc.rect(28, 28, doc.page.width - 56, doc.page.height - 56)
     .lineWidth(1)
     .stroke(blueColor);

  // Decorative Corners
  const drawCorner = (x, y, dx, dy) => {
    doc.moveTo(x, y).lineTo(x + dx, y).lineTo(x, y + dy).lineTo(x, y).fill(goldColor);
  };
  drawCorner(28, 28, 30, 30);
  drawCorner(doc.page.width - 28, 28, -30, 30);
  drawCorner(28, doc.page.height - 28, 30, -30);
  drawCorner(doc.page.width - 28, doc.page.height - 28, -30, -30);

  // 3. Header Texts
  doc.fillColor(blueColor)
     .fontSize(16)
     .font('Helvetica-Bold')
     .text('CYBERSECURITY AWARENESS INITIATIVE', 0, 80, { align: 'center' });

  doc.fillColor(whiteColor)
     .fontSize(36)
     .font('Helvetica-Bold')
     .text('CERTIFICATE OF ACCOMPLISHMENT', 0, 115, { align: 'center', characterSpacing: 1 });

  // Divider line
  doc.moveTo(200, 165).lineTo(doc.page.width - 200, 165).lineWidth(2).stroke(goldColor);

  // 4. Body Text
  doc.fillColor(whiteColor)
     .fontSize(14)
     .font('Helvetica')
     .text('This is proudly presented to', 0, 185, { align: 'center' });

  // Candidate Name (highlighted)
  doc.fillColor(goldColor)
     .fontSize(28)
     .font('Helvetica-Bold')
     .text(cert.candidateName.toUpperCase(), 0, 215, { align: 'center' });

  // Verification details
  doc.fillColor(whiteColor)
     .fontSize(12)
     .font('Helvetica')
     .text(`Candidate ID: ${cert.candidateId}`, 0, 250, { align: 'center' });

  doc.fillColor(whiteColor)
     .fontSize(14)
     .font('Helvetica')
     .text(`for successfully passing the examination:`, 0, 285, { align: 'center' });

  // Quiz Name
  doc.fillColor(blueColor)
     .fontSize(20)
     .font('Helvetica-Bold')
     .text(cert.quizName, 0, 315, { align: 'center' });

  // Score & Date
  const dateFormatted = new Date(cert.completionDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  doc.fillColor(whiteColor)
     .fontSize(13)
     .font('Helvetica')
     .text(`with a passing score of ${cert.score} Correct Answers (${cert.percentage}%)`, 0, 350, { align: 'center' });

  doc.text(`Completed on: ${dateFormatted}`, 0, 375, { align: 'center' });

  // 5. Signature Areas
  // Left side signature
  doc.moveTo(100, 480).lineTo(250, 480).lineWidth(1).stroke(whiteColor);
  doc.fillColor(whiteColor)
     .fontSize(10)
     .font('Helvetica')
     .text('Program Director', 100, 485, { width: 150, align: 'center' });

  // Right side verification seal
  doc.moveTo(doc.page.width - 250, 480).lineTo(doc.page.width - 100, 480).lineWidth(1).stroke(whiteColor);
  doc.fillColor(whiteColor)
     .fontSize(10)
     .font('Helvetica')
     .text('Authorized Validator', doc.page.width - 250, 485, { width: 150, align: 'center' });

  // 6. Verification ID at bottom
  doc.fillColor(blueColor)
     .fontSize(9)
     .font('Courier')
     .text(`Certificate Verification ID: ${cert.certificateId}`, 0, 520, { align: 'center' });

  doc.fillColor('#64748B')
     .fontSize(8)
     .font('Helvetica')
     .text(`To verify this certificate, visit: /verify-certificate/${cert.certificateId}`, 0, 535, { align: 'center' });

  doc.end();
};

const verifyCertificate = async (certificateId) => {
  const cert = await Certificate.findOne({ certificateId, isDeleted: false });
  if (!cert) {
    return null;
  }
  return {
    certificateId: cert.certificateId,
    candidateName: cert.candidateName,
    candidateId: cert.candidateId,
    quizName: cert.quizName,
    score: cert.score,
    percentage: cert.percentage,
    completionDate: cert.completionDate,
    hash: cert.hash
  };
};

module.exports = {
  generateCertificatePDF,
  verifyCertificate
};
