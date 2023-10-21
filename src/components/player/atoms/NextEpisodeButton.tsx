import classNames from "classnames";
import { useCallback } from "react";

import { Icon, Icons } from "@/components/Icon";
import { usePlayerMeta } from "@/components/player/hooks/usePlayerMeta";
import { Transition } from "@/components/Transition";
import { PlayerMeta } from "@/stores/player/slices/source";
import { usePlayerStore } from "@/stores/player/store";

function shouldShowNextEpisodeButton(
  time: number,
  duration: number
): "always" | "hover" | "none" {
  const percentage = time / duration;
  const secondsFromEnd = duration - time;
  if (secondsFromEnd <= 30) return "always";
  if (percentage >= 0.9) return "hover";
  return "none";
}

function Button(props: {
  className: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className={classNames(
        "font-bold rounded h-10 w-40 scale-95 hover:scale-100 transition-all duration-200",
        props.className
      )}
      type="button"
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}

export function NextEpisodeButton(props: {
  controlsShowing: boolean;
  onChange?: (meta: PlayerMeta) => void;
}) {
  const duration = usePlayerStore((s) => s.progress.duration);
  const isHidden = usePlayerStore((s) => s.interface.hideNextEpisodeBtn);
  const meta = usePlayerStore((s) => s.meta);
  const { setDirectMeta } = usePlayerMeta();
  const hideNextEpisodeButton = usePlayerStore((s) => s.hideNextEpisodeButton);
  const metaType = usePlayerStore((s) => s.meta?.type);
  const time = usePlayerStore((s) => s.progress.time);
  const showingState = shouldShowNextEpisodeButton(time, duration);
  const status = usePlayerStore((s) => s.status);

  let show = false;
  if (showingState === "always") show = true;
  else if (showingState === "hover" && props.controlsShowing) show = true;
  if (isHidden || status !== "playing" || duration === 0) show = false;

  const animation = showingState === "hover" ? "slide-up" : "fade";
  let bottom = "bottom-24";
  if (showingState === "always")
    bottom = props.controlsShowing ? "bottom-24" : "bottom-12";

  const nextEp = meta?.episodes?.find(
    (v) => v.number === (meta?.episode?.number ?? 0) + 1
  );

  const loadNextEpisode = useCallback(() => {
    if (!meta || !nextEp) return;
    const metaCopy = { ...meta };
    metaCopy.episode = nextEp;
    setDirectMeta(metaCopy);
    props.onChange?.(metaCopy);
  }, [setDirectMeta, nextEp, meta, props]);

  if (!meta?.episode || !nextEp) return null;
  if (metaType !== "show") return null;

  return (
    <Transition
      animation={animation}
      show={show}
      className="absolute right-12 bottom-0"
    >
      <div
        className={classNames([
          "absolute bottom-0 right-0 transition-[bottom] duration-200 flex space-x-3",
          bottom,
        ])}
      >
        <Button
          className="bg-video-buttons-secondary hover:bg-video-buttons-secondaryHover bg-opacity-90 text-video-buttons-secondaryText"
          onClick={hideNextEpisodeButton}
        >
          Cancel
        </Button>
        <Button
          onClick={() => loadNextEpisode()}
          className="bg-video-buttons-primary hover:bg-video-buttons-primaryHover text-video-buttons-primaryText flex justify-center items-center"
        >
          <Icon className="text-xl mr-1" icon={Icons.SKIP_EPISODE} />
          Next episode
        </Button>
      </div>
    </Transition>
  );
}