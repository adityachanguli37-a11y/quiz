const express = require('express');
const router = express.Router();
const certificateService = require('../services/certificateService');

// Public lookup for certificate verification
router.get('/verify/:certId', async (req, res, next) => {
  try {
    const { certId } = req.params;
    const certInfo = await certificateService.verifyCertificate(certId.toUpperCase().trim());
    if (!certInfo) {
      return res.status(404).json({ verified: false, message: 'Certificate not found or invalid ID.' });
    }
    res.json({ verified: true, certificate: certInfo });
  } catch (error) {
    next(error);
  }
});

// Download certificate PDF
router.get('/download/:certId', async (req, res, next) => {
  try {
    const { certId } = req.params;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Certificate_${certId.toUpperCase().trim()}.pdf`);

    await certificateService.generateCertificatePDF(certId.toUpperCase().trim(), res);
  } catch (error) {
    // If headers were not already sent, return JSON error
    if (!res.headersSent) {
      res.status(400).json({ message: error.message });
    } else {
      next(error);
    }
  }
});

module.exports = router;
