import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { getCachedMetadata } from "@/backend/helpers/providerApi";
import { Toggle } from "@/components/buttons/Toggle";
import { Icon, Icons } from "@/components/Icon";
import { useCaptions } from "@/components/player/hooks/useCaptions";
import { Menu } from "@/components/player/internals/ContextMenu";
import { useOverlayRouter } from "@/hooks/useOverlayRouter";
import { usePlayerStore } from "@/stores/player/store";
import { qualityToString } from "@/stores/player/utils/qualities";
import { useSubtitleStore } from "@/stores/subtitles";
import { getPrettyLanguageNameFromLocale } from "@/utils/language";

export function SettingsMenu({ id }: { id: string }) {
  const { t } = useTranslation();
  const router = useOverlayRouter(id);
  const currentQuality = usePlayerStore((s) => s.currentQuality);
  const currentAudioTrack = usePlayerStore((s) => s.currentAudioTrack);
  const selectedCaptionLanguage = usePlayerStore(
    (s) => s.caption.selected?.language,
  );
  const subtitlesEnabled = useSubtitleStore((s) => s.enabled);
  const currentSourceId = usePlayerStore((s) => s.sourceId);
  const sourceName = useMemo(() => {
    if (!currentSourceId) return "...";
    const source = getCachedMetadata().find(
      (src) => src.id === currentSourceId,
    );
    return source?.name ?? "...";
  }, [currentSourceId]);
  const { toggleLastUsed } = useCaptions();

  const selectedLanguagePretty = selectedCaptionLanguage
    ? getPrettyLanguageNameFromLocale(selectedCaptionLanguage) ??
      t("player.menus.subtitles.unknownLanguage")
    : undefined;

  const selectedAudioLanguagePretty = currentAudioTrack
    ? getPrettyLanguageNameFromLocale(currentAudioTrack.language) ??
      t("player.menus.subtitles.unknownLanguage")
    : undefined;

  const source = usePlayerStore((s) => s.source);

  const downloadable = source?.type === "file" || source?.type === "hls";

  return (
    <Menu.Card>
      <Menu.SectionTitle>
        {t("player.menus.settings.videoSection")}
      </Menu.SectionTitle>
      <Menu.Section>
        <Menu.ChevronLink
          onClick={() => router.navigate("/quality")}
          rightText={currentQuality ? qualityToString(currentQuality) : ""}
        >
          {t("player.menus.settings.qualityItem")}
        </Menu.ChevronLink>
        {currentAudioTrack && (
          <Menu.ChevronLink
            onClick={() => router.navigate("/audio")}
            rightText={selectedAudioLanguagePretty ?? undefined}
          >
            {t("player.menus.settings.audioItem")}
          </Menu.ChevronLink>
        )}

        <Menu.ChevronLink
          onClick={() => router.navigate("/source")}
          rightText={sourceName}
        >
          {t("player.menus.settings.sourceItem")}
        </Menu.ChevronLink>
        <Menu.Link
          clickable
          onClick={() =>
            router.navigate(downloadable ? "/download" : "/download/unable")
          }
          rightSide={<Icon className="text-xl" icon={Icons.DOWNLOAD} />}
          className={downloadable ? "opacity-100" : "opacity-50"}
        >
          {t("player.menus.settings.downloadItem")}
        </Menu.Link>
      </Menu.Section>

      <Menu.SectionTitle>
        {t("player.menus.settings.experienceSection")}
      </Menu.SectionTitle>
      <Menu.Section>
        <Menu.Link
          rightSide={
            <Toggle
              enabled={subtitlesEnabled}
              onClick={() => toggleLastUsed().catch(() => {})}
            />
          }
        >
          {t("player.menus.settings.enableSubtitles")}
        </Menu.Link>
        <Menu.ChevronLink
          onClick={() => router.navigate("/captions")}
          rightText={selectedLanguagePretty ?? undefined}
        >
          {t("player.menus.settings.subtitleItem")}
        </Menu.ChevronLink>
        <Menu.ChevronLink onClick={() => router.navigate("/playback")}>
          {t("player.menus.settings.playbackItem")}
        </Menu.ChevronLink>
      </Menu.Section>
    </Menu.Card>
  );
}
