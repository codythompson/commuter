import { Connection } from "./Graph"

export type Serializable = {
  id: string
}

export type SerializedConnection = Serializable&{x:number, y:number, trackSections:string[]}
export type SerializedTrackSection = Serializable&{connectionA:string|null, connectionB:string|null, platforms:string[]}
export type SerializedPlatform = Serializable&{trackSections:string[], routes:string[]}
export type SerializedRoute = Serializable&{stops:string[]}

export type SerializedRange = {
  connections: Record<string, SerializedConnection>
  trackSections: Record<string, SerializedTrackSection>
  platforms: Record<string, SerializedPlatform>
}

export function SerializeRange(range: Connection[]): SerializedRange {
  const connections:Record<string, SerializedConnection> = {}
  const trackSections:Record<string, SerializedTrackSection> = {}
  const platforms:Record<string, SerializedPlatform> = {}
  const routes:Record<string, SerializedRoute> = {}

  for (let conn of range) {
    if (conn.id in connections) {
      // skip if we already encountered this connection
      continue
    }
    connections[conn.id] = conn.toJSON()
    for (let track of conn.trackSections) {
      trackSections[track.id] = track.toJSON()
      for (let platform of track.platforms) {
        platforms[platform.id] = platform.toJSON()
        for (let route of platform.routes) {
          if (!(route.id in routes)) {
            routes[route.id] = route.toJSON()
          }
        }
      }
    }
  }

  return {
    connections,
    trackSections,
    platforms
  }
}
