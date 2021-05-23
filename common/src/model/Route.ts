import { GraphObj, Platform, TrackSection } from "./Graph";
import { SerializedRoute } from "./Serialized";

export class Route extends GraphObj {
  stops:Platform[] = []

  addStop(platform:Platform):Route {
    this.stops.push(platform)
    platform.routes.push(this)
    return this
  }

  // TODO: cache route path - requires platforms, track sections, connections, etc. to notify of change
  // TODO: insertAfter(afterThis, toInsert):Route

  toJSON(): SerializedRoute {
    return {
      id: this.id,
      stops: this.stops.map(stop => stop.id)
    }
  }
}
