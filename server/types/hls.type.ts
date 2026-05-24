export interface Quality {
  resolution: string;
  bitrate: string;
  audioBitrate: string;
}

export interface QualityPresets {
  [key: string]: Quality;
}

export type QualityKey = "360p" | "480p" | "720p";
