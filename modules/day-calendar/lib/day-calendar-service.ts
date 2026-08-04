import { get as httpGet } from "node:http";
import { get as httpsGet } from "node:https";
import type { IncomingMessage } from "node:http";
import ical from "node-ical";
import { getGoogleCalendarIcalUrl } from "@/modules/day-calendar/lib/day-calendar-config";
import { listDayEventsFromIcs } from "@/modules/day-calendar/lib/day-calendar-parse";
import {
  calendarDayKeyInTimeZone,
  getDayCalendarTimeZone
} from "@/modules/day-calendar/lib/day-calendar-timezone";
import type { DayCalendarResponse } from "@/modules/day-calendar/lib/day-calendar-validation";
import { parseOptionalDayKey } from "@/modules/day-calendar/lib/day-calendar-validation";
import { ptBR } from "@/modules/messages/pt-BR";

const ICS_FETCH_TIMEOUT_MS = 20_000;
const ICS_CACHE_TTL_MS = 5 * 60 * 1000;
const ICS_MAX_REDIRECTS = 3;

type IcsCacheEntry = {
  text: string;
  fetchedAt: number;
};

let icsCache: IcsCacheEntry | null = null;

export type DayCalendarFetchIcs = (url: string) => Promise<string>;

function readResponseBody(response: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    response.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    response.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
    response.on("error", reject);
  });
}

/**
 * Download ICS with Node's https client forced to IPv4.
 * Undici `fetch` happy-eyeballs often ETIMEDOUT to calendar.google.com
 * inside Docker when IPv6 is advertised but unreachable.
 */
export async function fetchIcsOverHttps(url: string): Promise<string> {
  let currentUrl = url;

  for (let redirect = 0; redirect <= ICS_MAX_REDIRECTS; redirect += 1) {
    const result = await new Promise<
      { kind: "body"; statusCode: number; body: string } | { kind: "redirect"; location: string }
    >((resolve, reject) => {
      const parsed = new URL(currentUrl);
      const get = parsed.protocol === "http:" ? httpGet : httpsGet;
      const req = get(
        currentUrl,
        {
          family: 4,
          timeout: ICS_FETCH_TIMEOUT_MS,
          headers: {
            Accept: "text/calendar, text/plain, */*",
            "User-Agent": "pr-flow-day-calendar/1.0"
          }
        },
        (response) => {
          const statusCode = response.statusCode ?? 0;
          const location = response.headers.location;

          if (statusCode >= 300 && statusCode < 400 && location) {
            response.resume();
            resolve({
              kind: "redirect",
              location: new URL(location, currentUrl).toString()
            });
            return;
          }

          void readResponseBody(response)
            .then((body) => resolve({ kind: "body", statusCode, body }))
            .catch(reject);
        }
      );

      req.on("timeout", () => {
        req.destroy(new Error("ICS fetch timeout"));
      });
      req.on("error", reject);
    });

    if (result.kind === "redirect") {
      currentUrl = result.location;
      continue;
    }

    if (result.statusCode < 200 || result.statusCode >= 300) {
      throw new Error(`ICS HTTP ${result.statusCode}`);
    }

    return result.body;
  }

  throw new Error("ICS fetch redirect limit exceeded");
}

export function clearDayCalendarIcsCache(): void {
  icsCache = null;
}

async function loadIcsText(
  url: string,
  fetchIcs: DayCalendarFetchIcs
): Promise<string> {
  const now = Date.now();
  if (icsCache && now - icsCache.fetchedAt < ICS_CACHE_TTL_MS) {
    return icsCache.text;
  }

  const text = await fetchIcs(url);
  // Cheap sanity check before caching.
  ical.sync.parseICS(text);
  icsCache = { text, fetchedAt: now };
  return text;
}

export async function getDayCalendar(
  dayRaw?: string,
  options?: {
    now?: Date;
    env?: Record<string, string | undefined>;
    fetchIcs?: DayCalendarFetchIcs;
  }
): Promise<DayCalendarResponse> {
  const env = options?.env ?? process.env;
  const timeZone = getDayCalendarTimeZone(env);
  const now = options?.now ?? new Date();

  const requested = parseOptionalDayKey(dayRaw);
  if (dayRaw !== undefined && dayRaw.trim() !== "" && requested === undefined) {
    return {
      status: "error",
      message: ptBR.dayCalendar.invalidDate
    };
  }

  const day = requested ?? calendarDayKeyInTimeZone(now, timeZone);
  const url = getGoogleCalendarIcalUrl(env);

  if (!url) {
    return {
      status: "missing_config",
      message: ptBR.dayCalendar.missingConfig
    };
  }

  try {
    const icsText = await loadIcsText(url, options?.fetchIcs ?? fetchIcsOverHttps);
    const events = listDayEventsFromIcs(icsText, day, timeZone);
    return {
      status: "ok",
      day,
      timeZone,
      events
    };
  } catch {
    return {
      status: "error",
      message: ptBR.dayCalendar.loadFailed
    };
  }
}
