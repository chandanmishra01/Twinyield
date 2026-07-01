import { redirect } from "next/navigation";

// History is hidden for now — re-enable for mainnet.
// To restore, remove the redirect and uncomment the original page below.
export default function Page() {
  redirect("/dashboard");
}

// import { HistoryView } from "@/components/HistoryView";
//
// export default function Page() {
//   return <HistoryView />;
// }
