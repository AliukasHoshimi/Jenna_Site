import { redirect } from "next/navigation";

// The old dashboard was just three stat tiles restating what the sidebar
// nav badges now show on every page — scrapped in favor of going straight
// to the inbox.
export default function AdminRootPage() {
  redirect("/admin/threads");
}
