import { HomeClient } from "@/components/HomeClient";
import { loadLocalEvents } from "@/lib/events";
export default function Home() {
  return <HomeClient events={loadLocalEvents()} />;
}
