import type { Metadata } from "next";
import { GuestBuilder } from "@/components/editor/GuestBuilder";

export const metadata: Metadata = {
  title: "Resume builder",
};

export default function BuilderPage() {
  return <GuestBuilder />;
}
