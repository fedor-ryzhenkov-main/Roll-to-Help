/**
 * Event Service
 * Handles events and games data fetching with caching
 */

import prisma from '@/app/lib/db';
import cache from '@/app/utils/cache';
import { Event, Game } from '@/app/types';
import { API } from '@/app/config/constants';

// Cache keys
const CACHE_KEYS = {
  ACTIVE_EVENTS: 'events:active',
  EVENT: (id: string) => `event:${id}`,
  EVENT_GAMES: (eventId: string) => `event:${eventId}:games`,
  GAME: (id: string) => `game:${id}`,
};

// Cache TTLs (in milliseconds)
const CACHE_TTL = {
  ACTIVE_EVENTS: 5 * 60 * 1000, // 5 minutes
  EVENT: 10 * 60 * 1000, // 10 minutes
  GAMES: 5 * 60 * 1000, // 5 minutes
  GAME: 2 * 60 * 1000, // 2 minutes
};

interface EventsQueryOptions {
  page?: number;
  pageSize?: number;
  includeInactive?: boolean;
}

/**
 * Get all active events
 */
export async function getEvents(options: EventsQueryOptions = {}): Promise<{ events: Event[]; totalCount: number }> {
  const {
    page = 1,
    pageSize = API.DEFAULT_PAGE_SIZE,
    includeInactive = false,
  } = options;
  
  // For active events, try to get from cache
  if (!includeInactive) {
    const cacheKey = CACHE_KEYS.ACTIVE_EVENTS;
    return await cache.getOrSet(
      cacheKey,
      async () => {
        const [events, totalCount] = await Promise.all([
          prisma.event.findMany({
            where: { isActive: true },
            orderBy: { eventDate: 'asc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
          }),
          prisma.event.count({
            where: { isActive: true },
          }),
        ]);
        
        return { events, totalCount };
      },
      { ttl: CACHE_TTL.ACTIVE_EVENTS }
    );
  }
  
  // For all events (including inactive), don't cache
  const [events, totalCount] = await Promise.all([
    prisma.event.findMany({
      orderBy: { eventDate: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.event.count(),
  ]);
  
  return { events, totalCount };
}

/**
 * Get a specific event by ID
 */
export async function getEvent(id: string): Promise<Event | null> {
  const cacheKey = CACHE_KEYS.EVENT(id);
  
  return await cache.getOrSet(
    cacheKey,
    async () => {
      return await prisma.event.findUnique({
        where: { id },
      });
    },
    { ttl: CACHE_TTL.EVENT }
  );
}

/**
 * Get games for an event
 */
export async function getEventGames(eventId: string): Promise<Game[]> {
  const cacheKey = CACHE_KEYS.EVENT_GAMES(eventId);
  
  return await cache.getOrSet(
    cacheKey,
    async () => {
      return await prisma.game.findMany({
        where: { eventId },
        orderBy: { name: 'asc' },
      });
    },
    { ttl: CACHE_TTL.GAMES }
  );
}

/**
 * Get a specific game by ID
 */
export async function getGame(id: string, includeEvent: boolean = false): Promise<Game | null> {
  const cacheKey = CACHE_KEYS.GAME(id);
  
  return await cache.getOrSet(
    cacheKey,
    async () => {
      return await prisma.game.findUnique({
        where: { id },
        include: includeEvent ? { event: true } : undefined,
      });
    },
    { ttl: CACHE_TTL.GAME }
  );
}

/**
 * Get game with bids
 */
export async function getGameWithBids(id: string): Promise<Game | null> {
  // This data is more dynamic, so we use a short cache or no cache at all
  return await prisma.game.findUnique({
    where: { id },
    include: {
      event: true,
      bids: {
        orderBy: { amount: 'desc' },
        include: { user: true },
      },
    },
  });
}

/**
 * Invalidate caches when data changes
 */
export function invalidateEventCache(eventId: string): void {
  cache.delete(CACHE_KEYS.ACTIVE_EVENTS);
  cache.delete(CACHE_KEYS.EVENT(eventId));
  cache.delete(CACHE_KEYS.EVENT_GAMES(eventId));
}

export function invalidateGameCache(gameId: string, eventId?: string): void {
  cache.delete(CACHE_KEYS.GAME(gameId));
  if (eventId) {
    cache.delete(CACHE_KEYS.EVENT_GAMES(eventId));
  }
} 