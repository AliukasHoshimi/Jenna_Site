import Link from "next/link";
import { getBookingSettings } from "@/lib/booking-availability";
import { BookingSettingsForm } from "./booking-settings-form";

export default async function BookingSettingsPage() {
  const settings = await getBookingSettings();

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/calendar" className="text-sm text-muted hover:text-foreground">
          ← Calendar
        </Link>
      </div>
      <h1 className="mb-6 font-display text-2xl text-foreground">Booking settings</h1>
      <BookingSettingsForm initialSettings={settings} />
    </div>
  );
}
