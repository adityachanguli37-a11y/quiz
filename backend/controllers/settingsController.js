const SystemSettings = require('../models/SystemSettings');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const { generateDatabaseBackups, exportAttemptsToExcel, exportAttemptsToCSV } = require('../services/importExportService');

const getSystemSettings = async (req, res, next) => {
  try {
    let settings = await SystemSettings.findOne({ key: 'system_config' });
    if (!settings) {
      settings = new SystemSettings({ key: 'system_config' });
      await settings.save();
    }
    res.json(settings);
  } catch (error) {
    next(error);
  }
};

const updateSystemSettings = async (req, res, next) => {
  try {
    const { retentionDays, backupFrequency } = req.body;

    let settings = await SystemSettings.findOne({ key: 'system_config' });
    if (!settings) {
      settings = new SystemSettings({ key: 'system_config' });
    }

    if (retentionDays !== undefined) settings.retentionDays = Number(retentionDays);
    if (backupFrequency !== undefined) settings.backupFrequency = backupFrequency;

    await settings.save();

    // Create Notification & Audit log
    const notification = await Notification.create({
      title: 'System Settings Changed',
      message: `System configurations have been updated by ${req.admin.username}`,
      type: 'settings_changed',
      createdAt: new Date()
    });
    
    if (req.io) {
      req.io.to('admin_notifications').emit('new_notification', notification);
    }

    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
    await AuditLog.create({
      admin: req.admin.username,
      action: 'SYSTEM_SETTINGS_UPDATE',
      ipAddress,
      metadata: { retentionDays, backupFrequency }
    });

    res.json(settings);
  } catch (error) {
    next(error);
  }
};

const downloadBackup = async (req, res, next) => {
  try {
    const backupData = await generateDatabaseBackups();
    
    // Audit log
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
    await AuditLog.create({
      admin: req.admin.username,
      action: 'DATABASE_BACKUP_DOWNLOAD',
      ipAddress
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=cybersecurity_quiz_backup_${Date.now()}.json`);
    res.send(JSON.stringify(backupData, null, 2));
  } catch (error) {
    next(error);
  }
};

const exportExcelAttempts = async (req, res, next) => {
  try {
    const { quizId } = req.query;
    const filter = {};
    if (quizId) filter.quiz = quizId;

    const buffer = await exportAttemptsToExcel(filter);

    // Audit log
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
    await AuditLog.create({
      admin: req.admin.username,
      action: 'CANDIDATES_EXPORT_EXCEL',
      ipAddress,
      metadata: filter
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=cybersecurity_attempts_export_${Date.now()}.xlsx`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

const exportCSVAttempts = async (req, res, next) => {
  try {
    const { quizId } = req.query;
    const filter = {};
    if (quizId) filter.quiz = quizId;

    const csvData = await exportAttemptsToCSV(filter);

    // Audit log
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
    await AuditLog.create({
      admin: req.admin.username,
      action: 'CANDIDATES_EXPORT_CSV',
      ipAddress,
      metadata: filter
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=cybersecurity_attempts_export_${Date.now()}.csv`);
    res.send(csvData);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSystemSettings,
  updateSystemSettings,
  downloadBackup,
  exportExcelAttempts,
  exportCSVAttempts
};
