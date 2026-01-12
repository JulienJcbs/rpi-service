#!/usr/bin/env python3
"""Client RPI pour le service de contrôle GPIO."""
import asyncio
import argparse
import signal
import sys
from config import DEVICE_ID, SIMULATION_MODE
from gpio_handler import GPIOHandler
from action_executor import ActionExecutor
from trigger_manager import TriggerManager
from ws_client import WSClient


class RPIClient:
    """Client principal pour le Raspberry Pi."""

    def __init__(self, device_id: str):
        self.device_id = device_id
        self.gpio = GPIOHandler()
        self.action_executor = ActionExecutor(self.gpio)
        self.trigger_manager = TriggerManager(
            gpio=self.gpio,
            action_executor=self.action_executor,
            on_trigger_fired=self._on_trigger_fired
        )
        self.ws_client = WSClient(
            on_config=self._on_config_received,
            on_config_update=self._on_config_received
        )
        # Connecter l'executor au ws_client pour les notifications
        self.action_executor.ws_client = self.ws_client

    def _on_config_received(self, config: dict):
        """Callback quand la configuration est reçue."""
        self.trigger_manager.load_config(config)

    def _on_trigger_fired(self, trigger_id: str, trigger_name: str):
        """Callback quand un trigger est déclenché."""
        self.ws_client.send_trigger_fired(trigger_id, trigger_name)

    async def run(self):
        """Démarre le client."""
        print(f"""
╔══════════════════════════════════════════════════════════════╗
║               🍓 RPI Service Client                          ║
╠══════════════════════════════════════════════════════════════╣
║  Device ID: {self.device_id:<47} ║
║  Mode: {'Simulation' if SIMULATION_MODE else 'Production':<52} ║
╚══════════════════════════════════════════════════════════════╝
        """)

        # Configuration des signaux d'arrêt
        loop = asyncio.get_event_loop()
        for sig in (signal.SIGINT, signal.SIGTERM):
            loop.add_signal_handler(sig, lambda: asyncio.create_task(self.shutdown()))

        # Connexion au backend
        await self.ws_client.connect()

    async def shutdown(self):
        """Arrête proprement le client."""
        print("\n🛑 Arrêt en cours...")
        self.trigger_manager.clear_all()
        await self.ws_client.disconnect()
        print("👋 Au revoir!")
        sys.exit(0)


def main():
    parser = argparse.ArgumentParser(description="Client RPI pour le service de contrôle GPIO")
    parser.add_argument(
        "--device-id", "-d",
        type=str,
        default=DEVICE_ID,
        help="ID du device (défini aussi via DEVICE_ID env var)"
    )
    parser.add_argument(
        "--simulate", "-s",
        action="store_true",
        help="Mode simulation (pas de GPIO réel)"
    )
    args = parser.parse_args()

    device_id = args.device_id
    if not device_id:
        print("❌ Erreur: Device ID requis")
        print("   Utilisez --device-id ou définissez DEVICE_ID")
        sys.exit(1)

    if args.simulate:
        import config
        config.SIMULATION_MODE = True

    # Mettre à jour le device ID dans la config
    import config
    config.DEVICE_ID = device_id
    
    # Mettre à jour dans le ws_client aussi
    client = RPIClient(device_id)
    client.ws_client._device_id = device_id

    try:
        asyncio.run(client.run())
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()

