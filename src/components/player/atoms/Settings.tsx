import { useEffect, useState } from "react";

import { Icons } from "@/components/Icon";
import { OverlayAnchor } from "@/components/overlays/OverlayAnchor";
import { Overlay } from "@/components/overlays/OverlayDisplay";
import { OverlayPage } from "@/components/overlays/OverlayPage";
import { OverlayRouter } from "@/components/overlays/OverlayRouter";
import {
  EmbedSelectionView,
  SourceSelectionView,
} from "@/components/player/atoms/settings/SourceSelectingView";
import { VideoPlayerButton } from "@/components/player/internals/Button";
import { Menu } from "@/components/player/internals/ContextMenu";
import { useOverlayRouter } from "@/hooks/useOverlayRouter";
import { usePlayerStore } from "@/stores/player/store";

import { AudioView } from "./settings/AudioView";
import { CaptionSettingsView } from "./settings/CaptionSettingsView";
import { CaptionsView } from "./settings/CaptionsView";
import { DownloadRoutes } from "./settings/Downloads";
import { PlaybackSettingsView } from "./settings/PlaybackSettingsView";
import { QualityView } from "./settings/QualityView";
import { SettingsMenu } from "./settings/SettingsMenu";

function SettingsOverlay({ id }: { id: string }) {
  const [chosenSourceId, setChosenSourceId] = useState<string | null>(null);
  const router = useOverlayRouter(id);

  // reset source id when going to home or closing overlay
  useEffect(() => {
    if (!router.isRouterActive) {
      setChosenSourceId(null);
    }
    if (router.route === "/") {
      setChosenSourceId(null);
    }
  }, [router.isRouterActive, router.route]);

  return (
    <Overlay id={id}>
      <OverlayRouter id={id}>
        <OverlayPage id={id} path="/" width={343} height={431}>
          <SettingsMenu id={id} />
        </OverlayPage>
        <OverlayPage id={id} path="/quality" width={343} height={400}>
          <Menu.Card>
            <QualityView id={id} />
          </Menu.Card>
        </OverlayPage>
        <OverlayPage id={id} path="/audio" width={343} height={431}>
          <Menu.Card>
            <AudioView id={id} />
          </Menu.Card>
        </OverlayPage>
        <OverlayPage id={id} path="/captions" width={343} height={431}>
          <Menu.CardWithScrollable>
            <CaptionsView id={id} />
          </Menu.CardWithScrollable>
        </OverlayPage>
        <OverlayPage id={id} path="/captions/settings" width={343} height={450}>
          <Menu.Card>
            <CaptionSettingsView id={id} />
          </Menu.Card>
        </OverlayPage>
        <OverlayPage id={id} path="/source" width={343} height={431}>
          <Menu.CardWithScrollable>
            <SourceSelectionView id={id} onChoose={setChosenSourceId} />
          </Menu.CardWithScrollable>
        </OverlayPage>
        <OverlayPage id={id} path="/source/embeds" width={343} height={431}>
          <Menu.CardWithScrollable>
            <EmbedSelectionView id={id} sourceId={chosenSourceId} />
          </Menu.CardWithScrollable>
        </OverlayPage>
        <OverlayPage id={id} path="/playback" width={343} height={215}>
          <Menu.Card>
            <PlaybackSettingsView id={id} />
          </Menu.Card>
        </OverlayPage>
        <DownloadRoutes id={id} />
      </OverlayRouter>
    </Overlay>
  );
}

export function SettingsRouter() {
  return <SettingsOverlay id="settings" />;
}

export function Settings() {
  const router = useOverlayRouter("settings");
  const setHasOpenOverlay = usePlayerStore((s) => s.setHasOpenOverlay);

  useEffect(() => {
    setHasOpenOverlay(router.isRouterActive);
  }, [setHasOpenOverlay, router.isRouterActive]);

  return (
    <OverlayAnchor id={router.id}>
      <VideoPlayerButton onClick={() => router.open()} icon={Icons.GEAR} />
    </OverlayAnchor>
  );
}
