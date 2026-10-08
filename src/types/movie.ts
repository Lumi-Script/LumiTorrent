export interface Torrent {
  url: string;
  hash: string;
  quality: string; // '720p' | '1080p' | '2160p' | '3D'
  type: string; // 'web' | 'bluray'
  is_repack: string;
  video_codec: string; // 'x264' | 'x265'
  bit_depth: string;
  audio_channels: string;
  seeds: number;
  peers: number;
  size: string;
  size_bytes: number;
  date_uploaded: string;
  date_uploaded_unix: number;
}

export interface CastMember {
  name: string;
  character_name: string;
  url_small_image?: string;
  imdb_code?: string;
}

export interface Movie {
  id: number;
  url: string;
  imdb_code: string;
  title: string;
  title_english: string;
  title_long: string;
  slug: string;
  year: number;
  rating: number;
  runtime: number;
  genres: string[];
  summary: string;
  description_full: string;
  synopsis: string;
  yt_trailer_code: string;
  language: string;
  mpa_rating: string;
  background_image: string;
  background_image_original: string;
  small_cover_image: string;
  medium_cover_image: string;
  large_cover_image: string;
  torrents: Torrent[];
  cast?: CastMember[];
  date_uploaded?: string;
  date_uploaded_unix?: number;
}

export interface YTSListResponse {
  status: 'ok' | 'error';
  status_message: string;
  data: {
    movie_count: number;
    limit: number;
    page_number: number;
    movies?: Movie[];
  };
}

export interface CachedStatusInfo {
  cached: boolean;
  files?: Array<{
    id?: number;
    name?: string;
    size?: number;
    s3_path?: string;
  }>;
}

export type CacheMap = Record<string, CachedStatusInfo>;

export interface TorboxUser {
  id: number;
  email: string;
  plan: number | string;
  customer_id?: string;
  expires_at?: string;
  total_downloaded?: number;
}
