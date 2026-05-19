![DFR Banner](/41f516e4-144a-403b-853b-c0b7b284e3fc.png)
# Data Dashboard
### Engineering Frontend and Data Visualization

PM - [Sai Chauhan](https://discord.com/users/342061974600810506)

### 👥 Contributors
* [Arjun Nayak](https://discord.com/users/143942073639239681)
#### Back-end
* [Prakrit Chauhan](https://discord.com/users/701425922535850035)
* [Saiesh Kesireddy](https://discord.com/users/349665003697340417)
#### Front-end
* [Anhaar Wasi](https://discord.com/users/431574165884108804)
* [Bhuvi Thiriveedhi](https://discord.com/users/1004910909250093056)

### 🚀 Description
The **Web Dashboard** is a comprehensive platform designed for the analysis and visualization of racing session data. It integrates with a PostgreSQL database to provide advanced tools for quadrant analysis, driver comparisons, and live session dashboards.

The platform enables team members to examine entire sessions, allowing drivers and engineers to make data-driven decisions that optimize performance. The project is developed using modern web technologies to ensure a responsive, efficient, and user-friendly experience.

### 🏗️ Architecture
* **Front-end:** Next.js with shadcn/ui and Recharts (Tailwind CSS)
  * ✨ Interactive, responsive dashboard utilizing GridStack.js for custom drag-and-drop tiles.
  * 📊 **Telemetry Buffer Hook:** Custom `useCsvDataset` React hook with live WebSocket listeners, maintaining a sliding-window data cache (500 data points) to populate charts smoothly in real time.
* **Back-end:** FastAPI (Python) & SQLAlchemy
  * 🐍 Modern asynchronous backend managing API endpoints, Discord OAuth2 user authentication, and persistent user-specific presets in a PostgreSQL database.
  * 🔌 **WebSocket Real-Time Stream Engine:** High-performance `/ws/telemetry` WebSocket routing supporting dual modes (dynamic telemetry track simulation via automated row-by-row CSV generators, or bulk-array historical loading when streaming is disabled).
  * 🏁 **DFR Subteam Grid Presets:** Pre-engineered telemetry layouts with custom-fit dashboards (Engine RPM, G-forces, APPS/BPS sensor logs, drive-by-wire calibration, etc.) customized for all 11 subteams: *Aerodynamics, Ergonomics, Manufacturing, Powertrain, Software, Suspension/Steering, Electrical, Composites, Driver, Embedded, and Battery*.

### 💡 Key Features
* **Live Data Visualization:** Real-time monitoring of RPM, Speed, and Engine Temperature with line graphs and dials for rapid comparison.
* **Driver & Track Comparison:** Overlay graphs for driver or track comparisons to evaluate performance.
* **AI Analysis Mode:** Advanced AI-driven insights for deeper session analysis.
* **User Preferences & Collaboration:** Personalized dashboards and the ability for users to add notes and comments for team collaboration.
* **Detection & Alerts:** Identify vehicle issues such as damage or pit stops.
* **Lap Time Estimation:** Predict lap times for new routes or tracks.

### 🎯 Objective
To provide a platform that supports data-driven performance optimization in racing sessions, enabling teams to make informed decisions and improve overall efficiency and outcomes.

## 🚀 Running Locally
### Frontend
```bash
cd frontend/data-dashboard
npm -v
npm install
npm run dev
```

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn updated_app:app --port 8080 --reload
```
Ensure the .env file in backend is updated with the correct database credentials before serving the application.
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.