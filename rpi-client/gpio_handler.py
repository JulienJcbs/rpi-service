"""Gestion des GPIO du Raspberry Pi."""
import time
import threading
from typing import Callable, Optional
from config import SIMULATION_MODE, GPIO_MODE

if not SIMULATION_MODE:
    try:
        import RPi.GPIO as GPIO
        GPIO_AVAILABLE = True
    except ImportError:
        GPIO_AVAILABLE = False
        print("⚠️  RPi.GPIO non disponible - mode simulation activé")
else:
    GPIO_AVAILABLE = False
    print("🔧 Mode simulation activé")


class GPIOHandler:
    """Gère les entrées/sorties GPIO."""

    def __init__(self):
        self.callbacks: dict[int, Callable] = {}
        self.output_states: dict[int, bool] = {}
        self.pulse_timers: dict[int, threading.Timer] = {}
        self._setup_done = False

    def setup(self):
        """Initialise le GPIO."""
        if self._setup_done:
            return

        if GPIO_AVAILABLE:
            mode = GPIO.BCM if GPIO_MODE == "BCM" else GPIO.BOARD
            GPIO.setmode(mode)
            GPIO.setwarnings(False)

        self._setup_done = True
        print(f"✅ GPIO initialisé (mode: {GPIO_MODE}, simulation: {not GPIO_AVAILABLE})")

    def setup_input(
        self,
        pin: int,
        pull: str = "up",
        edge: str = "falling",
        debounce: int = 50,
        callback: Optional[Callable] = None,
    ):
        """Configure un pin en entrée avec détection d'événement."""
        self.setup()

        if GPIO_AVAILABLE:
            # Configuration du pull-up/down
            pull_ud = GPIO.PUD_UP if pull == "up" else GPIO.PUD_DOWN if pull == "down" else GPIO.PUD_OFF
            GPIO.setup(pin, GPIO.IN, pull_up_down=pull_ud)

            # Configuration de l'edge detection
            edge_detect = (
                GPIO.RISING if edge == "rising" else
                GPIO.FALLING if edge == "falling" else
                GPIO.BOTH
            )

            if callback:
                self.callbacks[pin] = callback
                GPIO.add_event_detect(
                    pin,
                    edge_detect,
                    callback=lambda ch: self._handle_input(ch),
                    bouncetime=debounce
                )

        print(f"📍 GPIO {pin} configuré en entrée (pull: {pull}, edge: {edge})")

    def _handle_input(self, channel: int):
        """Gère un événement d'entrée GPIO."""
        if channel in self.callbacks:
            self.callbacks[channel](channel)

    def setup_output(self, pin: int, initial_state: bool = False):
        """Configure un pin en sortie."""
        self.setup()

        if GPIO_AVAILABLE:
            GPIO.setup(pin, GPIO.OUT, initial=GPIO.HIGH if initial_state else GPIO.LOW)

        self.output_states[pin] = initial_state
        print(f"📍 GPIO {pin} configuré en sortie (état initial: {initial_state})")

    def set_output(self, pin: int, state: bool):
        """Définit l'état d'une sortie GPIO."""
        if pin not in self.output_states:
            self.setup_output(pin)

        if GPIO_AVAILABLE:
            GPIO.output(pin, GPIO.HIGH if state else GPIO.LOW)

        self.output_states[pin] = state
        print(f"⚡ GPIO {pin} -> {'HIGH' if state else 'LOW'}")

    def toggle_output(self, pin: int):
        """Inverse l'état d'une sortie GPIO."""
        current_state = self.output_states.get(pin, False)
        self.set_output(pin, not current_state)

    def pulse_output(self, pin: int, state: bool, duration_ms: int):
        """Génère une impulsion sur une sortie GPIO."""
        # Annuler un timer précédent s'il existe
        if pin in self.pulse_timers:
            self.pulse_timers[pin].cancel()

        # Activer la sortie
        self.set_output(pin, state)

        # Programmer la désactivation
        def reset():
            self.set_output(pin, not state)
            if pin in self.pulse_timers:
                del self.pulse_timers[pin]

        timer = threading.Timer(duration_ms / 1000.0, reset)
        self.pulse_timers[pin] = timer
        timer.start()

        print(f"⏱️  GPIO {pin} pulse {'HIGH' if state else 'LOW'} pendant {duration_ms}ms")

    def read_input(self, pin: int) -> bool:
        """Lit l'état d'une entrée GPIO."""
        if GPIO_AVAILABLE:
            return GPIO.input(pin) == GPIO.HIGH
        return False

    def cleanup(self):
        """Nettoie les ressources GPIO."""
        # Annuler tous les timers
        for timer in self.pulse_timers.values():
            timer.cancel()
        self.pulse_timers.clear()

        if GPIO_AVAILABLE:
            GPIO.cleanup()

        self.callbacks.clear()
        self.output_states.clear()
        self._setup_done = False
        print("🧹 GPIO nettoyé")


# Simulation du GPIO pour tests
class SimulatedGPIO:
    """Simule les GPIO pour le développement."""

    BCM = 11
    BOARD = 10
    IN = 1
    OUT = 0
    HIGH = 1
    LOW = 0
    PUD_UP = 22
    PUD_DOWN = 21
    PUD_OFF = 20
    RISING = 31
    FALLING = 32
    BOTH = 33

    _mode = None
    _pins: dict[int, dict] = {}

    @classmethod
    def setmode(cls, mode):
        cls._mode = mode

    @classmethod
    def setwarnings(cls, flag):
        pass

    @classmethod
    def setup(cls, pin, direction, pull_up_down=None, initial=None):
        cls._pins[pin] = {
            "direction": direction,
            "value": initial or cls.LOW,
            "pud": pull_up_down,
        }

    @classmethod
    def output(cls, pin, value):
        if pin in cls._pins:
            cls._pins[pin]["value"] = value

    @classmethod
    def input(cls, pin):
        if pin in cls._pins:
            return cls._pins[pin].get("value", cls.LOW)
        return cls.LOW

    @classmethod
    def add_event_detect(cls, pin, edge, callback=None, bouncetime=0):
        pass

    @classmethod
    def remove_event_detect(cls, pin):
        pass

    @classmethod
    def cleanup(cls):
        cls._pins.clear()
        cls._mode = None


# Utiliser la simulation si GPIO pas disponible
if not GPIO_AVAILABLE:
    GPIO = SimulatedGPIO

