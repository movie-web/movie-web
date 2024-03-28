import fscreen from "fscreen";

import { MWMediaType } from "@/backend/metadata/types/mw";
import {
  DisplayCaption,
  DisplayInterface,
  DisplayInterfaceEvents,
  DisplayMeta,
} from "@/components/player/display/displayInterface";
import { LoadableSource } from "@/stores/player/utils/qualities";
import { processCdnLink } from "@/utils/cdn";
import {
  canChangeVolume,
  canFullscreen,
  canFullscreenAnyElement,
} from "@/utils/detectFeatures";
import { makeEmitter } from "@/utils/events";

export interface ChromeCastDisplayInterfaceOptions {
  controller: cast.framework.RemotePlayerController;
  player: cast.framework.RemotePlayer;
  instance: cast.framework.CastContext;
}

/*
 ** Chromecasting is unfinished, here is its limitations:
 **  1. Captions - chromecast requires only VTT, but needs it from a URL. we only have SRT urls
 **  2. HLS - we've having some issues with content types. sometimes it loads, sometimes it doesn't
 */

export function makeChromecastDisplayInterface(
  ops: ChromeCastDisplayInterfaceOptions,
): DisplayInterface {
  const { emit, on, off } = makeEmitter<DisplayInterfaceEvents>();
  let isPaused = false;
  let playbackRate = 1;
  let source: LoadableSource | null = null;
  let videoElement: HTMLVideoElement | null = null;
  let containerElement: HTMLElement | null = null;
  let isFullscreen = false;
  let isPausedBeforeSeeking = false;
  let isSeeking = false;
  let startAt = 0;
  let meta: DisplayMeta = {
    title: "",
    type: MWMediaType.MOVIE,
  };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let caption: DisplayCaption | null = null;

  function listenForEvents() {
    const listen = async (e: cast.framework.RemotePlayerChangedEvent) => {
      switch (e.field) {
        case "volumeLevel":
          if (await canChangeVolume()) emit("volumechange", e.value);
          break;
        case "currentTime":
          emit("time", e.value);
          break;
        case "duration":
          emit("duration", e.value ?? 0);
          break;
        case "mediaInfo":
          if (e.value) emit("duration", e.value.duration ?? 0);
          break;
        case "playerState":
          emit("loading", e.value === "BUFFERING");
          if (e.value === "PLAYING") emit("play", undefined);
          else if (e.value === "PAUSED") emit("pause", undefined);
          isPaused = e.value === "PAUSED";
          break;
        case "isMuted":
          emit("volumechange", e.value ? 1 : 0);
          break;
        case "displayStatus":
        case "canSeek":
        case "title":
        case "isPaused":
        case "canPause":
        case "isMediaLoaded":
        case "statusText":
        case "isConnected":
        case "displayName":
        case "canControlVolume":
        case "savedPlayerState":
          break;
        default:
          break;
      }
    };
    ops.controller?.addEventListener(
      cast.framework.RemotePlayerEventType.ANY_CHANGE,
      listen,
    );
    return () => {
      ops.controller?.removeEventListener(
        cast.framework.RemotePlayerEventType.ANY_CHANGE,
        listen,
      );
    };
  }

  function setupSource() {
    if (!source) {
      ops.controller?.stop();
      return;
    }

    let type = "video/mp4";
    if (source.type === "hls") type = "application/x-mpegurl";

    const metaData = new chrome.cast.media.GenericMediaMetadata();
    metaData.title = meta.title;

    const mediaInfo = new chrome.cast.media.MediaInfo("video", type);
    (mediaInfo as any).contentUrl = processCdnLink(source.url);
    mediaInfo.streamType = chrome.cast.media.StreamType.BUFFERED;
    mediaInfo.metadata = metaData;
    mediaInfo.customData = {
      playbackRate,
    };

    const request = new chrome.cast.media.LoadRequest(mediaInfo);
    request.autoplay = true;
    request.currentTime = startAt;

    if (source.type === "hls") {
      const staticMedia = chrome.cast.media as any;
      const media = request.media as any;
      media.hlsSegmentFormat = staticMedia.HlsSegmentFormat.FMP4;
      media.hlsVideoSegmentFormat = staticMedia.HlsVideoSegmentFormat.FMP4;
    }

    const session = ops.instance.getCurrentSession();
    session?.loadMedia(request);
  }

  function setSource() {
    if (!videoElement || !source) return;
    setupSource();
  }

  function destroyVideoElement() {
    if (videoElement) videoElement = null;
  }

  function fullscreenChange() {
    isFullscreen =
      !!document.fullscreenElement || // other browsers
      !!(document as any).webkitFullscreenElement; // safari
    emit("fullscreen", isFullscreen);
    if (!isFullscreen) emit("needstrack", false);
  }
  fscreen.addEventListener("fullscreenchange", fullscreenChange);

  // start listening immediately
  const stopListening = listenForEvents();

  return {
    on,
    off,
    getType() {
      return "casting";
    },
    destroy: () => {
      stopListening();
      destroyVideoElement();
      fscreen.removeEventListener("fullscreenchange", fullscreenChange);
    },
    load(loadOps) {
      source = loadOps.source;
      emit("loading", true);
      startAt = loadOps.startAt;
      setSource();
    },
    changeQuality() {
      // cant control qualities
    },
    setCaption(newCaption) {
      caption = newCaption;
      setSource();
    },

    processVideoElement(video) {
      destroyVideoElement();
      videoElement = video;
      setSource();
    },
    processContainerElement(container) {
      containerElement = container;
    },
    setMeta(data) {
      meta = data;
      setSource();
    },

    pause() {
      if (!isPaused) {
        ops.controller.playOrPause();
        isPaused = true;
      }
    },
    play() {
      if (isPaused) {
        ops.controller.playOrPause();
        isPaused = false;
      }
    },
    setSeeking(active) {
      if (active === isSeeking) return;
      isSeeking = active;

      // if it was playing when starting to seek, play again
      if (!active) {
        if (!isPausedBeforeSeeking) this.play();
        return;
      }

      isPausedBeforeSeeking = isPaused ?? true;
      this.pause();
    },
    setTime(t) {
      if (!videoElement) return;
      // clamp time between 0 and max duration
      let time = Math.min(t, ops.player.duration);
      time = Math.max(0, time);

      if (Number.isNaN(time)) return;
      emit("time", time);
      ops.player.currentTime = time;
      ops.controller.seek();
    },
    async setVolume(v) {
      // clamp time between 0 and 1
      let volume = Math.min(v, 1);
      volume = Math.max(0, volume);

      // update state
      const isChangeable = await canChangeVolume();
      if (isChangeable) {
        ops.player.volumeLevel = volume;
        ops.controller.setVolumeLevel();
        emit("volumechange", volume);
      } else {
        // For browsers where it can't be changed
        emit("volumechange", volume === 0 ? 0 : 1);
      }
    },
    toggleFullscreen() {
      if (isFullscreen) {
        isFullscreen = false;
        emit("fullscreen", isFullscreen);
        emit("needstrack", false);
        if (!fscreen.fullscreenElement) return;
        fscreen.exitFullscreen();
        return;
      }

      // enter fullscreen
      isFullscreen = true;
      emit("fullscreen", isFullscreen);
      if (!canFullscreen() || fscreen.fullscreenElement) return;
      if (canFullscreenAnyElement()) {
        if (containerElement) fscreen.requestFullscreen(containerElement);
      }
    },
    togglePictureInPicture() {
      // Can't PIP while Chromecasting
    },
    startAirplay() {
      // cant airplay while chromecasting
    },
    setPlaybackRate(rate) {
      playbackRate = rate;
      setSource();
    },
    getCaptionList() {
      return [];
    },
    getSubtitleTracks() {
      return [];
    },
    async setSubtitlePreference() {
      return Promise.resolve();
    },
    changeAudioTrack() {
      // cant change audio tracks
    },
  };
}
