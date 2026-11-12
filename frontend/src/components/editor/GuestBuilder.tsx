"use client";

import { useState } from "react";
import { createLocalAdapter } from "@/lib/storage/local";
import { ResumeProvider } from "@/state/ResumeProvider";
import { ResumeEditor } from "./ResumeEditor";

/** Editor for visitors without an account: one resume kept in localStorage. */
export function GuestBuilder() {
  const [adapter] = useState(() => createLocalAdapter());
  return (
    <ResumeProvider adapter={adapter}>
      <ResumeEditor />
    </ResumeProvider>
  );
}
