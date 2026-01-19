/**
 * Data Manager - Shared WebSocket connection and data buffer
 * Manages the single WebSocket connection and maintains a buffer of recent events
 */
class DataManager {
    constructor() {
        this.ws = null;
        this.dataBuffer = []; // Buffer of last 100 events
        this.maxBufferSize = 100;
        this.listeners = []; // View update listeners
        this.statusCallback = null;
    }

    /**
     * Register a callback for status updates
     */
    onStatusUpdate(callback) {
        this.statusCallback = callback;
    }

    /**
     * Register a view listener that will be notified of new data
     */
    addListener(listener) {
        this.listeners.push(listener);
    }

    /**
     * Remove a view listener
     */
    removeListener(listener) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }

    /**
     * Notify all listeners of new data
     */
    notifyListeners(data) {
        this.listeners.forEach(listener => {
            if (listener && typeof listener === 'function') {
                listener(data);
            }
        });
    }

    /**
     * Add data to buffer and notify listeners
     */
    addData(location) {
        // Add to beginning of buffer
        this.dataBuffer.unshift(location);

        // Keep only last maxBufferSize events
        if (this.dataBuffer.length > this.maxBufferSize) {
            this.dataBuffer = this.dataBuffer.slice(0, this.maxBufferSize);
        }

        // Notify all listeners
        this.notifyListeners(location);
    }

    /**
     * Get all buffered data
     */
    getAllData() {
        return [...this.dataBuffer];
    }

    /**
     * Connect to WebSocket
     */
    connectWebSocket() {
        const wsUrl = `ws://${window.location.host}/ws`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('WebSocket connected');
            if (this.statusCallback) {
                this.statusCallback('Connected - Receiving live data', 'connected');
            }
        };

        this.ws.onmessage = (event) => {
            try {
                const location = JSON.parse(event.data);
                this.addData(location);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            if (this.statusCallback) {
                this.statusCallback('WebSocket error - Attempting to reconnect...', 'disconnected');
            }
        };

        this.ws.onclose = () => {
            console.log('WebSocket disconnected');
            if (this.statusCallback) {
                this.statusCallback('Disconnected - Attempting to reconnect...', 'disconnected');
            }
            
            // Attempt to reconnect after 3 seconds
            setTimeout(() => this.connectWebSocket(), 3000);
        };
    }

    /**
     * Get current connection status
     */
    isConnected() {
        return this.ws && this.ws.readyState === WebSocket.OPEN;
    }
}

// Create singleton instance
const dataManager = new DataManager();
