
const { windowManager } = require('node-window-manager');
const { ipcRenderer } = require('electron');


// Function to check if the current window is full-screen or maximized within an acceptable range
function isCurrentWindowFullScreen(_width, _height) {
    const activeWindow = windowManager.getActiveWindow(); // Get the active window

    if (activeWindow) {
        const { width, height } = activeWindow.getBounds(); // Get the window dimensions
        const title = activeWindow.getTitle();

        // console.log("Name of screen: ", title);

        if (!title) {
            // console.log('No active application window (desktop or minimized).');
            // ipcRenderer.sendSync('request-fullscreen-status-reset'); // Request fullscreen status
            return false; // Return false if on desktop
        }

        // Log window and screen dimensions
        // console.log(`Window Dimensions: Width: ${width}, Height: ${height}`);
        // console.log(`Screen Dimensions: Width: ${_width}, Height: ${_height}`);

        // Calculate width and height rates
        const widthRate = (width / _width) * 100; // Rate in percentage
        const heightRate = (height / _height) * 100; // Rate in percentage

        // Check if both rates are above a certain threshold
        const isFullScreen = widthRate >= 95 && heightRate >= 95; // Acceptable if >= 95%

        // console.log(`Width Rate: ${widthRate.toFixed(2)}%, Height Rate: ${heightRate.toFixed(2)}%`);
        // console.log(`Is current window full-screen or maximized? ${isFullScreen}`);
        return isFullScreen; // Return the full-screen status
    } else {
        // console.log('No active window found.');
        return false; // Return false if no active window is found
    }
}

module.exports = { isCurrentWindowFullScreen };

