"use client";

import { useEffect } from "react";

export default function IgnoreAbortErrors() {
  useEffect(() => {
    function onUnhandledRejection(event: PromiseRejectionEvent) {
      const err: any = event.reason;

      const isAbort =
        err?.name === "AbortError" ||
        String(err?.message ?? "")
          .toLowerCase()
          .includes("aborted") ||
        String(err?.message ?? "")
          .toLowerCase()
          .includes("signal is aborted");

      // Abaikan AbortError agar tidak muncul overlay error
      if (isAbort) {
        event.preventDefault();
      }
    }

    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () =>
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
  }, []);

  return null;
}
