"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintScorebookButton() {
  return (
    <Button variant="secondary" className="h-11" onClick={() => window.print()}>
      <Printer className="mr-2 h-4 w-4" />
      印刷/PDF
    </Button>
  );
}
