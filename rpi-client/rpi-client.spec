# -*- mode: python ; coding: utf-8 -*-
"""PyInstaller spec file pour RPI Service Client."""

import sys
from pathlib import Path

block_cipher = None

# Fichiers Python à inclure
python_files = [
    'main.py',
    'config.py',
    'gpio_handler.py',
    'action_executor.py',
    'trigger_manager.py',
    'ws_client.py',
]

a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=[],
    datas=[],
    hiddenimports=[
        'websockets',
        'websockets.legacy',
        'websockets.legacy.client',
        'requests',
        'schedule',
        'dotenv',
        'asyncio',
        'json',
        'threading',
        'socket',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        # Exclure les modules GUI inutiles
        'tkinter',
        'matplotlib',
        'numpy',
        'PIL',
        'cv2',
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='rpi-client',
    debug=False,
    bootloader_ignore_signals=False,
    strip=True,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

