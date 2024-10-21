const { app, BrowserWindow, ipcMain, Tray, Menu, screen } = require('electron');
const path = require('path');
const { attach } = require('electron-as-wallpaper');
const AutoLaunch = require('auto-launch');
const MyAppName = "Wallpepper";

const { isCurrentWindowFullScreen } = require('./FullScreenChecker');


const appDataPath = path.join(app.getPath('userData').replace('Roaming', 'Local'), 'Wallpepper.exe');

// option run when startup
let autoLaunch = new AutoLaunch({
    name: MyAppName,
    path: appDataPath,
});

autoLaunch.enable();

autoLaunch.isEnabled().then((isEnabled) => {
    if (!isEnabled) autoLaunch.enable();
}).catch((err) => console.error('Auto-launch setup error:', err));

let mainWindow;
let tray;
let galleryWindow = null; // Initialize the gallery window variable

const externalFolder = app.getPath('userData');

const isSingleInstance = app.requestSingleInstanceLock();

if (!isSingleInstance) {
    app.quit(); // If another instance exists, quit the current one
} else {
    // Handle when another instance is attempted to be opened
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        if (mainWindow) {
            mainWindow.focus(); // Focus the existing window
        }
    });
}

// Function to create the main window
function createMainWindow() {
    if (mainWindow) {
        mainWindow.focus(); // Bring the existing main window to the front
        return;
    }

    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    mainWindow = new BrowserWindow({
        width: width,
        height: height,
        frame: false,
        transparent: false,
        alwaysOnTop: false,
        movable: false,
        resizable: false,
        fullscreenable: true,
        skipTaskbar: true,
        icon: path.join(__dirname, 'src/assets/icon.ico'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            devTools: false,
        },
    });

    mainWindow.loadFile('src/index.html');
    attach(mainWindow, {
        transparent: true,
        forwardKeyboardInput: true,
        forwardMouseInput: true,
    });

    mainWindow.setIgnoreMouseEvents(true);
    mainWindow.setVisibleOnAllWorkspaces(true);

    ipcMain.on('call-void-function', (event, arg) => {
        // Send a reply to the renderer process
        event.returnValue = `${externalFolder}/videos`; // Replace 'externalFolder' with the actual data you want to send
    });

    ipcMain.on('request-fullscreen-status', (event) => {
        const fullscreenStatus = isCurrentWindowFullScreen(width, height);
        event.returnValue = fullscreenStatus; // Respond back to the renderer
    });

    

    mainWindow.on('closed', () => {
        mainWindow = null; // Dereference the main window
    });

    // console.log(`Main Window Size: Width: ${width}, Height: ${height}`);
}

// Function to create the tray icon
function createTray() {
    tray = new Tray(path.join(__dirname, 'src/assets/icon.ico'));
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Wallpepper',
            click: () => {
                openGallery();
            },
        },
        {
            label: 'Reboot',
            click: () => {
                app.relaunch(); // Relaunch the app
                app.exit();     // Quit the current process
            },
        },
        {
            label: 'Quit',
            click: () => {
                app.quit();
            },
        },
    ]);

    tray.setToolTip(MyAppName);
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        openGallery();
    });
}

// Function to open the video gallery window
function openGallery() {
    // Check if the gallery window is already open
    if (galleryWindow) {
        galleryWindow.focus(); // Bring the existing gallery window to the front
        return;
    }

    // Create the gallery window
    galleryWindow = new BrowserWindow({
        width: 800,
        height: 600,
        skipTaskbar: false,
        frame: false,
        movable: true,
        icon: path.join(__dirname, 'src/assets/icon.ico'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            devTools: false,
        },
    });
    galleryWindow.loadFile('src/gallery.html');

    // Handle video selection in the gallery
    ipcMain.on('selected-video', (event, videoPath) => {
        // Check if the main window is still open
        if (mainWindow) {
            mainWindow.webContents.send('selected-video', videoPath); // Send the selected video path to main window
        }
    });

    ipcMain.on('close-window', (event) => {
        if (galleryWindow) {
            galleryWindow.close();
        }
    });
    

    // Clean up when the gallery window is closed
    galleryWindow.on('closed', () => {
        galleryWindow = null; // Dereference the gallery window
        ipcMain.removeAllListeners('selected-video'); // Ensure no memory leaks
    });
}

// Application event handlers
app.on('ready', () => {
    createMainWindow();
    createTray(); // Create the tray icon
    // console.log(app.getAppPath());
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createMainWindow();
    }
});

