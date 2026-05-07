import React from "react";
import { FileUp } from "lucide-react";
import { useFormStore } from "../hooks/useFormStore";
import { useToast } from "./Toast";

/**
 * Listens for window-level drag events. When the user drags a file over the
 * page, a fullscreen overlay invites them to drop it. On drop, the JSON is
 * parsed and loaded into the form (same shape as the Header import flow).
 */
export const DropZoneOverlay: React.FC = () => {
  const [active, setActive] = React.useState(false);
  const dragDepthRef = React.useRef(0);
  const loadJson = useFormStore((s) => s.loadJson);
  const toast = useToast();

  React.useEffect(() => {
    const isFileDrag = (e: DragEvent) => Array.from(e.dataTransfer?.types || []).includes("Files");

    const handleEnter = (e: DragEvent) => {
      if (!isFileDrag(e)) return;
      dragDepthRef.current += 1;
      setActive(true);
    };
    const handleOver = (e: DragEvent) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
    };
    const handleLeave = (e: DragEvent) => {
      if (!isFileDrag(e)) return;
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) setActive(false);
    };
    const handleDrop = (e: DragEvent) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      dragDepthRef.current = 0;
      setActive(false);

      const file = e.dataTransfer?.files?.[0];
      if (!file) return;
      if (!/\.json$|application\/json/.test(file.type) && !file.name.endsWith(".json")) {
        toast.error("Only .json files can be dropped here.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const parsed = JSON.parse(evt.target?.result as string);
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            loadJson(parsed as Record<string, string>);
            toast.success(`Imported ${file.name}`);
          } else {
            toast.error("Invalid JSON: expected a single payload object.");
          }
        } catch {
          toast.error("Failed to parse JSON file. Check the file format.");
        }
      };
      reader.readAsText(file);
    };

    window.addEventListener("dragenter", handleEnter);
    window.addEventListener("dragover", handleOver);
    window.addEventListener("dragleave", handleLeave);
    window.addEventListener("drop", handleDrop);
    return () => {
      window.removeEventListener("dragenter", handleEnter);
      window.removeEventListener("dragover", handleOver);
      window.removeEventListener("dragleave", handleLeave);
      window.removeEventListener("drop", handleDrop);
    };
  }, [loadJson, toast]);

  if (!active) return null;
  return (
    <div
      className="fixed inset-0 z-[60] pointer-events-none flex items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <div className="absolute inset-4 rounded-2xl border-4 border-dashed border-brand-500 bg-brand-500/10 backdrop-blur-sm" />
      <div className="relative flex flex-col items-center gap-3 px-6 py-5 rounded-xl bg-white dark:bg-dark-surface border border-brand-200 dark:border-brand-800 shadow-2xl text-center">
        <FileUp size={28} className="text-brand-600 dark:text-brand-400" />
        <div>
          <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Drop JSON to import
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Single payload object, like Export JSON output.
          </div>
        </div>
      </div>
    </div>
  );
};
