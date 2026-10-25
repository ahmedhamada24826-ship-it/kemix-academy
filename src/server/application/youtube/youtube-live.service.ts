export type YouTubeBroadcastSession = {
  broadcastId: string;
  streamId: string;
  ingestUrl: string;
  streamName: string;
  streamKey: string;
  youtubeUrl?: string | null;
  youtubeEmbedUrl?: string | null;
};

export class YouTubeLiveService {
  hasCredentials(): boolean {
    return Boolean(
      process.env.YOUTUBE_CLIENT_ID &&
        process.env.YOUTUBE_CLIENT_SECRET &&
        process.env.YOUTUBE_REFRESH_TOKEN
    );
  }

  buildEmbedUrl(videoId?: string | null): string | null {
    if (!videoId) return null;
    return `https://www.youtube.com/embed/${videoId}`;
  }

  buildYouTubeUrl(videoId?: string | null): string | null {
    if (!videoId) return null;
    return `https://www.youtube.com/watch?v=${videoId}`;
  }

  private async getAccessToken(): Promise<string> {
    const resp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.YOUTUBE_CLIENT_ID ?? "",
        client_secret: process.env.YOUTUBE_CLIENT_SECRET ?? "",
        refresh_token: process.env.YOUTUBE_REFRESH_TOKEN ?? "",
        grant_type: "refresh_token",
      }),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      throw new Error(`Failed to refresh YouTube OAuth token: ${errorText}`);
    }

    const data = await resp.json() as { access_token?: string };
    if (!data.access_token) {
      throw new Error("YouTube OAuth token did not include access_token");
    }

    return data.access_token;
  }

  async prepareRecording(lecture: { id: string; title: string }): Promise<{ shouldAttempt: boolean; reason: string; }> {
    if (!this.hasCredentials()) {
      return {
        shouldAttempt: false,
        reason: "YOUTUBE_* environment variables are not configured.",
      };
    }

    return {
      shouldAttempt: true,
      reason: `YouTube Live provider is ready for lecture ${lecture.title}.`,
    };
  }

  async createBroadcastSession(lecture: { id: string; title: string; scheduledAt?: Date | string; description?: string | null }) {
    if (!this.hasCredentials()) {
      throw new Error("YouTube Live credentials are not configured on the server.");
    }

    const accessToken = await this.getAccessToken();
    const privacyStatus = process.env.YOUTUBE_LIVE_PRIVACY_STATUS ?? "unlisted";
    const title = `${process.env.YOUTUBE_BROADCAST_TITLE_PREFIX ?? "KEMIX Academy Live"} — ${lecture.title}`;

    const createBroadcastResponse = await fetch(
      "https://www.googleapis.com/youtube/v3/liveBroadcasts?part=id,snippet,status,contentDetails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          snippet: {
            title,
            description: lecture.description ?? `Live lecture scheduled for KEMIX Academy: ${lecture.title}`,
            scheduledStartTime: lecture.scheduledAt ? new Date(lecture.scheduledAt).toISOString() : new Date().toISOString(),
          },
          status: {
            privacyStatus,
            selfDeclaredMadeForKids: false,
          },
          contentDetails: {
            monitorStream: {
              enableMonitorStream: false,
            },
          },
        }),
      }
    );

    if (!createBroadcastResponse.ok) {
      const text = await createBroadcastResponse.text();
      throw new Error(`YouTube liveBroadcast creation failed: ${text}`);
    }

    const broadcastData = await createBroadcastResponse.json() as {
      id?: string;
    };

    if (!broadcastData.id) {
      throw new Error("YouTube liveBroadcast creation response did not include broadcast id");
    }

    const createStreamResponse = await fetch(
      "https://www.googleapis.com/youtube/v3/liveStreams?part=id,snippet,cdn,status",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          snippet: {
            title: `${title} stream`,
          },
          cdn: {
            frameRate: "variable",
            ingestionType: "rtmp",
            resolution: "variable",
          },
          status: {
            streamStatus: "inactive",
          },
        }),
      }
    );

    if (!createStreamResponse.ok) {
      const text = await createStreamResponse.text();
      throw new Error(`YouTube liveStream creation failed: ${text}`);
    }

    const streamData = await createStreamResponse.json() as {
      id?: string;
      cdn?: {
        ingestionInfo?: {
          ingestionAddress?: string;
          streamName?: string;
          streamKey?: string;
        };
      };
    };

    if (!streamData.id || !streamData.cdn?.ingestionInfo) {
      throw new Error("YouTube liveStream creation response did not include ingest info");
    }

    const bindResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/liveBroadcasts/bind?part=id,status&broadcastStatus=active&streamId=${streamData.id}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: broadcastData.id,
          streamId: streamData.id,
        }),
      }
    );

    if (!bindResponse.ok) {
      const text = await bindResponse.text();
      throw new Error(`YouTube broadcast bind failed: ${text}`);
    }

    const ingestUrl = streamData.cdn.ingestionInfo.ingestionAddress ?? process.env.YOUTUBE_LIVE_INGEST_RTMP ?? "rtmp://a.rtmp.youtube.com/live2";
    const streamName = streamData.cdn.ingestionInfo.streamName ?? process.env.YOUTUBE_LIVE_STREAM_NAME ?? "";
    const streamKey = streamData.cdn.ingestionInfo.streamKey ?? process.env.YOUTUBE_LIVE_STREAM_KEY ?? "";

    return {
      broadcastId: broadcastData.id,
      streamId: streamData.id,
      ingestUrl,
      streamName,
      streamKey,
      youtubeUrl: this.buildYouTubeUrl(streamData.id) ?? null,
      youtubeEmbedUrl: null,
    } satisfies YouTubeBroadcastSession;
  }

  async startBroadcast(broadcastId: string): Promise<{ status: string; }> {
    if (!this.hasCredentials()) {
      throw new Error("YouTube Live credentials are not configured on the server.");
    }

    const accessToken = await this.getAccessToken();
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/liveBroadcasts/transition?part=id,status&broadcastStatus=live&id=${broadcastId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`YouTube live transition to LIVE failed: ${text}`);
    }

    return { status: "live" };
  }

  async endBroadcast(broadcastId: string): Promise<{ status: string; }> {
    if (!this.hasCredentials()) {
      throw new Error("YouTube Live credentials are not configured on the server.");
    }

    const accessToken = await this.getAccessToken();
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/liveBroadcasts/transition?part=id,status&broadcastStatus=complete&id=${broadcastId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`YouTube live transition to COMPLETE failed: ${text}`);
    }

    return { status: "complete" };
  }

  async getBroadcastStatus(broadcastId: string): Promise<{ status?: string; lifeCycleStatus?: string; actualStartTime?: string; } | null> {
    if (!this.hasCredentials()) {
      return null;
    }

    const accessToken = await this.getAccessToken();
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/liveBroadcasts?part=id,status,contentDetails,snippet&id=${broadcastId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json() as {
      items?: Array<{
        status?: { lifeCycleStatus?: string; privacyStatus?: string };
        contentDetails?: { actualStartTime?: string; actualEndTime?: string };
      }>;
    };

    return data.items?.[0]?.status ? {
      status: data.items[0].status.privacyStatus,
      lifeCycleStatus: data.items[0].status.lifeCycleStatus,
      actualStartTime: data.items[0].contentDetails?.actualStartTime,
    } : null;
  }
}

export const youtubeLiveService = new YouTubeLiveService();
