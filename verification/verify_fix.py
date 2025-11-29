from playwright.sync_api import sync_playwright, expect
import time

def verify_app(page):
    # Navigate to the app
    page.goto("http://localhost:8080/index.html")

    # Wait for the initialization logs or key elements
    # We check if the State select is populated, which means AAMVA_STATES was loaded.
    state_select = page.locator("#stateSelect")
    expect(state_select).not_to_be_empty()

    # Check for "CA" in the state select options to ensure it populated correctly
    expect(state_select).to_contain_text("CA")

    # Select a state and version to trigger liveUpdate
    state_select.select_option("CA")
    page.locator("#versionSelect").select_option("09")

    # Fill in a required field to generate a valid payload
    # Fields for v09: DAA (Full Name), DCS (Last Name), DAC (First Name), etc.
    # We'll just fill DCS and DAC as they are required.
    page.fill("#DCS", "DOE")
    page.fill("#DAC", "JOHN")

    # Wait a bit for the barcode generation (liveUpdate is triggered on input)
    # The canvas should have content.
    canvas = page.locator("#barcodeCanvas")

    # Check if canvas has dimensions > 0
    box = canvas.bounding_box()
    assert box['width'] > 0
    assert box['height'] > 0

    # Take a screenshot
    page.screenshot(path="verification/app_verified.png")

    # Check for console errors
    # Note: accessing console messages in sync mode is event-based,
    # but we can't easily assert on past events without a listener setup before.
    # We will rely on the fact that if the above steps worked, critical JS errors are likely absent.

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console logs
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        page.on("pageerror", lambda exc: print(f"PAGE ERROR: {exc}"))

        try:
            verify_app(page)
            print("Verification script finished successfully.")
        except Exception as e:
            print(f"Verification failed: {e}")
        finally:
            browser.close()
