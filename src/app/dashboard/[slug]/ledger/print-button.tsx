"use client";

import { Button } from "@astryxdesign/core/Button";
import { Icon } from "@astryxdesign/core/Icon";
import { Printer } from "lucide-react";

export function PrintButton({ label }: { label: string }) {
  return <Button variant="primary" size="sm" label={label} icon={<Icon icon={Printer} />} onClick={() => window.print()} />;
}
