"""Exécution des actions configurées."""
import time
import requests
from typing import Any
from gpio_handler import GPIOHandler


class ActionExecutor:
    """Exécute les actions définies pour les triggers."""

    def __init__(self, gpio: GPIOHandler, ws_client: Any = None):
        self.gpio = gpio
        self.ws_client = ws_client
        self._output_pins_setup: set[int] = set()

    def execute_actions(self, trigger_id: str, trigger_name: str, actions: list[dict]) -> bool:
        """Exécute une séquence d'actions."""
        success = True

        for action in actions:
            try:
                action_success = self._execute_action(action)
                if self.ws_client:
                    self.ws_client.send_action_executed(
                        trigger_id=trigger_id,
                        action_id=action["id"],
                        action_name=action["name"],
                        success=action_success
                    )
                if not action_success:
                    success = False
            except Exception as e:
                print(f"❌ Erreur action {action['name']}: {e}")
                if self.ws_client:
                    self.ws_client.send_error(str(e), {"action": action["name"]})
                success = False

        return success

    def _execute_action(self, action: dict) -> bool:
        """Exécute une action individuelle."""
        action_type = action["type"]
        config = action["config"]
        name = action["name"]

        print(f"▶️  Exécution: {name} ({action_type})")

        if action_type == "gpio_output":
            return self._execute_gpio_output(config)
        elif action_type == "http_request":
            return self._execute_http_request(config)
        elif action_type == "delay":
            return self._execute_delay(config)
        else:
            print(f"⚠️  Type d'action inconnu: {action_type}")
            return False

    def _execute_gpio_output(self, config: dict) -> bool:
        """Exécute une action de sortie GPIO."""
        pin = config["pin"]
        state = config["state"]
        duration = config.get("duration")

        # Configurer le pin en sortie si pas déjà fait
        if pin not in self._output_pins_setup:
            self.gpio.setup_output(pin)
            self._output_pins_setup.add(pin)

        if state == "toggle":
            self.gpio.toggle_output(pin)
        elif duration:
            # Pulse: activer pendant une durée
            target_state = state == "high"
            self.gpio.pulse_output(pin, target_state, duration)
        else:
            # État permanent
            target_state = state == "high"
            self.gpio.set_output(pin, target_state)

        return True

    def _execute_http_request(self, config: dict) -> bool:
        """Exécute une requête HTTP."""
        url = config["url"]
        method = config.get("method", "POST")
        headers = config.get("headers", {})
        body = config.get("body")

        try:
            response = requests.request(
                method=method,
                url=url,
                headers=headers,
                json=body if body else None,
                timeout=10
            )
            print(f"🌐 HTTP {method} {url} -> {response.status_code}")
            return response.ok
        except requests.RequestException as e:
            print(f"❌ Erreur HTTP: {e}")
            return False

    def _execute_delay(self, config: dict) -> bool:
        """Exécute un délai."""
        duration_ms = config["duration"]
        duration_s = duration_ms / 1000.0
        print(f"⏳ Attente de {duration_ms}ms...")
        time.sleep(duration_s)
        return True

