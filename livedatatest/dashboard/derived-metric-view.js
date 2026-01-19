/**
 * Derived Metric View - Calculates movement delta between consecutive events
 * Shows: Timestamp | Latitude | Longitude | Δ Distance
 */
class DerivedMetricView {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.tableBody = null;
        this.lastLocation = null;
        this.init();
    }

    init() {
        this.container.innerHTML = `
            <table id="derivedMetricTable">
                <thead>
                    <tr>
                        <th>Timestamp</th>
                        <th>Latitude</th>
                        <th>Longitude</th>
                        <th>Δ Distance (km)</th>
                    </tr>
                </thead>
                <tbody id="derivedMetricTableBody">
                    <tr>
                        <td colspan="4" class="empty-state">Waiting for location data...</td>
                    </tr>
                </tbody>
            </table>
        `;
        this.tableBody = document.getElementById('derivedMetricTableBody');
    }

    /**
     * Calculate distance between two coordinates using Haversine formula approximation
     * Returns distance in kilometers
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Convert degrees to radians
     */
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Format timestamp for display
     */
    formatTimestamp(timestamp) {
        if (!timestamp) return 'N/A';
        try {
            const date = new Date(timestamp);
            return date.toLocaleString();
        } catch (e) {
            return timestamp;
        }
    }

    /**
     * Handle new data event
     */
    onDataReceived(location) {
        // Remove empty state if present
        const emptyRow = this.tableBody.querySelector('.empty-state');
        if (emptyRow) {
            emptyRow.remove();
        }

        const lat = parseFloat(location.latitude);
        const lon = parseFloat(location.longitude);
        let deltaDistance = '—'; // Default for first event

        // Calculate delta if we have a previous location
        if (this.lastLocation) {
            const prevLat = parseFloat(this.lastLocation.latitude);
            const prevLon = parseFloat(this.lastLocation.longitude);
            const distance = this.calculateDistance(prevLat, prevLon, lat, lon);
            deltaDistance = distance.toFixed(2);
        }

        // Create new row
        const row = document.createElement('tr');
        row.className = 'new-row';
        
        row.innerHTML = `
            <td>${this.formatTimestamp(location.eventTime || location.timestamp)}</td>
            <td class="coordinate">${lat.toFixed(4)}°</td>
            <td class="coordinate">${lon.toFixed(4)}°</td>
            <td class="coordinate">${deltaDistance}</td>
        `;

        // Insert at the top
        this.tableBody.insertBefore(row, this.tableBody.firstChild);

        // Remove animation class after animation completes
        setTimeout(() => {
            row.classList.remove('new-row');
        }, 300);

        // Keep only latest 100 rows
        const rows = this.tableBody.querySelectorAll('tr');
        if (rows.length > 100) {
            rows[rows.length - 1].remove();
        }

        // Update last location
        this.lastLocation = location;
    }

    /**
     * Refresh view with all buffered data
     */
    refresh(allData) {
        this.tableBody.innerHTML = '';
        
        if (allData.length === 0) {
            this.tableBody.innerHTML = '<tr><td colspan="4" class="empty-state">Waiting for location data...</td></tr>';
            this.lastLocation = null;
            return;
        }

        // Process data from newest to oldest (as stored)
        // For each event, calculate delta from the next (older) event
        const rows = [];
        
        for (let i = 0; i < allData.length; i++) {
            const location = allData[i];
            const lat = parseFloat(location.latitude);
            const lon = parseFloat(location.longitude);
            let deltaDistance = '—';

            // Calculate delta from the previous (older) event
            if (i < allData.length - 1) {
                const prevLocation = allData[i + 1]; // Next in array is older
                const prevLat = parseFloat(prevLocation.latitude);
                const prevLon = parseFloat(prevLocation.longitude);
                const distance = this.calculateDistance(prevLat, prevLon, lat, lon);
                deltaDistance = distance.toFixed(2);
            }

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.formatTimestamp(location.eventTime || location.timestamp)}</td>
                <td class="coordinate">${lat.toFixed(4)}°</td>
                <td class="coordinate">${lon.toFixed(4)}°</td>
                <td class="coordinate">${deltaDistance}</td>
            `;
            rows.push(row);
        }

        // Append rows in order (newest first)
        rows.forEach(row => this.tableBody.appendChild(row));

        // Update last location for future calculations
        this.lastLocation = allData[0];
    }

    /**
     * Show this view
     */
    show() {
        this.container.style.display = 'block';
        this.refresh(dataManager.getAllData());
    }

    /**
     * Hide this view
     */
    hide() {
        this.container.style.display = 'none';
    }
}
