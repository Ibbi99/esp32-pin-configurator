#include "WiFi.h"
#include "SPIFFS.h"
#include "ESPAsyncWebServer.h"
#include <ArduinoJson.h>

#define ledPin 2
#define adcPin 34

const char *ssid = "internet";
const char *password = "12345678";

char *ledState = "OFF";

AsyncWebServer server(80);
AsyncWebSocket ws("/ws");
AsyncWebSocketClient *globalClient = NULL;

void notifyClient()
{
  ws.textAll(ledState);  
}

void handleJson(const String &msg)
{
  StaticJsonDocument<200> doc;
  DeserializationError err = deserializeJson(doc, msg);

  if(err)
  {
    Serial.println("Json parse failed.");
    return;
  }

  for (JsonPair kv : doc.as<JsonObject>()) {
    const char* pinName = kv.key().c_str();
    JsonObject cfg = kv.value().as<JsonObject>();

    Serial.printf("Config for %s:\n", pinName);
    if (cfg.containsKey("mode"))
      Serial.printf("  Mode: %s\n", cfg["mode"].as<const char*>());
    if (cfg.containsKey("function"))
      Serial.printf("  Function: %s\n", cfg["function"].as<const char*>());
    if (cfg.containsKey("frequency"))
      Serial.printf("  PWM Frequency: %d\n", cfg["frequency"].as<int>());
    if (cfg.containsKey("dutyCycle"))
      Serial.printf("  PWM Duty: %f\n", cfg["dutyCycle"].as<float>());

    if (strcmp(pinName, "GPIO 2") == 0 && cfg["mode"] == "output")
    {
        if (cfg["function"] == "gpio")
        {
          digitalWrite(2, HIGH);
        }
    }
  }
}

void onWsEvent(AsyncWebSocket *server, AsyncWebSocketClient *client,
               AwsEventType type, void *arg, uint8_t *data, size_t len)
{
  if (type == WS_EVT_CONNECT)
  {
    Serial.println("Websocket client connection received");
    globalClient = client;
  }
  else if (type == WS_EVT_DISCONNECT)
  {
    Serial.println("Websocket client connection finished");
    globalClient = NULL;
  }
  else if (type == WS_EVT_DATA)
  {
    String msg;
    for(size_t i = 0; i < len; i++) msg += (char)data[i];
    Serial.println("Received: " + msg);
  
    if (msg.startsWith("{"))
    {
      StaticJsonDocument<200> doc;
      DeserializationError err = deserializeJson(doc, msg);
      if (!err)
      {
        const char* action = doc["action"];
        const char* pinName = doc["pin"];
        int value = doc["value"] | -1;
  
        int pinNumber = -1;
        if (strcmp(pinName, "GPIO 2") == 0) pinNumber = 2;
        if (strcmp(pinName, "GPIO 4") == 0) pinNumber = 4;
  
        if (pinNumber != -1) 
        {
          if (strcmp(action, "gpio_read") == 0)
          {
            int state = digitalRead(pinNumber);
            ws.textAll(String("GPIO_READ:") + pinNumber + "=" + state);
          }
          else if (strcmp(action, "gpio_write") == 0 && value != -1)
          {
            digitalWrite(pinNumber, value ? HIGH : LOW);
            ws.textAll(String("GPIO_WRITE:") + pinNumber + "=" + value);
          }
        }
      }
      return;
    }
    if(strncmp((char*)data, "toggleON", 8) == 0 && len == 8)
    {
      ledState = (char*)"ON";
      notifyClient();
    }
    else if(strncmp((char*)data, "toggleOFF", 9) == 0 && len == 9)
    {
      ledState = (char*)"OFF";
      notifyClient();
    }
  }
}

void initWebServer()
{

  WiFi.begin(ssid, password);
  delay(5000);

  Serial.begin(115200);

  while(WiFi.status()!= WL_CONNECTED)
  {
    Serial.print(".");
    delay(1000);
  }
  Serial.println();
  Serial.println("WiFi connected");
  Serial.println("IP address");
  Serial.println(WiFi.localIP());


  if (!SPIFFS.begin(true))
  {
    Serial.println("An error has occurred while mounting SPIFFS.");
    return;
  }
  else
  {
    Serial.println("SPIFFS mounted succesfully.");
  }

  server.addHandler(&ws);

  server.on("/home", HTTP_GET, [] (AsyncWebServerRequest * request) {
    request->send(SPIFFS, "/index.html", "text/html");
  });

  server.on("/script.js", HTTP_GET, [] (AsyncWebServerRequest * request) {
    request->send(SPIFFS, "/script.js", "text/javascript");
  });

  server.on("/style.css", HTTP_GET, [] (AsyncWebServerRequest * request) {
    request->send(SPIFFS, "/style.css", "text/css");
  });

  ws.onEvent(onWsEvent);

  server.begin();

}

void setup() {
  // put your setup code here, to run once:
  pinMode(ledPin, OUTPUT);
  initWebServer();
}

void loop() {
  static unsigned long lastSend = 0;
  if (millis() - lastSend > 500) {
    lastSend = millis();
    int adcValue = analogRead(adcPin);
    if(ws.count() > 0) {
      String msg = "ADC:" + String(adcValue);
        ws.textAll(msg);
    }
  }

  if (strcmp(ledState, "ON") == 0) {
    digitalWrite(ledPin, HIGH);
  } else {
    digitalWrite(ledPin, LOW);
  }
}


