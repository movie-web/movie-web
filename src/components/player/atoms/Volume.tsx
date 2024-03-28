import { useCallback, useRef } from "react";

import { Icon, Icons } from "@/components/Icon";
import {
  makePercentage,
  makePercentageString,
  useProgressBar,
} from "@/hooks/useProgressBar";
import { usePlayerStore } from "@/stores/player/store";
import { canChangeVolume } from "@/utils/detectFeatures";

import { useVolume } from "../hooks/useVolume";

interface Props {
  className?: string;
}

export function Volume(props: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const setHovering = usePlayerStore((s) => s.setHoveringLeftControls);
  const hovering = usePlayerStore((s) => s.interface.leftControlHovering);
  const volume = usePlayerStore((s) => s.mediaPlaying.volume);
  const { setVolume, toggleMute } = useVolume();

  const commitVolume = useCallback(
    (percentage: number) => {
      setVolume(percentage);
    },
    [setVolume],
  );

  const { dragging, dragPercentage, dragMouseDown } = useProgressBar(
    ref,
    commitVolume,
    true,
  );

  const handleClick = useCallback(() => {
    toggleMute();
  }, [toggleMute]);

  const handleMouseEnter = useCallback(async () => {
    if (await canChangeVolume()) setHovering(true);
    document.body.classList.add("overflow-y-hidden");
  }, [setHovering]);

  const handleMouseLeave = () => {
    document.body.classList.remove("overflow-y-hidden");
  };

  let percentage = makePercentage(volume * 100);
  if (dragging) percentage = makePercentage(dragPercentage);
  const percentageString = makePercentageString(percentage);

  const handleWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      event.preventDefault();
      let newVolume = volume - event.deltaY / 1000;
      newVolume = Math.max(0, Math.min(newVolume, 1));
      setVolume(newVolume);
    },
    [volume, setVolume],
  );

  return (
    <div
      className={props.className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
    >
      <div className="pointer-events-auto flex cursor-pointer items-center py-0 touch-none">
        <div className="px-4 text-2xl text-white" onClick={handleClick}>
          <Icon icon={percentage > 0 ? Icons.VOLUME : Icons.VOLUME_X} />
        </div>
        <div
          className={`linear -ml-2 w-0 overflow-hidden transition-[width,opacity] duration-300 ${
            hovering || dragging ? "!w-24 opacity-100" : "w-4 opacity-0"
          }`}
        >
          <div
            ref={ref}
            className="flex h-10 w-20 items-center px-2"
            onMouseDown={dragMouseDown}
            onTouchStart={dragMouseDown}
          >
            <div className="relative h-1 flex-1 rounded-full bg-gray-500 bg-opacity-50">
              <div
                className="absolute inset-y-0 left-0 flex items-center justify-end rounded-full bg-video-audio-set"
                style={{
                  width: percentageString,
                }}
              >
                <div className="absolute h-3 w-3 translate-x-1/2 rounded-full bg-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
