# --- window_manager.py ---
# This module contains the core logic for managing the application's desktop window.
# Its primary responsibility is to apply the necessary settings to prevent the window
# from being captured by screen recording or sharing software (e.g., Teams, Zoom, OBS).
# This is the "stealth" feature of the Aura application.

import ctypes
import ctypes.wintypes as wintypes
import webview
import time

# --- Win32 API Constants ---
# These flags are used with the SetWindowDisplayAffinity function.
# WDA_EXCLUDEFROMCAPTURE is a comprehensive flag that prevents the window from being
# captured by most common methods, rendering it as a black rectangle in recordings.
WDA_EXCLUDEFROMCAPTURE = 0x00000011

# --- Win32 Function Loading ---
# We use the ctypes library to load functions directly from user32.dll, a core
# Windows library for UI management. This gives us low-level control over the window.

# Load the user32 library
_user32 = ctypes.windll.user32

# Define the function signature for SetWindowDisplayAffinity
# This tells ctypes what kind of arguments the function expects (a window handle and a flag)
# and what it returns (a boolean indicating success).
_user32.SetWindowDisplayAffinity.restype  = wintypes.BOOL
_user32.SetWindowDisplayAffinity.argtypes = (wintypes.HWND, wintypes.DWORD)

# Define the function signature for FindWindowW
# This is a fallback method to find a window by its title if the primary method fails.
_user32.FindWindowW.restype               = wintypes.HWND
_user32.FindWindowW.argtypes              = (wintypes.LPCWSTR, wintypes.LPCWSTR)


def apply_capture_protection(window):
    """
    Applies display affinity to exclude the window from screen capture.

    This function is the heart of the "stealth" feature. It first tries to get
    the window handle directly from a private pywebview attribute and, if that fails,
    falls back to searching for the window by its title.

    Args:
        window: The pywebview window object.
    """
    hwnd = None
    print("INFO: Attempting to apply screen capture protection...")

    # --- Method 1: Get handle from pywebview's private attribute ---
    # This is the preferred method as it's direct and not dependent on the window title.
    # We use getattr for safety, in case this private attribute changes in future versions.
    hwnd = getattr(window, '_hwnd', None)
    print(f"INFO: Attempt 1 (from window._hwnd) found handle: {hwnd}")

    # --- Method 2: Fallback to finding the window by title ---
    # If the private attribute doesn't exist, we use a classic Win32 function.
    if not hwnd:
        print("WARN: Could not find handle via private attribute. Trying fallback...")
        # A small delay is crucial here. It gives the OS time to register the
        # native window after the 'shown' event has fired.
        time.sleep(0.1)
        hwnd = _user32.FindWindowW(None, window.title)
        print(f"INFO: Attempt 2 (via FindWindowW) found handle: {hwnd}")

    # --- Apply the Protection ---
    if not hwnd:
        print("ERROR: Could not obtain a valid window handle (HWND). Cannot apply protection.")
        return

    print(f"INFO: Applying WDA_EXCLUDEFROMCAPTURE to handle 0x{hwnd:08X}...")
    success = _user32.SetWindowDisplayAffinity(hwnd, WDA_EXCLUDEFROMCAPTURE)

    if success:
        print(f"SUCCESS: Window 0x{hwnd:08X} is now protected from screen capture.")
    else:
        # If the function fails, we get the last error code from the OS for debugging.
        error_code = ctypes.GetLastError()
        print(f"ERROR: Failed to protect window 0x{hwnd:08X}. Win32 Error Code: {error_code}")


# --- Example Usage (for testing this module directly) ---
if __name__ == '__main__':
    print("Running window_manager.py in test mode...")

    # Create a pywebview window for testing purposes
    test_window = webview.create_window(
        'Aura Stealth Test',
        html='<h1>This window should be black in screen recordings.</h1>',
        width=800,
        height=600
    )

    # Hook our protection function to the 'shown' event. This is critical.
    # The 'shown' event fires after the window is created and visible, ensuring
    # that a window handle exists.
    test_window.events.shown += lambda: apply_capture_protection(test_window)

    # Start the GUI event loop
    webview.start()
# This function is not called if DEV_MODE in main.py is True
    print("--- Running window_manager.py in test mode ---")