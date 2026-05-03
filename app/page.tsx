"use client";

import Banner from "@/components/Banner";
import dynamic from "next/dynamic";
const AudioPlayer = dynamic(() => import("@/components/AudioPlayer"), {
  ssr: false,
});
export default function Home() {
  return (
    <main>
      <Banner></Banner>
        <AudioPlayer
          trackTitle="Super Luigi House"
          crossTitle="Spook-o-meter (Crossfade)"
          aTitle="Humming"
          bTitle="Dark Room"
          trackA="/music/Luigis Mansion Music - Mansion (Luigi Humming High Health).mp3"
          trackB="/music/Luigis Mansion - Mansion (Dark Hallway).mp3"
          colorA="#4caf6d"
          colorB="#ac4caf"
        ></AudioPlayer>
      <hr />
        <AudioPlayer
          trackTitle="New Soup"
          crossTitle="Which Hell"
          aTitle="WIIIIII"
          bTitle="UUUUUUU"
          trackA="/music/Overworld Theme - New Super Mario Bros. Wii.mp3"
          trackB="/music/Overworld Theme - New Super Mario Bros. U.mp3"
          colorA="#b53518"
          colorB="#1f9acf"
        ></AudioPlayer>
    </main>
  );
}
