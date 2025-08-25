
"use client";

import Aurora from "@/components/aurora/aurora";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Aurora
        colorStops={["#684A97", "#FFD300", "#684A97"]}
        blend={1.0}
        amplitude={0.3}
        speed={1}
      />
      {children}
    </>
  );
}
