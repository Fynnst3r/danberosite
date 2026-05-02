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
        aTitle="Less Spooky"
        bTitle="Shiver me timbers"
        trackA="/music/Luigis Mansion Music - Mansion (Luigi Humming High Health).mp3"
        trackB="/music/Luigis Mansion - Mansion (Dark Hallway).mp3"
      ></AudioPlayer>
	  <hr />
      <AudioPlayer
        trackTitle="New Soup"
        crossTitle="Which Hell"
        aTitle="WIIIIII"
        bTitle="UUUUUUU"
        trackA="/music/Overworld Theme - New Super Mario Bros. Wii.mp3"
        trackB="/music/Overworld Theme - New Super Mario Bros. U.mp3"
      ></AudioPlayer>
    </main>
  );
}
