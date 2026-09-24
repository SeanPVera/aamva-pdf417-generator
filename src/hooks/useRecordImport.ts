import { useEffect, useRef } from "react";
import { MAX_IMPORT_BYTES, parseImportedPayload } from "../core/importPayload";
import { useFormStore } from "./useFormStore";
import { useToast } from "../components/Toast";

/** Shared picker/drop transaction: a late read never overwrites newer edits. */
export function useRecordImport() {
  const request = useRef(0);
  const toast = useToast();
  useEffect(
    () => () => {
      request.current++;
    },
    []
  );
  return async (file: File) => {
    const token = ++request.current;
    if (file.size > MAX_IMPORT_BYTES) {
      toast.error("Choose a JSON record smaller than 1 MB.");
      return;
    }
    const before = useFormStore.getState();
    try {
      const parsed = parseImportedPayload(await file.text(), file.name);
      if (token !== request.current) return;
      if (!parsed.ok) {
        toast.error(parsed.error, { persistent: true });
        return;
      }
      const current = useFormStore.getState();
      if (
        current.fields !== before.fields ||
        current.state !== before.state ||
        current.version !== before.version ||
        current.subfileType !== before.subfileType
      ) {
        toast.info(
          "The record changed while the file was read. Import it again to replace the current record."
        );
        return;
      }
      current.loadJson(parsed.data);
      toast.success(`Imported ${file.name}. Undo is available in the toolbar.`);
    } catch {
      if (token === request.current)
        toast.error("The file could not be read. The current record was kept.");
    }
  };
}
