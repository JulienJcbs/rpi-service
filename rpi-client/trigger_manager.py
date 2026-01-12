"""Gestion des triggers (déclencheurs)."""
import schedule
import threading
import time
from typing import Callable, Optional
from gpio_handler import GPIOHandler
from action_executor import ActionExecutor


class TriggerManager:
    """Gère les triggers configurés pour le device."""

    def __init__(self, gpio: GPIOHandler, action_executor: ActionExecutor, on_trigger_fired: Optional[Callable] = None):
        self.gpio = gpio
        self.action_executor = action_executor
        self.on_trigger_fired = on_trigger_fired
        self.triggers: dict[str, dict] = {}
        self._scheduler_thread: Optional[threading.Thread] = None
        self._scheduler_running = False

    def load_config(self, config: dict):
        """Charge la configuration des triggers depuis le backend."""
        self.clear_all()
        
        device_name = config.get("deviceName", "Unknown")
        triggers = config.get("triggers", [])
        
        print(f"\n📥 Chargement config pour '{device_name}'")
        print(f"   {len(triggers)} trigger(s) à configurer\n")

        for trigger in triggers:
            self._setup_trigger(trigger)

        # Démarrer le scheduler si nécessaire
        if any(t["type"] == "schedule" for t in triggers):
            self._start_scheduler()

    def _setup_trigger(self, trigger: dict):
        """Configure un trigger individuel."""
        trigger_id = trigger["id"]
        trigger_type = trigger["type"]
        trigger_name = trigger["name"]
        config = trigger["config"]
        actions = trigger["actions"]

        self.triggers[trigger_id] = trigger
        print(f"🔧 Trigger: {trigger_name} ({trigger_type})")

        if trigger_type == "gpio_input":
            self._setup_gpio_trigger(trigger_id, trigger_name, config, actions)
        elif trigger_type == "schedule":
            self._setup_schedule_trigger(trigger_id, trigger_name, config, actions)
        elif trigger_type == "api_call":
            # Les triggers API sont gérés par le backend
            print(f"   → Trigger API (géré par backend)")

    def _setup_gpio_trigger(self, trigger_id: str, name: str, config: dict, actions: list):
        """Configure un trigger GPIO."""
        pin = config["pin"]
        edge = config.get("edge", "falling")
        pull = config.get("pull", "up")
        debounce = config.get("debounce", 50)

        def on_gpio_event(channel):
            print(f"\n🎯 Trigger GPIO déclenché: {name} (pin {pin})")
            self._fire_trigger(trigger_id, name, actions)

        self.gpio.setup_input(
            pin=pin,
            pull=pull,
            edge=edge,
            debounce=debounce,
            callback=on_gpio_event
        )
        print(f"   → Pin {pin}, edge: {edge}, pull: {pull}")

    def _setup_schedule_trigger(self, trigger_id: str, name: str, config: dict, actions: list):
        """Configure un trigger planifié."""
        cron = config.get("cron", "")
        
        # Parser simple de cron (minute hour * * *)
        # Pour une implémentation complète, utiliser croniter
        parts = cron.split()
        if len(parts) >= 2:
            minute = parts[0]
            hour = parts[1]
            time_str = f"{hour.zfill(2)}:{minute.zfill(2)}"

            def on_schedule():
                print(f"\n⏰ Trigger Schedule déclenché: {name}")
                self._fire_trigger(trigger_id, name, actions)

            schedule.every().day.at(time_str).do(on_schedule)
            print(f"   → Planifié à {time_str}")
        else:
            print(f"   ⚠️  Expression cron invalide: {cron}")

    def _fire_trigger(self, trigger_id: str, name: str, actions: list):
        """Déclenche l'exécution des actions d'un trigger."""
        if self.on_trigger_fired:
            self.on_trigger_fired(trigger_id, name)

        self.action_executor.execute_actions(trigger_id, name, actions)

    def _start_scheduler(self):
        """Démarre le thread du scheduler."""
        if self._scheduler_running:
            return

        self._scheduler_running = True

        def run_scheduler():
            while self._scheduler_running:
                schedule.run_pending()
                time.sleep(1)

        self._scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
        self._scheduler_thread.start()
        print("⏱️  Scheduler démarré")

    def _stop_scheduler(self):
        """Arrête le scheduler."""
        self._scheduler_running = False
        schedule.clear()

    def clear_all(self):
        """Nettoie tous les triggers."""
        self._stop_scheduler()
        self.gpio.cleanup()
        self.triggers.clear()
        print("🧹 Triggers nettoyés")

    def fire_trigger_by_id(self, trigger_id: str) -> bool:
        """Déclenche manuellement un trigger par son ID."""
        if trigger_id not in self.triggers:
            return False

        trigger = self.triggers[trigger_id]
        self._fire_trigger(trigger_id, trigger["name"], trigger["actions"])
        return True

