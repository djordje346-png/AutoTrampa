import { Suspense } from "react";
import type { Metadata } from "next";
import MessagesClient from "./MessagesClient";

export const metadata: Metadata = {
  title: "Poruke i ponude",
  description: "Ponude za zamenu automobila i razgovori sa vlasnicima.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="app-container py-8" role="status">
          Učitavanje poruka i ponuda…
        </div>
      }
    >
      <MessagesClient />
    </Suspense>
  );
}
