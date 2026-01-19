/**
 * Raw Data View - Displays all incoming events as-is
 * Shows: Timestamp | Latitude | Longitude
 */
class RawDataView {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.tableBody = null;
        this.init();
    }

    init() {
        this.container.innerHTML = `
            <table id="rawDataTable">
                <thead>
                    <tr>
                        <th>Timestamp</th>
                        <th>Latitude</th>
                        <th>Longitude</th>
                    </tr>
                </thead>
                <tbody id="rawDataTableBody">
                    <tr>
                        <td colspan="3" class="empty-state">Waiting for location data...</td>
                    </tr>
                </tbody>
            </table>
        `;
        this.tableBody = document.getElementById('rawDataTableBody');
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

        // Create new row
        const row = document.createElement('tr');
        row.className = 'new-row';
        
        row.innerHTML = `
            <td>${this.formatTimestamp(location.eventTime || location.timestamp)}</td>
            <td class="coordinate">${parseFloat(location.latitude).toFixed(4)}°</td>
            <td class="coordinate">${parseFloat(location.longitude).toFixed(4)}°</td>
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
    }

    /**
     * Refresh view with all buffered data
     */
    refresh(allData) {
        this.tableBody.innerHTML = '';
        
        if (allData.length === 0) {
            this.tableBody.innerHTML = '<tr><td colspan="3" class="empty-state">Waiting for location data...</td></tr>';
            return;
        }

        allData.forEach(location => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.formatTimestamp(location.eventTime || location.timestamp)}</td>
                <td class="coordinate">${parseFloat(location.latitude).toFixed(4)}°</td>
                <td class="coordinate">${parseFloat(location.longitude).toFixed(4)}°</td>
            `;
            this.tableBody.appendChild(row);
        });
    }

    /**
     * Show this view
     */
    show() {
        this.container.style.display = 'block';
        // Refresh with current data
        this.refresh(dataManager.getAllData());
    }

    /**
     * Hide this view
     */
    hide() {
        this.container.style.display = 'none';
    }
}
