from playwright.sync_api import sync_playwright

def debug_app():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.on("console", lambda msg: print(f"Console {msg.type}: {msg.text}"))
        page.on("pageerror", lambda err: print(f"Page Error: {err}"))

        page.goto("http://localhost:8000/index.html")

        # Check window properties
        states = page.evaluate("window.AAMVA_STATES")
        print(f"Window States: {states is not None}")

        # Check if select is populated
        options = page.evaluate("document.getElementById('stateSelect').options.length")
        print(f"Options length: {options}")

        # Check if error box is visible
        error_box = page.locator("#errorBox").inner_text()
        print(f"Error Box: {error_box}")

        browser.close()

if __name__ == "__main__":
    debug_app()
