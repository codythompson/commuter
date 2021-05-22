import { GraphObj, Platform, TrackSection } from "./Graph";

export class Route extends GraphObj {
  stops:Platform[] = []

  toJSON(): any {
    throw new Error("NOT IMPLEMENTED")
  }
}
