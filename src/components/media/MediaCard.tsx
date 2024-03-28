import classNames from "classnames";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { mediaItemToId } from "@/backend/metadata/tmdb";
import { DotList } from "@/components/text/DotList";
import { Flare } from "@/components/utils/Flare";
import { MediaItem } from "@/utils/mediaTypes";

import { IconPatch } from "../buttons/IconPatch";
import { Icons } from "../Icon";

export interface MediaCardProps {
  media: MediaItem;
  linkable?: boolean;
  series?: {
    episode: number;
    season?: number;
    episodeId: string;
    seasonId: string;
  };
  percentage?: number;
  closable?: boolean;
  onClose?: () => void;
}

function checkReleased(media: MediaItem): boolean {
  const isReleasedYear = Boolean(
    media.year && media.year <= new Date().getFullYear(),
  );
  const isReleasedDate = Boolean(
    media.release_date && media.release_date <= new Date(),
  );

  // If the media has a release date, use that, otherwise use the year
  const isReleased = media.release_date ? isReleasedDate : isReleasedYear;

  return isReleased;
}

function MediaCardContent({
  media,
  linkable,
  series,
  percentage,
  closable,
  onClose,
}: MediaCardProps) {
  const { t } = useTranslation();
  const percentageString = `${Math.round(percentage ?? 0).toFixed(0)}%`;

  const isReleased = useCallback(() => checkReleased(media), [media]);

  const canLink = linkable && !closable && isReleased();

  const dotListContent = [t(`media.types.${media.type}`)];

  if (media.year) {
    dotListContent.push(media.year.toFixed());
  }

  if (!isReleased()) {
    dotListContent.push(t("media.unreleased"));
  }

  return (
    <Flare.Base
      className={`group -m-3 mb-2 rounded-xl bg-background-main transition-colors duration-100 focus:relative focus:z-10 ${
        canLink ? "hover:bg-mediaCard-hoverBackground tabbable" : ""
      }`}
      tabIndex={canLink ? 0 : -1}
      onKeyUp={(e) => e.key === "Enter" && e.currentTarget.click()}
    >
      <Flare.Light
        flareSize={300}
        cssColorVar="--colors-mediaCard-hoverAccent"
        backgroundClass="bg-mediaCard-hoverBackground duration-100"
        className={classNames({
          "rounded-xl bg-background-main group-hover:opacity-100": canLink,
        })}
      />
      <Flare.Child
        className={`pointer-events-auto relative mb-2 p-3 transition-transform duration-100 ${
          canLink ? "group-hover:scale-95" : "opacity-60"
        }`}
      >
        <div
          className={classNames(
            "relative mb-4 pb-[150%] w-full overflow-hidden rounded-xl bg-mediaCard-hoverBackground bg-cover bg-center transition-[border-radius] duration-100",
            {
              "group-hover:rounded-lg": canLink,
            },
          )}
          style={{
            backgroundImage: media.poster ? `url(${media.poster})` : undefined,
          }}
        >
          {series ? (
            <div
              className={[
                "absolute right-2 top-2 rounded-md bg-mediaCard-badge px-2 py-1 transition-colors",
              ].join(" ")}
            >
              <p
                className={[
                  "text-center text-xs font-bold text-mediaCard-badgeText transition-colors",
                  closable ? "" : "group-hover:text-white",
                ].join(" ")}
              >
                {t("media.episodeDisplay", {
                  season: series.season || 1,
                  episode: series.episode,
                })}
              </p>
            </div>
          ) : null}

          {percentage !== undefined ? (
            <>
              <div
                className={`absolute inset-x-0 -bottom-px pb-1 h-12 bg-gradient-to-t from-mediaCard-shadow to-transparent transition-colors ${
                  canLink ? "group-hover:from-mediaCard-hoverShadow" : ""
                }`}
              />
              <div
                className={`absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-mediaCard-shadow to-transparent transition-colors ${
                  canLink ? "group-hover:from-mediaCard-hoverShadow" : ""
                }`}
              />
              <div className="absolute inset-x-0 bottom-0 p-3">
                <div className="relative h-1 overflow-hidden rounded-full bg-mediaCard-barColor">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-mediaCard-barFillColor"
                    style={{
                      width: percentageString,
                    }}
                  />
                </div>
              </div>
            </>
          ) : null}

          <div
            className={`absolute inset-0 flex items-center justify-center bg-mediaCard-badge bg-opacity-80 transition-opacity duration-200 ${
              closable ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <IconPatch
              clickable
              className="text-2xl text-mediaCard-badgeText"
              onClick={() => closable && onClose?.()}
              icon={Icons.X}
            />
          </div>
        </div>
        <h1 className="mb-1 line-clamp-3 max-h-[4.5rem] text-ellipsis break-words font-bold text-white">
          <span>{media.title}</span>
        </h1>
        <DotList className="text-xs" content={dotListContent} />
      </Flare.Child>
    </Flare.Base>
  );
}

export function MediaCard(props: MediaCardProps) {
  const content = <MediaCardContent {...props} />;

  const isReleased = useCallback(
    () => checkReleased(props.media),
    [props.media],
  );

  const canLink = props.linkable && !props.closable && isReleased();

  let link = canLink
    ? `/media/${encodeURIComponent(mediaItemToId(props.media))}`
    : "#";
  if (canLink && props.series) {
    if (props.series.season === 0 && !props.series.episodeId) {
      link += `/${encodeURIComponent(props.series.seasonId)}`;
    } else {
      link += `/${encodeURIComponent(
        props.series.seasonId,
      )}/${encodeURIComponent(props.series.episodeId)}`;
    }
  }

  if (!canLink) return <span>{content}</span>;
  return (
    <Link
      to={link}
      tabIndex={-1}
      className={classNames(
        "tabbable",
        props.closable ? "hover:cursor-default" : "",
      )}
    >
      {content}
    </Link>
  );
}
