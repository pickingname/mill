"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/docs");
  }, [router]);
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-center text-xl">Redirecting to /docs</p>
    </div>
  );
}
