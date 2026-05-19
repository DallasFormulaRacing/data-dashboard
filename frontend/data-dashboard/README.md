## 👥 UI Component Contributors mapping

The unique hashed subdirectories under `src/components/ui/` represent custom workspace layouts and premium user interface modules engineered by our core telemetry developers:

* **Anhaar Wasi:** [`30c4e3`](file:///Users/saichauhan/Desktop/DallasFormulaRacing/data-dashboard/frontend/data-dashboard/src/components/ui/30c4e3) (Sleek subteam custom Sidebars & navigation)
* **Bhuvi Thiriveedhi:** [`245d8d`](file:///Users/saichauhan/Desktop/DallasFormulaRacing/data-dashboard/frontend/data-dashboard/src/components/ui/245d8d) (Grid tiles & analytics widgets)
* **Gokul Sai Avaneesh Pulakhandam:** [`9dab3a`](file:///Users/saichauhan/Desktop/DallasFormulaRacing/data-dashboard/frontend/data-dashboard/src/components/ui/9dab3a) (Notifications & alert banner systems)
* **Shriya Shenoj:** [`42d73c`](file:///Users/saichauhan/Desktop/DallasFormulaRacing/data-dashboard/frontend/data-dashboard/src/components/ui/42d73c) (Custom metric visualization cards)
* **Sai Chauhan:** [`a29bac`](file:///Users/saichauhan/Desktop/DallasFormulaRacing/data-dashboard/frontend/data-dashboard/src/components/ui/a29bac) (Primary workspace configurations & base styling tools)

---

## ⚙️ Environment Configuration Overrides (`.env.local`)

You can control telemetry behaviors and authentication flows by modifying values in [`.env.local`](file:///Users/saichauhan/Desktop/DallasFormulaRacing/data-dashboard/frontend/data-dashboard/.env.local):

* **`NEXT_PUBLIC_BYPASS_AUTH`** (`true` / `false`):
  * Set to `true` to bypass remote OAuth verification during local frontend development and immediately access telemetry workspace grids.
* **`NEXT_PUBLIC_READ_FROM_CSV`** (`true` / `false`):
  * When `true`, enables live WebSocket telemetry feeds powered by `/ws/telemetry` instead of direct flat-file fetches.
* **`NEXT_PUBLIC_SIMULATE_TRACK_TESTING`** (`true` / `false`):
  * Only active when `NEXT_PUBLIC_READ_FROM_CSV=true`.
  * Set to `true` to enable **Live Track Testing Simulation**: The backend streams rows one by one at the custom frequency.
  * Set to `false` to enable **Bulk Historical Load**: The backend reads the entire CSV and streams all rows simultaneously as a single JSON array, quickly populating complete dashboards.
* **`NEXT_PUBLIC_SIMULATION_FREQUENCY_MS`** (integer):
  * Only active when `NEXT_PUBLIC_SIMULATE_TRACK_TESTING=true`.
  * Configures the time interval (in milliseconds) between each row generation/streaming transaction from the backend telemetry simulator.

