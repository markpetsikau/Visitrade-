import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle } from "lucide-react";

// Small inline banner for auth pages (errors, confirmation prompts).
export function AuthNotice({
  tone,
  children,
}: {
  tone: "success" | "error";
  children: React.ReactNode;
}) {
  const success = tone === "success";
  return (
    <div
      className={cn(
        "mt-6 flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm",
        success
          ? "border-bull/30 bg-bull/10 text-bull"
          : "border-bear/30 bg-bear/10 text-bear",
      )}
      role={success ? "status" : "alert"}
    >
      {success ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <span>{children}</span>
    </div>
  );
}
