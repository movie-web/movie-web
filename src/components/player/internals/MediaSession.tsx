import { useCallback, useEffect, useRef } from "react";

import { usePlayerStore } from "@/stores/player/store";

import { usePlayerMeta } from "../hooks/usePlayerMeta";

export function MediaSession() {
  const { setDirectMeta } = usePlayerMeta();
  const setShouldStartFromBeginning = usePlayerStore(
    (s) => s.setShouldStartFromBeginning,
  );

  const shouldUpdatePositionState = useRef(false);
  const lastPlaybackPosition = useRef(0);

  const data = usePlayerStore.getState();

  const changeEpisode = useCallback(
    (change: number) => {
      const nextEp = data.meta?.episodes?.find(
        (v) => v.number === (data.meta?.episode?.number ?? 0) + change,
      );

      if (!data.meta || !nextEp) return;
      const metaCopy = { ...data.meta };
      metaCopy.episode = nextEp;
      setShouldStartFromBeginning(true);
      setDirectMeta(metaCopy);
    },
    [data.meta, setDirectMeta, setShouldStartFromBeginning],
  );

  const updatePositionState = useCallback(
    (position: number) => {
      // If the browser doesn't support setPositionState, return
      if (typeof navigator.mediaSession.setPositionState !== "function") return;

      // If the updated position needs to be buffered, queue an update
      if (position > data.progress.buffered) {
        shouldUpdatePositionState.current = true;
      }
      if (position > data.progress.duration) return;

      lastPlaybackPosition.current = data.progress.time;
      navigator.mediaSession.setPositionState({
        duration: data.progress.duration,
        playbackRate: data.mediaPlaying.playbackRate,
        position,
      });
    },
    [
      data.mediaPlaying.playbackRate,
      data.progress.buffered,
      data.progress.duration,
      data.progress.time,
    ],
  );

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    // If the media is paused, update the navigator
    if (data.mediaPlaying.isPaused) {
      navigator.mediaSession.playbackState = "paused";
    } else {
      navigator.mediaSession.playbackState = "playing";
    }
  }, [data.mediaPlaying.isPaused]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    updatePositionState(data.progress.time);
  }, [data.progress.time, data.mediaPlaying.playbackRate, updatePositionState]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    // If not already updating the position state, and the media is loading, queue an update
    if (!shouldUpdatePositionState.current && data.mediaPlaying.isLoading) {
      shouldUpdatePositionState.current = true;
    }

    // If the user has skipped (or MediaSession desynced) by more than 5 seconds, queue an update
    if (
      Math.abs(data.progress.time - lastPlaybackPosition.current) >= 5 &&
      !data.mediaPlaying.isLoading &&
      !shouldUpdatePositionState.current
    ) {
      shouldUpdatePositionState.current = true;
    }

    // If not loading and the position state is queued, update it
    if (shouldUpdatePositionState.current && !data.mediaPlaying.isLoading) {
      shouldUpdatePositionState.current = false;
      updatePositionState(data.progress.time);
    }

    lastPlaybackPosition.current = data.progress.time;
  }, [updatePositionState, data.progress.time, data.mediaPlaying.isLoading]);

  useEffect(() => {
    if (
      !("mediaSession" in navigator) ||
      (!data.mediaPlaying.isLoading &&
        data.mediaPlaying.isPlaying &&
        !data.display)
    )
      return;

    let title: string | undefined;
    let artist: string | undefined;

    if (data.meta?.type === "movie") {
      title = data.meta?.title;
    } else if (data.meta?.type === "show") {
      artist = data.meta?.title;
      title = `S${data.meta?.season?.number} E${data.meta?.episode?.number}: ${data.meta?.episode?.title}`;
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist,
      artwork: [
        {
          src: data.meta?.poster ?? "",
          sizes: "342x513",
          type: "image/png",
        },
      ],
    });

    navigator.mediaSession.setActionHandler("play", () => {
      if (data.mediaPlaying.isLoading) return;
      data.display?.play();

      updatePositionState(data.progress.time);
    });

    navigator.mediaSession.setActionHandler("pause", () => {
      if (data.mediaPlaying.isLoading) return;
      data.display?.pause();

      updatePositionState(data.progress.time);
    });

    navigator.mediaSession.setActionHandler("seekto", (e) => {
      if (!e.seekTime) return;
      data.display?.setTime(e.seekTime);
      updatePositionState(e.seekTime);
    });

    if ((data.meta?.episode?.number ?? 1) !== 1) {
      navigator.mediaSession.setActionHandler("previoustrack", () => {
        changeEpisode(-1);
      });
    } else {
      navigator.mediaSession.setActionHandler("previoustrack", null);
    }

    if (data.meta?.episode?.number !== data.meta?.episodes?.length) {
      navigator.mediaSession.setActionHandler("nexttrack", () => {
        changeEpisode(1);
      });
    } else {
      navigator.mediaSession.setActionHandler("nexttrack", null);
    }
  }, [
    changeEpisode,
    updatePositionState,
    data.mediaPlaying.hasPlayedOnce,
    data.mediaPlaying.isLoading,
    data.progress.duration,
    data.progress.time,
    data.meta?.episode?.number,
    data.meta?.episodes?.length,
    data.display,
    data.mediaPlaying,
    data.meta?.episode?.title,
    data.meta?.title,
    data.meta?.type,
    data.meta?.poster,
    data.meta?.season?.number,
  ]);
  return null;
}
