// ✅ EXACT STEPS FOR server/index.js

// 1. Make sure you have these imports at the top:
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import weatherRoutes from './routes/weatherRoutes.js';  // ← ADD THIS LINE

// 2. Load environment variables
dotenv.config();

// 3. Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// 4. Middleware
app.use(cors());
app.use(express.json());

// 5. Connect to MongoDB (you probably have this)
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.log('❌ MongoDB error:', err));

// 6. ⭐️ ADD THIS ROUTE - This is what makes search work:
app.use('/api/weather', weatherRoutes);

// 7. Other routes (if you have them)
// app.use('/api/alerts', alertRoutes);
// etc.

// 8. Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ success: false, message: err.message });
});

// 9. Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║  🌦️  Weather API Server                        ║
╠════════════════════════════════════════════════╣
║  Server running at http://localhost:${PORT}    ║
║  Database: ${process.env.MONGO_URI ? '✅' : '❌'}                           ║
║  OpenWeather API: ${process.env.OPENWEATHER_API_KEY ? '✅' : '❌'}                ║
║  WeatherAPI: ${process.env.WEATHERAPI_KEY ? '✅' : '❌'}                      ║
╚════════════════════════════════════════════════╝
  `);
});

export default app;