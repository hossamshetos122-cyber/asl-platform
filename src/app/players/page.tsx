import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getPlayersList } from "@/lib/data/players";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PlayersBrowser } from "./players-browser";

export const metadata = {
  title: "اللاعبون | دوري نجوم الإسكندرية للهواة",
  description: "استعرض لاعبي فرق دوري نجوم الإسكندرية للهواة.",
};

export const dynamic = "force-dynamic";

async function PlayerList() {
  const result = await getPlayersList();

  if (result.status === "error") return <ErrorState message={result.message} />;
  if (result.status === "empty") return <EmptyState message="لا يوجد لاعبون مسجّلون بعد." />;

  return <PlayersBrowser players={result.data} />;
}

export default async function PlayersPage() {
  return (
    <>
      <Navbar />
      <main className="page-container page-padding">
        <SectionHeader title="اللاعبون" tag="PLAYERS" bordered={false} />
        <PlayerList />
      </main>
      <Footer />
    </>
  );
}