import { GameSetup } from "@/components/game-setup";
import { ScrollToTop } from "@/components/scroll-to-top";

export default function Home() {
  return (
    <>
      <ScrollToTop resetKey="setup" />
      <GameSetup />
    </>
  );
}
