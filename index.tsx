import * as Speech from "expo-speech";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function Home() {
  const [apiKey, setApiKey] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [sleepUrl, setSleepUrl] = useState("");
  const [prompt, setPrompt] = useState(
    "You are my internal monologue. What do you think looking at this?"
  );
  const [intervalSeconds, setIntervalSeconds] = useState("5");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runningRef = useRef(false);
  const busyRef = useRef(false);

  async function imageUrlToBase64(url: string): Promise<string> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Image fetch failed: ${response.status}`);
    }

    const blob = await response.blob();

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        try {
          const fileResult = reader.result;

          if (typeof fileResult !== "string") {
            reject(new Error("Could not read image as base64"));
            return;
          }

          const parts = fileResult.split(",");
          if (parts.length < 2) {
            reject(new Error("Invalid base64 image data"));
            return;
          }

          resolve(parts[1]);
        } catch (error) {
          reject(
            new Error(
              error instanceof Error ? error.message : "Base64 conversion failed"
            )
          );
        }
      };

      reader.onerror = () => {
        reject(new Error("FileReader failed"));
      };

      reader.readAsDataURL(blob);
    });
  }

  async function speakAndWait(text: string): Promise<void> {
    return await new Promise<void>((resolve) => {
      try {
        Speech.speak(text, {
          onDone: () => resolve(),
          onStopped: () => resolve(),
          onError: () => resolve(),
        });
      } catch {
        resolve();
      }
    });
  }

  async function fetchThoughtOnce(): Promise<string> {
    const trimmedPhotoUrl = photoUrl.trim();
    const trimmedApiKey = apiKey.trim();

    if (!trimmedPhotoUrl) {
      throw new Error("Photo URL is empty");
    }

    if (
      !trimmedPhotoUrl.startsWith("http://") &&
      !trimmedPhotoUrl.startsWith("https://")
    ) {
      throw new Error("Photo URL must start with http:// or https://");
    }

    if (!trimmedApiKey) {
      throw new Error("OpenAI API key is empty");
    }

    setStatus("Fetching image...");
    const base64 = await imageUrlToBase64(trimmedPhotoUrl);

    setStatus("Thinking...");

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${trimmedApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: prompt,
              },
              {
                type: "input_image",
                image_url: `data:image/jpeg;base64,${base64}`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      setStatus("");
      throw new Error(`OpenAI error ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    const text =
      data.output_text ||
      data.output?.[0]?.content?.find(
        (item: any) => item?.type === "output_text"
      )?.text ||
      "No response text returned.";

    setStatus("");
    return text;
  }

  async function captureOnce() {
    if (busyRef.current) return;

    busyRef.current = true;
    setLoading(true);

    try {
      const text = await fetchThoughtOnce();
      setResult(text);
      await speakAndWait(text);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      setStatus("");
      setResult(`Error: ${message}`);
    } finally {
      busyRef.current = false;
      setLoading(false);
    }
  }

  async function loopCapture() {
    if (busyRef.current) return;

    busyRef.current = true;
    setLoading(true);

    try {
      const seconds = Math.max(
        2,
        Number.parseInt(intervalSeconds || "5", 10) || 5
      );

      let currentText = await fetchThoughtOnce();

      while (runningRef.current) {
        setResult(currentText);

        const nextPromise = (async () => {
          if (!runningRef.current) return null;

          if (seconds > 0) {
            await new Promise((resolve) =>
              setTimeout(resolve, seconds * 1000)
            );
          }

          if (!runningRef.current) return null;

          return await fetchThoughtOnce();
        })();

        await speakAndWait(currentText);

        if (!runningRef.current) {
          break;
        }

        const nextText = await nextPromise;

        if (!runningRef.current || !nextText) {
          break;
        }

        currentText = nextText;
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      setStatus("");
      setResult(`Error: ${message}`);
      runningRef.current = false;
      setRunning(false);
    } finally {
      busyRef.current = false;
      setLoading(false);
      setStatus("");

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  }

  function startLoop() {
    if (runningRef.current) return;

    runningRef.current = true;
    setRunning(true);
    loopCapture();
  }

  function stopLoop() {
    runningRef.current = false;
    setRunning(false);
    setStatus("");

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    try {
      Speech.stop();
    } catch {
      // Ignore speech stop errors
    }
  }

  async function sleepEsp32() {
    try {
      const trimmedSleepUrl = sleepUrl.trim();

      if (!trimmedSleepUrl) {
        throw new Error("Sleep URL is empty");
      }

      if (
        !trimmedSleepUrl.startsWith("http://") &&
        !trimmedSleepUrl.startsWith("https://")
      ) {
        throw new Error("Sleep URL must start with http:// or https://");
      }

      setLoading(true);
      setStatus("Sending sleep command...");

      const response = await fetch(trimmedSleepUrl);

      if (!response.ok) {
        throw new Error(`Sleep request failed: ${response.status}`);
      }

      const text = await response.text();
      setStatus("");
      setResult(text || "ESP32 sleeping");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown sleep error";
      setStatus("");
      setResult(`Sleep error: ${message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>ESP32 AI Camera</Text>

      <Text style={styles.label}>OpenAI API Key</Text>
      <TextInput
        style={styles.input}
        value={apiKey}
        onChangeText={setApiKey}
        placeholder="Enter your OpenAI API key"
        placeholderTextColor="#777"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
      />

      <Text style={styles.label}>Photo URL</Text>
      <TextInput
        style={styles.input}
        value={photoUrl}
        onChangeText={setPhotoUrl}
        placeholder="http://<esp32-ip>/capture"
        placeholderTextColor="#777"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
      />

      <Text style={styles.label}>Sleep URL</Text>
      <TextInput
        style={styles.input}
        value={sleepUrl}
        onChangeText={setSleepUrl}
        placeholder="http://<esp32-ip>:82/sleep"
        placeholderTextColor="#777"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
      />

      <Text style={styles.label}>Prompt</Text>
      <TextInput
        style={[styles.input, styles.multilineInput]}
        value={prompt}
        onChangeText={setPrompt}
        multiline
      />

      <Text style={styles.label}>Loop interval (seconds)</Text>
      <TextInput
        style={styles.input}
        value={intervalSeconds}
        onChangeText={setIntervalSeconds}
        keyboardType="numeric"
        placeholder="5"
        placeholderTextColor="#777"
      />

      <View style={styles.spacer} />
      <Button title="Capture Once" onPress={captureOnce} disabled={loading} />

      <View style={styles.spacer} />
      <Button
        title={running ? "Stop Loop" : "Start Loop"}
        onPress={running ? stopLoop : startLoop}
        disabled={loading && !running}
      />

      <View style={styles.spacer} />
      <Button title="Sleep ESP32" onPress={sleepEsp32} disabled={loading} />

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>Working...</Text>
        </View>
      ) : null}

      {status ? <Text style={styles.status}>{status}</Text> : null}

      <Text style={styles.resultTitle}>Result</Text>
      <Text style={styles.result}>{result || "Nothing yet."}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: "#111",
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 20,
  },
  label: {
    color: "#ccc",
    marginTop: 10,
    marginBottom: 6,
    fontSize: 14,
  },
  input: {
    backgroundColor: "#222",
    color: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  spacer: {
    height: 16,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    gap: 10,
  },
  loadingText: {
    color: "#ccc",
  },
  status: {
    color: "#aaa",
    marginTop: 12,
    fontStyle: "italic",
  },
  resultTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 24,
    marginBottom: 8,
  },
  result: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 22,
    paddingBottom: 30,
  },
});