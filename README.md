# ESP32 AI Camera

A project with:

- an Expo mobile app that fetches images from an ESP32 camera, sends them to OpenAI, and reads the result aloud
- an ESP32 camera server for the XIAO ESP32S3 Sense with a remote sleep endpoint

---

## Structure

- `mobile-app/` - Expo app
- `esp32-camera/` - Arduino sketch for ESP32 camera

---

## Expo app setup

### 1. Create the Expo app

Open a terminal and run:

npx create-expo-app mobile-app
cd mobile-app

### 2. Install the required package

npx expo install expo-speech

### 3. Create the app folder and screen file

Inside `mobile-app`, make sure you have this structure:

mobile-app/
└── app/
    └── index.tsx

Important:

- Put `index.tsx` inside the `app/` folder
- Do not leave `index.tsx` in the project root
- Expo Router expects app screens inside the `app/` folder

If your project does not already contain an `app` folder, create it manually.

### 4. Replace `app/index.tsx` with your app code

Put your Expo app code into:

mobile-app/app/index.tsx

### 5. Install dependencies and start the app

Run:

npm install
npx expo start

Then:

- Open Expo Go on your phone
- Scan the QR code

If Expo has connection issues, switch the connection mode to Tunnel.

---

## Mobile app

The app:

- fetches a still image from the ESP32 `/capture` URL
- sends the image and prompt to OpenAI
- reads the returned text using `expo-speech`
- can send a sleep command to the ESP32

Expected URLs:

- Photo URL: `http://<esp32-ip>/capture`
- Sleep URL: `http://<esp32-ip>:82/sleep`

---

## App configuration

Enter the following in the app UI:

OpenAI API Key: sk-...
Photo URL: http://<esp32-ip>/capture
Sleep URL: http://<esp32-ip>:82/sleep

---

## ESP32 Setup (XIAO ESP32S3 Sense)

### 1. Open the Arduino project

Open:

esp32-camera/ESP32-XIAO-monologue.ino

Make sure these files are in the same folder as the `.ino` file:

- `app_httpd.cpp`
- `camera_index.h`
- `camera_pins.h`
- `board_config.h`
- `partitions.csv`

---

### 2. Install ESP32 board support

In Arduino IDE:

- Go to File → Preferences
- Open Tools → Board → Boards Manager
- Search for ESP32
- Install ESP32 by Espressif Systems

---

### 3. Arduino IDE settings

Set these before uploading:

Board: ESP32S3 Dev Module
Upload Speed: 921600
USB Mode: Hardware CDC and JTAG
USB CDC On Boot: Enabled
USB Firmware MSC On Boot: Disabled
USB DFU On Boot: Disabled
CPU Frequency: 240MHz (WiFi)
Flash Mode: QIO 80MHz
Flash Size: 8MB
Partition Scheme: Huge APP
PSRAM: OPI PSRAM
Core Debug Level: None
Erase All Flash Before Sketch Upload: Disabled
JTAG Adapter: Disabled
Events Run On: Core 1
Arduino Runs On: Core 1

If your Arduino IDE shows slightly different names, choose the closest matching option.

---

### 4. Configure Wi-Fi in the Arduino code

Edit this in the `.ino` file:

const char *ssid = "YOUR_WIFI";
const char *password = "YOUR_PASSWORD";

---

### 5. Upload

- Select the correct port
- Connect the board by USB
- Click Upload

If upload fails, try holding the BOOT button as upload starts.

---

### 6. Get device URLs

Open Serial Monitor at:

115200 baud

You should see:

Camera Ready! Use 'http://192.168.x.x' to connect

Use:

Photo URL: http://<ip>/capture
Sleep URL: http://<ip>:82/sleep

---

## System flow

ESP32 Camera → Mobile App → OpenAI → Speech Output

1. ESP32 captures image
2. App fetches /capture
3. App sends image + prompt to OpenAI
4. Response is spoken aloud
5. App can send /sleep when needed

---

## Troubleshooting

ESP32

- Camera init failed 0x106 → wrong board, PSRAM, or camera settings
- No image → open http://<ip>/capture in a browser
- Upload issues → check port and try holding BOOT

Expo

- Failed to download update → switch Expo to Tunnel
- App does not load correctly → make sure `index.tsx` is inside the `app/` folder
- Expo package issues → run `npm install`

---

## Notes

- Sleep endpoint: http://<ip>:82/sleep
- Device wakes when BOOT button is pressed
- /capture returns a single JPEG image
- /stream is live video and is not used by the app
