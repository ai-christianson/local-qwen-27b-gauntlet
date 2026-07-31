import React from "react";
import {Composition} from "remotion";
import {QwenGauntletVideo} from "./video";

export const Root: React.FC = () => (
  <Composition
    id="QwenGauntlet"
    component={QwenGauntletVideo}
    durationInFrames={5040}
    fps={60}
    width={1920}
    height={1080}
  />
);
