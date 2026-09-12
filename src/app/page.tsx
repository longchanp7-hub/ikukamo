import { HomeClient } from "@/components/HomeClient";
import { visibleEvents } from "@/lib/events";
export default function Home() {
  return <HomeClient events={visibleEvents()} />;
}
