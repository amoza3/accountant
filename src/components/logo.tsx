import { cn } from "@/lib/utils";

export function Logo({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-7 w-7 text-primary"
      >
        <rect width="8" height="20" x="2" y="2" rx="2" />
        <path d="M14 2h6a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6" />
      </svg>
      <span className="text-xl font-bold tracking-tighter">{children}</span>
    </div>
  );
}
