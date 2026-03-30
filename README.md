# ESP32 AI Camera

A project with:

- an Expo mobile app that fetches images from an ESP32 camera, sends them to OpenAI, and reads the result aloud
- an ESP32 camera server for the XIAO ESP32S3 Sense with a remote sleep endpoint

## Structure

- `mobile-app/` - Expo app
- `esp32-camera/` - Arduino sketch for ESP32 camera

## Mobile app

The app:
- fetches a still image from the ESP32 `/capture` URL
- sends the image and prompt to OpenAI
- reads the returned text using `expo-speech`
- can send a sleep command to the ESP32

Expected URLs:
- Photo URL: `http://<esp32-ip>/capture`
- Sleep URL: `http://<esp32-ip>:82/sleep`

## ESP32

The ESP32 sketch:
- connects to Wi-Fi
- serves the camera web server
- exposes `/capture`
- exposes `:82/sleep`
- enters deep sleep until BOOT is pressed

## Running the mobile app

```bash
cd mobile-app
npm install
npx expo install expo-speech
npx expo start
