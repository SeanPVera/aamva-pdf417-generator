import React from "react";
import { Download, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const isIOS = () =>
  /iphone|ipad|ipod/i.test(window.navigator.userAgent) &&
  !window.matchMedia("(display-mode: standalone)").matches;

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = React.useState(false);
  const [showIosHelp, setShowIosHelp] = React.useState(false);

  React.useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      setShowIosHelp(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS()) {
      setShowIosHelp(true);
      return;
    }

    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  if (installed) return null;
  if (!deferredPrompt && !isIOS()) return null;

  return (
    <>
      <button
        type="button"
        onClick={handleInstall}
        className="header-ctrl flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white px-2 py-1.5 rounded-md text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
        title="Install app on your phone"
      >
        {isIOS() ? <Smartphone size={14} /> : <Download size={14} />}
        Install App
      </button>

      {showIosHelp && (
        <div
          className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Install on iPhone or iPad"
        >
          <div className="w-full max-w-sm rounded-lg bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border p-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Install on iPhone/iPad
            </h3>
            <ol className="mt-3 list-decimal list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li>Tap the Share button in Safari.</li>
              <li>Select &quot;Add to Home Screen&quot;.</li>
              <li>Tap &quot;Add&quot; to install.</li>
            </ol>
            <button
              type="button"
              onClick={() => setShowIosHelp(false)}
              className="mt-4 w-full rounded bg-brand-600 hover:bg-brand-700 text-white py-2 text-sm font-medium transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
