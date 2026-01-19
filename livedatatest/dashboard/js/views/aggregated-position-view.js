/**
 * Aggregated Position View - Aggregates data into 5-minute windows with averages
 * Shows: Window Start | Window End | Avg Latitude | Avg Longitude
 */
class AggregatedPositionView {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.tableBody = null;
        this.windowSizeMs = 5 * 60 * 1000; // 5 minutes in milliseconds
        this.windows = new Map(); // Map of window start time -> { sumLat, sumLon, count }
        this.init();
    }

    init() {
        this.container.innerHTML = `
            <table id="aggregatedPositionTable">
                <thead>
                    <tr>
                        <th>Window Start</th>
                        <th>Window End</th>
                        <th>Avg Latitude</th>
                        <th>Avg Longitude</th>
                    </tr>
                </thead>
                <tbody id="aggregatedPositionTableBody">
                    <tr>
                        <td colspan="4" class="empty-state">Waiting for location data...</td>
                    </tr>
                </tbody>
            </table>
        `;
        this.tableBody = document.getElementById('aggregatedPositionTableBody');
    }

    /**
     * Get window start time for a given timestamp
     */
    getWindowStart(timestamp) {
        const date = new Date(timestamp);
        const timeMs = date.getTime();
        // Round down to nearest 5-minute window
        return new Date(Math.floor(timeMs / this.windowSizeMs) * this.windowSizeMs);
    }

    /**
     * Get window end time for a given window start
     */
    getWindowEnd(windowStart) {
        return new Date(windowStart.getTime() + this.windowSizeMs);
    }

    /**
     * Format timestamp for display
     */
    formatTimestamp(timestamp) {
        if (!timestamp) return 'N/A';
        try {
            const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
            return date.toLocaleString();
        } catch (e) {
            return timestamp;
        }
    }

    /**
     * Handle new data event
     */
    onDataReceived(location) {
        const timestamp = location.eventTime || location.timestamp;
        const windowStart = this.getWindowStart(timestamp);
        const windowKey = windowStart.getTime();
        const lat = parseFloat(location.latitude);
        const lon = parseFloat(location.longitude);

        // Update window aggregation
        const window = this.windows.get(windowKey) || { sumLat: 0, sumLon: 0, count: 0 };
        window.sumLat += lat;
        window.sumLon += lon;
        window.count += 1;
        this.windows.set(windowKey, window);

        // Refresh the display
        this.refresh();
    }

    /**
     * Refresh view with all windows
     */
    refresh() {
        // Rebuild windows from all buffered data
        this.windows.clear();
        const allData = dataManager.getAllData();

        allData.forEach(location => {
            const timestamp = location.eventTime || location.timestamp;
            const windowStart = this.getWindowStart(timestamp);
            const windowKey = windowStart.getTime();
            const lat = parseFloat(location.latitude);
            const lon = parseFloat(location.longitude);

            const window = this.windows.get(windowKey) || { sumLat: 0, sumLon: 0, count: 0 };
            window.sumLat += lat;
            window.sumLon += lon;
            window.count += 1;
            this.windows.set(windowKey, window);
        });

        // Clear table
        this.tableBody.innerHTML = '';

        if (this.windows.size === 0) {
            this.tableBody.innerHTML = '<tr><td colspan="4" class="empty-state">Waiting for location data...</td></tr>';
            return;
        }

        // Sort windows by start time (newest first)
        const sortedWindows = Array.from(this.windows.entries())
            .sort((a, b) => b[0] - a[0]); // Sort descending (newest first)

        sortedWindows.forEach(([windowStartMs, window]) => {
            const windowStart = new Date(windowStartMs);
            const windowEnd = this.getWindowEnd(windowStart);
            const avgLat = window.sumLat / window.count;
            const avgLon = window.sumLon / window.count;
            
            const row = document.createElement('tr');
            row.className = 'new-row';
            row.innerHTML = `
                <td>${this.formatTimestamp(windowStart)}</td>
                <td>${this.formatTimestamp(windowEnd)}</td>
                <td class="coordinate">${avgLat.toFixed(4)}°</td>
                <td class="coordinate">${avgLon.toFixed(4)}°</td>
            `;
            this.tableBody.appendChild(row);

            // Remove animation class after animation completes
            setTimeout(() => {
                row.classList.remove('new-row');
            }, 300);
        });
    }

    /**
     * Show this view
     */
    show() {
        this.container.style.display = 'block';
        this.refresh();
    }

    /**
     * Hide this view
     */
    hide() {
        this.container.style.display = 'none';
    }
}
