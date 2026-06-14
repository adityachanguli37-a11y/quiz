const Candidate = require('../models/Candidate');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const { importCandidatesFromExcel } = require('../services/importExportService');

const getCandidates = async (req, res, next) => {
  try {
    const { search, sortBy, sortOrder, page = 1, limit = 10 } = req.query;
    const filter = { isDeleted: false };

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { candidateId: searchRegex }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortField = sortBy || 'createdAt';
    const sortDir = sortOrder === 'asc' ? 1 : -1;

    const total = await Candidate.countDocuments(filter);
    const candidates = await Candidate.find(filter)
      .sort({ [sortField]: sortDir })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      candidates,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

const deleteCandidate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const candidate = await Candidate.findOne({ _id: id, isDeleted: false });
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found.' });
    }

    candidate.isDeleted = true;
    await candidate.save();

    // Audit Log
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
    await AuditLog.create({
      admin: req.admin.username,
      action: 'CANDIDATE_DELETE',
      ipAddress,
      metadata: { candidateId: candidate.candidateId, email: candidate.email }
    });

    res.json({ success: true, message: 'Candidate successfully soft-deleted.' });
  } catch (error) {
    next(error);
  }
};

const bulkImportCandidates = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Excel file (.xlsx) is required.' });
    }

    const summary = await importCandidatesFromExcel(req.file.buffer);

    // Save notification
    const notification = await Notification.create({
      title: 'Bulk Candidate Import',
      message: `Candidates imported: ${summary.successCount} succeeded, ${summary.failedCount} failed.`,
      type: summary.failedCount > 0 ? 'import_fail' : 'import_success',
      createdAt: new Date()
    });

    if (req.io) {
      req.io.to('admin_notifications').emit('new_notification', notification);
    }

    // Audit Log
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
    await AuditLog.create({
      admin: req.admin.username,
      action: 'CANDIDATES_BULK_IMPORT',
      ipAddress,
      metadata: { successCount: summary.successCount, failedCount: summary.failedCount }
    });

    res.json(summary);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCandidates,
  deleteCandidate,
  bulkImportCandidates
};
