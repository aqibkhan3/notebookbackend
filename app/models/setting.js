const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const settingSchema = new Schema(
  {
    userId: { type: String, required: true },
    timezone: { type: String },
  },
  { collection: "Setting" }
);

const SettingModel = mongoose.model("Setting", settingSchema);

module.exports = SettingModel;
