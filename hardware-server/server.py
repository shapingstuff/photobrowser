import asyncio
import websockets
import json
from gpiozero import RotaryEncoder, Button

# Define GPIO pins
CLK_PIN = 17
DT_PIN = 18
BTN_PIN = 27

# Initialize encoder and button
encoder = RotaryEncoder(CLK_PIN, DT_PIN, wrap=True)
button = Button(BTN_PIN)

# Track last value globally
last_encoder_value = encoder.value
ws_connection = None

async def connect_to_node_server():
    global ws_connection
    while ws_connection is None:
        try:
            ws_connection = await websockets.connect("ws://localhost:8080")
            print("✅ Connected to Node WebSocket server")
        except Exception as e:
            print(f"🔁 Retry connection failed: {e}")
            await asyncio.sleep(2)

async def send_update(data):
    global ws_connection
    if ws_connection:
        try:
            await ws_connection.send(json.dumps(data))
            print(f"📤 Sent: {data}")
        except Exception as e:
            print(f"❌ Failed to send: {e}")
            ws_connection = None
            await connect_to_node_server()

def on_encoder_turn():
    global last_encoder_value
    new_value = encoder.value
    delta = new_value - last_encoder_value

    if delta != 0:
        direction = 1 if delta > 0 else -1
        asyncio.run(send_update({"type": "encoder", "value": direction}))
        print(f"[ENCODER] value: {new_value}, delta: {delta}, direction: {direction}", flush=True)

    last_encoder_value = new_value

def on_button_press():
    asyncio.run(send_update({"type": "button", "value": "pressed"}))
    print("[BUTTON] Pressed", flush=True)

encoder.when_rotated = on_encoder_turn
button.when_pressed = on_button_press

async def main():
    await connect_to_node_server()
    while True:
        await asyncio.sleep(1)

if __name__ == "__main__":
    asyncio.run(main())