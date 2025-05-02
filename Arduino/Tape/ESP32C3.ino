#include <Wire.h>
#include <AS5600.h>
#include <Adafruit_NeoPixel.h>
#include <WiFi.h>
#include <PubSubClient.h>

// --- WiFi + MQTT ---
const char* ssid = "DylanWiFi";
const char* password = "82339494";
const char* mqtt_server = "192.168.68.90";
WiFiClient espClient;
PubSubClient client(espClient);

// --- AS5600 setup ---
AS5600 as5600;
const float stepToMM = 100.0 / 2053.0;
bool reverseDirection = false;
int32_t zeroOffset = 0;

// --- NeoPixel setup ---
#define NEOPIXEL_PIN 5
#define NUM_PIXELS 1
Adafruit_NeoPixel pixels(NUM_PIXELS, NEOPIXEL_PIN, NEO_GRB + NEO_KHZ800);

// --- Control pins ---
const int resetButtonPin = 3;

// --- State tracking ---
int32_t lastSentMM = -99999;
uint8_t currentR = 0, currentG = 255, currentB = 0;  // start with green
unsigned long lastPublishTime = 0;
const unsigned long minPublishInterval = 100; // ms

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  if (strcmp(topic, "tape/led") == 0) {
    String msg;
    for (int i = 0; i < length; i++) msg += (char)payload[i];
    Serial.print("LED MQTT message: ");
    Serial.println(msg);

    int r, g, b;
    if (sscanf(msg.c_str(), "{\"r\":%d,\"g\":%d,\"b\":%d}", &r, &g, &b) == 3) {
      currentR = r; currentG = g; currentB = b;
      pixels.setPixelColor(0, pixels.Color(currentR, currentG, currentB));
      pixels.show();
    }
  }
}

void setup() {
  Serial.begin(115200);
  Wire.begin(8, 9);
  pinMode(resetButtonPin, INPUT_PULLUP);

  pixels.begin();
  pixels.setBrightness(50);
  pixels.clear();
  pixels.show();

  // Start WiFi with blinking red LED
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    blinkLED(pixels.Color(255, 0, 0), 100);
    delay(500);
  }
  Serial.println("✅ WiFi connected");

  // MQTT connect
  client.setServer(mqtt_server, 1883);
  client.setCallback(mqttCallback);
  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");
    if (client.connect("esp32-tape")) {
      Serial.println("connected");
      client.subscribe("tape/led");
    } else {
      Serial.print("failed, rc=");
      Serial.println(client.state());
      delay(1000);
    }
  }

  // AS5600 setup
  if (!as5600.begin()) {
    Serial.println("AS5600 not detected!");
    while (1);
  }
  delay(300);
  as5600.readAngle();
  zeroOffset = as5600.getCumulativePosition();
  Serial.println("Startup: tape set to 0 mm");

  // Solid green once fully connected
  pixels.setPixelColor(0, pixels.Color(currentR, currentG, currentB));
  pixels.show();
}

void loop() {
  client.loop();

  static bool buttonPressed = false;

  if (Serial.available()) {
    char input = Serial.read();
    if (input == 'r' || input == 'R') {
      resetTape("Serial reset to 0 mm");
    }
  }

  if (digitalRead(resetButtonPin) == LOW) {
    if (!buttonPressed) {
      resetTape("Button reset to 0 mm");
      buttonPressed = true;
    }
  } else {
    buttonPressed = false;
  }

  as5600.readAngle();
  int32_t steps = as5600.getCumulativePosition() - zeroOffset;
  if (reverseDirection) steps *= -1;

  float tapeLengthMM = steps * stepToMM;
  int32_t mmInt = round(tapeLengthMM);

  // Highlight 0mm zone (±5mm) in green
  if (abs(mmInt) <= 5) {
    pixels.setPixelColor(0, pixels.Color(0, 255, 0));
    pixels.show();
  } else {
    pixels.setPixelColor(0, pixels.Color(currentR, currentG, currentB));
    pixels.show();
  }

  // Publish only on mm change and if enough time has passed
  unsigned long now = millis();
  if (mmInt != lastSentMM && (now - lastPublishTime >= minPublishInterval)) {
    lastSentMM = mmInt;
    lastPublishTime = now;
    char buffer[16];
    snprintf(buffer, sizeof(buffer), "%ld", mmInt);
    client.publish("tape/position", buffer);

    Serial.print("📏 Tape: ");
    Serial.print(mmInt);
    Serial.println(" mm");
  }

  delay(20); // smooth polling
}

void resetTape(const char* message) {
  as5600.readAngle();
  zeroOffset = as5600.getCumulativePosition();
  pixels.setPixelColor(0, pixels.Color(0, 255, 0)); // green
  pixels.show();
  Serial.println(message);
  lastSentMM = -99999;  // force re-publish
  lastPublishTime = 0;
}

void blinkLED(uint32_t color, int interval) {
  pixels.setPixelColor(0, color);
  pixels.show();
  delay(interval);
  pixels.clear();
  pixels.show();
  delay(interval);
}