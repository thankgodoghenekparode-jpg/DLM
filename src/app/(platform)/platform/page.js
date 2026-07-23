"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PlatformRootPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/platform/login");
  }, [router]);
  return null;
}
