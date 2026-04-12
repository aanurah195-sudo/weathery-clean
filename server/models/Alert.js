import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['storm', 'flood', 'tornado', 'hurricane', 'earthquake', 'heatwave', 'blizzard', 'wildfire', 'general'],
    default: 'general'
  },
  severity: {
    type: String,
    enum: ['extreme', 'severe', 'moderate', 'minor'],
    default: 'moderate'
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  coordinates: {
    lat: Number,
    lon: Number
  },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  source: { type: String, default: 'OpenWeatherMap' },
  active: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Alert', alertSchema);