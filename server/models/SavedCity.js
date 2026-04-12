import mongoose from 'mongoose';

const savedCitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  country: { type: String, required: true },
  lat: { type: Number, required: true },
  lon: { type: Number, required: true },
  addedAt: { type: Date, default: Date.now }
});

export default mongoose.model('SavedCity', savedCitySchema);