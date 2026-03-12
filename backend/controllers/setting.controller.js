const Setting = require('../models/Setting.model');

exports.getSettings = async (req, res, next) => {
  try {
    const settings = await Setting.getSettings();
    res.status(200).json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();
    res.status(200).json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
};