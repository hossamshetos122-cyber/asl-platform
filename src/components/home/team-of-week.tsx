import { getTeamOfTheWeek } from "@/lib/data/team-of-week";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { TeamOfWeekPitch } from "@/components/home/team-of-week-pitch";

export async function TeamOfWeek() {
  const result = await getTeamOfTheWeek();

  return (
    <section className="page-container editorial-section">
      <SectionHeader title="فريق الأسبوع" tag="TEAM OF THE WEEK" />

      {result.status === "error" && <ErrorState message={result.message} />}
      {result.status === "empty" && <EmptyState message="لم يتم اختيار فريق الأسبوع بعد." />}

      {result.status === "success" && <TeamOfWeekPitch data={result.data} />}
    </section>
  );
}