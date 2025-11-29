from playwright.sync_api import sync_playwright

def verify_app():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the app served by http.server
        page.goto("http://localhost:8000/index.html")

        # Check if console has errors
        page.on("console", lambda msg: print(f"Console {msg.type}: {msg.text}"))

        # Wait for initialization (use select element itself)
        page.wait_for_selector("#stateSelect")

        # Select state
        page.select_option("#stateSelect", "NY")
        print("Selected NY")

        # Select version
        # 08 is NOT in the version list in aamva.js!
        # The grep output showed "09".
        page.select_option("#versionSelect", "09")
        print("Selected Version 09")

        # Fill in a field (DCS - Last Name)
        page.fill("#DCS", "TESTNAME")
        print("Filled DCS")

        # Wait for barcode to render (canvas should be populated)
        page.wait_for_timeout(1000)

        # Take a screenshot
        page.screenshot(path="verification/app_verified.png")
        print("Screenshot taken")

        browser.close()

if __name__ == "__main__":
    verify_app()
