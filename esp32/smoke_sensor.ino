// ESP32 Smoke Sensor with Wi-Fi and HTTP POST
// Hardware: MQ-2 Smoke Sensor + Buzzer

#include <WiFi.h>
#include <HTTPClient.h>

// Wi-Fi Credentials (UPDATE THESE)
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Backend Server (UPDATE THIS - Use your PC's local IP)
const char* serverUrl = "http://192.168.1.100:5000/api/sensors/smoke";

// ESP32 will automatically send its MAC address - no manual configuration needed!

// Pin Configuration
int buzzerPin = 26;
int sensorPin = 32;

// Threshold and Cooldown
int smokeThreshold = 400;
unsigned long lastAlertTime = 0;
unsigned long alertCooldown = 10000; // 10 seconds

void setup() {
  Serial.begin(115200);
  pinMode(buzzerPin, OUTPUT);
  
  // Connect to Wi-Fi
  Serial.println("Connecting to Wi-Fi...");
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\n✅ Connected to Wi-Fi");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
  Serial.print("📱 ESP32 MAC Address: ");
  Serial.println(WiFi.macAddress());
  Serial.println("⚠️ IMPORTANT: Register this MAC in your Vehicle database!");
}

void loop() {
  int smokeValue = analogRead(sensorPin);

  Serial.print("Smoke Value: ");
  Serial.println(smokeValue);

  if (smokeValue > smokeThreshold) {
    Serial.println("🔥 SMOKE DETECTED!");
    digitalWrite(buzzerPin, HIGH);
    
    // Send alert to server (with cooldown)
    unsigned long currentTime = millis();
    if (currentTime - lastAlertTime > alertCooldown) {
      sendSmokeAlert(smokeValue);
      lastAlertTime = currentTime;
    }
  } else {
    digitalWrite(buzzerPin, LOW);
  }

  delay(300);
}

void sendSmokeAlert(int value) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    
    // Get ESP32's unique MAC address
    String macAddress = WiFi.macAddress();
    
    // Create JSON payload
    String payload = "{";
    payload += "\"sensorMac\":\"" + macAddress + "\",";
    payload += "\"value\":" + String(value);
    payload += "}";
    
    Serial.println("📡 Sending alert to server...");
    Serial.println(payload);
    
    int httpResponseCode = http.POST(payload);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.print("✅ Server Response: ");
      Serial.println(response);
    } else {
      Serial.print("❌ Error: ");
      Serial.println(httpResponseCode);
    }
    
    http.end();
  } else {
    Serial.println("⚠️ Wi-Fi Disconnected");
  }
}
