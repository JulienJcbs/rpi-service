"""Client WebSocket pour communication avec le backend."""
import json
import asyncio
import websockets
import socket
from typing import Callable, Optional
from config import BACKEND_WS_URL, DEVICE_ID, HEARTBEAT_INTERVAL, RECONNECT_DELAY


class WSClient:
    """Client WebSocket pour la connexion au backend."""

    def __init__(
        self,
        on_config: Optional[Callable[[dict], None]] = None,
        on_config_update: Optional[Callable[[dict], None]] = None,
        on_execute_trigger: Optional[Callable[[str, str, list], None]] = None,
    ):
        self.on_config = on_config
        self.on_config_update = on_config_update
        self.on_execute_trigger = on_execute_trigger  # (trigger_id, trigger_name, actions)
        self.ws: Optional[websockets.WebSocketClientProtocol] = None
        self._running = False
        self._device_id = DEVICE_ID

    async def connect(self):
        """Se connecte au backend WebSocket."""
        self._running = True
        
        while self._running:
            try:
                print(f"🔌 Connexion à {BACKEND_WS_URL}...")
                async with websockets.connect(BACKEND_WS_URL) as ws:
                    self.ws = ws
                    print("✅ Connecté au backend")
                    
                    # S'enregistrer auprès du backend
                    await self._register()
                    
                    # Démarrer le heartbeat
                    heartbeat_task = asyncio.create_task(self._heartbeat_loop())
                    
                    try:
                        await self._receive_loop()
                    finally:
                        heartbeat_task.cancel()
                        
            except websockets.ConnectionClosed:
                print("🔌 Connexion perdue")
            except Exception as e:
                print(f"❌ Erreur WebSocket: {e}")
            
            if self._running:
                print(f"⏳ Reconnexion dans {RECONNECT_DELAY}s...")
                await asyncio.sleep(RECONNECT_DELAY)

    async def _register(self):
        """Enregistre le device auprès du backend."""
        hostname = socket.gethostname()
        try:
            ip_address = socket.gethostbyname(hostname)
        except:
            ip_address = "unknown"

        await self._send({
            "type": "register",
            "deviceId": self._device_id,
            "hostname": hostname,
            "ipAddress": ip_address,
        })

    async def _heartbeat_loop(self):
        """Envoie des pings réguliers au backend."""
        while True:
            await asyncio.sleep(HEARTBEAT_INTERVAL)
            await self._send({
                "type": "ping",
                "deviceId": self._device_id,
            })

    async def _receive_loop(self):
        """Boucle de réception des messages."""
        async for message in self.ws:
            try:
                data = json.loads(message)
                await self._handle_message(data)
            except json.JSONDecodeError:
                print(f"⚠️  Message invalide: {message}")

    async def _handle_message(self, message: dict):
        """Gère un message reçu du backend."""
        msg_type = message.get("type")

        if msg_type == "config":
            print("📥 Configuration reçue")
            if self.on_config:
                self.on_config(message.get("config", {}))
        
        elif msg_type == "config_update":
            print("🔄 Mise à jour de configuration")
            if self.on_config_update:
                self.on_config_update(message.get("config", {}))
        
        elif msg_type == "execute_trigger":
            trigger_id = message.get("triggerId")
            trigger_name = message.get("triggerName")
            actions = message.get("actions", [])
            print(f"\n🎯 Commande reçue: exécuter trigger '{trigger_name}'")
            if self.on_execute_trigger:
                self.on_execute_trigger(trigger_id, trigger_name, actions)
        
        elif msg_type == "pong":
            pass  # Heartbeat acknowledgment
        
        elif msg_type == "error":
            print(f"❌ Erreur du backend: {message.get('message')}")
        
        else:
            print(f"📨 Message: {msg_type}")

    async def _send(self, message: dict):
        """Envoie un message au backend."""
        if self.ws:
            await self.ws.send(json.dumps(message))

    def send_trigger_fired(self, trigger_id: str, trigger_name: str):
        """Envoie une notification de trigger déclenché."""
        asyncio.create_task(self._send({
            "type": "trigger_fired",
            "deviceId": self._device_id,
            "triggerId": trigger_id,
            "triggerName": trigger_name,
        }))

    def send_action_executed(self, trigger_id: str, action_id: str, action_name: str, success: bool):
        """Envoie une notification d'action exécutée."""
        asyncio.create_task(self._send({
            "type": "action_executed",
            "deviceId": self._device_id,
            "triggerId": trigger_id,
            "actionId": action_id,
            "actionName": action_name,
            "success": success,
        }))

    def send_error(self, error: str, context: dict = None):
        """Envoie une notification d'erreur."""
        asyncio.create_task(self._send({
            "type": "error",
            "deviceId": self._device_id,
            "error": error,
            "context": context or {},
        }))

    async def disconnect(self):
        """Ferme la connexion."""
        self._running = False
        if self.ws:
            await self.ws.close()

