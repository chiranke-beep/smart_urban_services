export function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-LK")}`;
}

export function formatETA(minutes?: number): string {
  if (!minutes) return "Calculating...";
  if (minutes < 60) return `~${minutes} mins`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `~${hrs}h ${mins > 0 ? `${mins}m` : ""}`;
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mins ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hrs ago`;
  return date.toLocaleDateString("en-LK", { month: "short", day: "numeric" });
}
