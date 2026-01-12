"""Configuration du client RPI."""
import os
from dotenv import load_dotenv

load_dotenv()

# Backend configuration
BACKEND_URL = os.getenv("BACKEND_URL", "http://10.98.122.196:3001")
BACKEND_WS_URL = os.getenv("BACKEND_WS_URL", "ws://10.98.122.19:3001")

# Device configuration
DEVICE_ID = os.getenv("DEVICE_ID", "")

# Heartbeat interval (seconds)
HEARTBEAT_INTERVAL = int(os.getenv("HEARTBEAT_INTERVAL", "30"))

# Reconnect delay (seconds)
RECONNECT_DELAY = int(os.getenv("RECONNECT_DELAY", "5"))

# GPIO mode (BCM or BOARD)
GPIO_MODE = os.getenv("GPIO_MODE", "BCM")

# Simulation mode (for testing without actual GPIO hardware)
SIMULATION_MODE = os.getenv("SIMULATION_MODE", "false").lower() == "true"

