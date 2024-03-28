import { FetchError } from "ofetch";

import { formatJWMeta, mediaTypeToJW } from "./justwatch";
import {
  TMDBIdToUrlId,
  TMDBMediaToMediaType,
  formatTMDBMeta,
  getEpisodes,
  getMediaDetails,
  getMediaPoster,
  getMovieFromExternalId,
  mediaTypeToTMDB,
} from "./tmdb";
import {
  JWDetailedMeta,
  JWSeasonMetaResult,
  JW_API_BASE,
} from "./types/justwatch";
import { MWMediaMeta, MWMediaType } from "./types/mw";
import {
  TMDBContentTypes,
  TMDBMediaResult,
  TMDBMovieData,
  TMDBSeasonMetaResult,
  TMDBShowData,
} from "./types/tmdb";
import { makeUrl, proxiedFetch } from "../helpers/fetch";

export interface DetailedMeta {
  meta: MWMediaMeta;
  imdbId?: string;
  tmdbId?: string;
}

export function formatTMDBMetaResult(
  details: TMDBShowData | TMDBMovieData,
  type: MWMediaType,
): TMDBMediaResult {
  if (type === MWMediaType.MOVIE) {
    const movie = details as TMDBMovieData;
    return {
      id: details.id,
      title: movie.title,
      object_type: mediaTypeToTMDB(type),
      poster: getMediaPoster(movie.poster_path) ?? undefined,
      original_release_date: new Date(movie.release_date),
    };
  }
  if (type === MWMediaType.SERIES) {
    const show = details as TMDBShowData;
    return {
      id: details.id,
      title: show.name,
      object_type: mediaTypeToTMDB(type),
      seasons: show.seasons.map((v) => ({
        id: v.id,
        season_number: v.season_number,
        title: v.name,
      })),
      poster: getMediaPoster(show.poster_path) ?? undefined,
      original_release_date: new Date(show.first_air_date),
    };
  }

  throw new Error("unsupported type");
}

export async function getMetaFromId(
  type: MWMediaType,
  id: string,
  seasonId?: string,
): Promise<DetailedMeta | null> {
  const details = await getMediaDetails(id, mediaTypeToTMDB(type));

  if (!details) return null;

  const imdbId = details.external_ids.imdb_id ?? undefined;

  let seasonData: TMDBSeasonMetaResult | undefined;

  if (type === MWMediaType.SERIES) {
    const seasons = (details as TMDBShowData).seasons;

    let selectedSeason = seasons.find((v) => v.id.toString() === seasonId);
    if (!selectedSeason) {
      selectedSeason = seasons.find((v) => v.season_number === 1);
    }

    if (selectedSeason) {
      const episodes = await getEpisodes(
        details.id.toString(),
        selectedSeason.season_number,
      );

      seasonData = {
        id: selectedSeason.id.toString(),
        season_number: selectedSeason.season_number,
        title: selectedSeason.name,
        episodes,
      };
    }
  }

  const tmdbmeta = formatTMDBMetaResult(details, type);
  if (!tmdbmeta) return null;
  const meta = formatTMDBMeta(tmdbmeta, seasonData);
  if (!meta) return null;

  return {
    meta,
    imdbId,
    tmdbId: id,
  };
}

export async function getLegacyMetaFromId(
  type: MWMediaType,
  id: string,
  seasonId?: string,
): Promise<DetailedMeta | null> {
  const queryType = mediaTypeToJW(type);

  let data: JWDetailedMeta;
  try {
    const url = makeUrl("/content/titles/{type}/{id}/locale/en_US", {
      type: queryType,
      id,
    });
    data = await proxiedFetch<JWDetailedMeta>(url, { baseURL: JW_API_BASE });
  } catch (err) {
    if (err instanceof FetchError) {
      // 400 and 404 are treated as not found
      if (err.statusCode === 400 || err.statusCode === 404) return null;
    }
    throw err;
  }

  let imdbId = data.external_ids.find((v) => v.provider === "imdb_latest")
    ?.external_id;
  if (!imdbId)
    imdbId = data.external_ids.find((v) => v.provider === "imdb")?.external_id;

  let tmdbId = data.external_ids.find((v) => v.provider === "tmdb_latest")
    ?.external_id;
  if (!tmdbId)
    tmdbId = data.external_ids.find((v) => v.provider === "tmdb")?.external_id;

  let seasonData: JWSeasonMetaResult | undefined;
  if (data.object_type === "show") {
    const seasonToScrape = seasonId ?? data.seasons?.[0].id.toString() ?? "";
    const url = makeUrl("/content/titles/show_season/{id}/locale/en_US", {
      id: seasonToScrape,
    });
    seasonData = await proxiedFetch<any>(url, { baseURL: JW_API_BASE });
  }

  return {
    meta: formatJWMeta(data, seasonData),
    imdbId,
    tmdbId,
  };
}

export function isLegacyUrl(url: string): boolean {
  if (url.startsWith("/media/JW") || url.startsWith("/media/tmdb-show"))
    return true;
  return false;
}

export function isLegacyMediaType(url: string): boolean {
  if (url.startsWith("/media/tmdb-show")) return true;
  return false;
}

export async function convertLegacyUrl(
  url: string,
): Promise<string | undefined> {
  if (!isLegacyUrl(url)) return undefined;

  const urlParts = url.split("/").slice(2);
  const [, type, id] = urlParts[0].split("-", 3);
  const suffix = urlParts
    .slice(1)
    .map((v) => `/${v}`)
    .join("");

  if (isLegacyMediaType(url)) {
    const details = await getMediaDetails(id, TMDBContentTypes.TV);
    return `/media/${TMDBIdToUrlId(
      MWMediaType.SERIES,
      details.id.toString(),
      details.name,
    )}${suffix}`;
  }

  const mediaType = TMDBMediaToMediaType(type as TMDBContentTypes);
  const meta = await getLegacyMetaFromId(mediaType, id);

  if (!meta) return undefined;
  const { tmdbId, imdbId } = meta;
  if (!tmdbId && !imdbId) return undefined;

  // movies always have an imdb id on tmdb
  if (imdbId && mediaType === MWMediaType.MOVIE) {
    const movieId = await getMovieFromExternalId(imdbId);
    if (movieId) {
      return `/media/${TMDBIdToUrlId(mediaType, movieId, meta.meta.title)}`;
    }

    if (tmdbId) {
      return `/media/${TMDBIdToUrlId(mediaType, tmdbId, meta.meta.title)}`;
    }
  }
}
