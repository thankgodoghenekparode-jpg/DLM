"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function CreateTicketRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/company/carriage");
  }, [router]);

  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="animate-spin text-gray-400" size={28} />
    </div>
  );
}
