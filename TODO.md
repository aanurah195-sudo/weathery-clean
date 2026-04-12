# Weather Search Fix - TODO ✅ Step 1/6

## Steps to Complete:

### 1. [x] Check/Start Server
- cd server
- npm run dev  
- Verify http://localhost:5000/api/health returns OK

### 2. [ ] Verify API Key
- Go to https://www.weatherapi.com/register.aspx → Get **FREE** key ✓
- Create/edit `server/.env`:
```
WEATHERAPI_KEY=your_actual_key_here
OPENWEATHER_API_KEY=your_owm_key_here  
```
- Restart server (`Ctrl+C`, then `npm run dev`)
- **Console MUST show:** `WAPI KEY: [your_key]`

### 3. [ ] Test Backend Search Manually  
- New terminal: `curl "http://localhost:5000/api/weather/search?q=London"`
- Expected: ` {"success":true,"data":[{"id":...` 
- If 500/error → key invalid/missing

### 4. [ ] Update SearchBar.jsx (UX improvements)
- Add loading spinner/error toast

### 5. [ ] Test Frontend End-to-End
- `cd client &amp;&amp; npm run dev`
- App → type "Lon" → London dropdown → click → weather loads

### 6. [ ] Final Debug (if needed)
- Browser F12 → Network tab → search request status/response

**⚠️ BLOCKER: Search needs WEATHERAPI_KEY. Reply "Step 2 done" + paste:**
1. server console WAPI log
2. curl result or error

**Progress: 1/6 → Need your API key setup!**


### 2. [ ] Verify API Key
- Add `WEATHERAPI_KEY=your_free_key_from_weatherapi.com` to server/.env
- Restart server
- Check server console for "WAPI KEY: [key]"

### 3. [ ] Test Backend Search Manually
- In new terminal: `curl "http://localhost:5000/api/weather/search?q=London"`
- Should return cities array

### 4. [ ] Update SearchBar.jsx (Add loading/error states)
- Edit client/src/components/SearchBar.jsx for better UX

### 5. [ ] Test Frontend
- cd client && npm run dev
- Type 'Lon' in search → see dropdown
- Select → weather updates

### 6. [ ] Debug Network Issues (if still broken)
- Browser Network tab → check /api/weather/search request status
- Fix proxy/Vite config if 404

**Next: Complete step-by-step, mark [x] when done. Reply with issues.**

