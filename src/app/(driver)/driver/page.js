"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DriverRootPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/driver/login");
  }, [router]);
  return null;
}
