# ESP32 AI Camera

A project with:

- an Expo mobile app that fetches images from an ESP32 camera, sends them to OpenAI, and reads the result aloud
- an ESP32 camera server for the XIAO ESP32S3 Sense with a remote sleep endpoint

---

## Structure

- `mobile-app/` - Expo app
- `esp32-camera/` - Arduino sketch for ESP32 camera

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

## ESP32

The ESP32 sketch:

- connects to Wi-Fi
- serves the camera web server
- exposes `/capture`
- exposes `:82/sleep`
- enters deep sleep until BOOT is pressed

---

## 📱 Running the mobile app

    cd mobile-app
    npm install
    npx expo install expo-speech
    npx expo start

Then:

- Open **Expo Go**
- Scan the QR code

---

## 📁 Expo project structure

    mobile-app/
    └── app/
        ├── _layout.tsx
        └── index.tsx

- `_layout.tsx` → required root layout
- `index.tsx` → main app screen

---

## ⚙️ App configuration

Enter the following in the app UI:

    OpenAI API Key: sk-...
    Photo URL: http://<esp32-ip>/capture
    Sleep URL: http://<esp32-ip>:82/sleep

---

## 🔧 ESP32 Setup (XIAO ESP32S3 Sense)

### 1. Open the project

    esp32-camera/ESP32-XIAO-monologue.ino

Make sure these files are in the same folder:

- `app_httpd.cpp`
- `camera_index.h`
- `camera_pins.h`
- `board_config.h`
- `partitions.csv`

---

### 2. Install ESP32 support

In Arduino IDE:

- Go to **Preferences**
- Add:

    https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json

Then:

- Open **Boards Manager**
- Install **ESP32 by Espressif Systems**

---

### 3. Board settings

    Board: ESP32S3 Dev Module
    PSRAM: Enabled
    Flash Mode: QIO
    Partition Scheme: Huge APP

---

### 4. Configure WiFi

Edit in `.ino` file:

    const char *ssid = "YOUR_WIFI";
    const char *password = "YOUR_PASSWORD";

---

### 5. Upload

- Select correct port
- Upload sketch

---

### 6. Get device URLs

Open Serial Monitor (115200 baud)

You will see:

    Camera Ready! Use 'http://192.168.x.x' to connect

Use:

    Photo URL: http://<ip>/capture
    Sleep URL: http://<ip>:82/sleep

---

## 🔁 System flow

    ESP32 Camera → Mobile App → OpenAI → Speech Output

1. ESP32 captures image  
2. App fetches `/capture`  
3. App sends image + prompt to OpenAI  
4. Response is spoken aloud  
5. Next request is preloaded while speaking  

---

## ⚠️ Troubleshooting

### ESP32

- `Camera init failed 0x106` → wrong camera config  
- No image → open `/capture` in browser  

### Expo

- “Failed to download update” → switch Expo to **Tunnel**  
- App crashes → run `npm install`  

---

## 🧠 Notes

- Sleep endpoint:

    http://<ip>:82/sleep

- Device wakes when **BOOT button is pressed**
- `/capture` returns a single JPEG image
- `/stream` provides live video (not used in app)

---

## 🚀 Future improvements

- Auto-discover ESP32 on network (no manual IP)
- Continuous streaming mode
- On-device buffering / caching
- Battery optimisation with timed sleep cycles
