import { SerializedConnection, SerializedPlatform, SerializedRange, SerializedTrackSection } from "commuter-common/dist"
import * as PIXI from "pixi.js"

export type Coord = {
  x: number
  y: number
}

export type CoordSet = {
  a: Coord|null
  b: Coord|null
}

export interface CoordSystemProps {
  cameraWorldX: number
  cameraWorldY: number
  pixelsPerWorldCoord: number
  pixiWidth: number
  pixiHeight: number
}

export type GraphicsProps = {
  g: PIXI.Graphics
  range: SerializedRange|null
  coordSystem: CoordSystemProps
}

export class CoordSystem implements CoordSystemProps {
  cameraWorldX: number
  cameraWorldY: number
  pixelsPerWorldCoord: number
  pixiWidth: number
  pixiHeight: number

  constructor(args:CoordSystemProps) {
    for (let key in args) {
      (this as any)[key] = (args as any)[key]
    }
  }

  toWorld(pixelX: number, pixelY: number): Coord {
    // TODO camera offset
    return {
      x: pixelX / this.pixelsPerWorldCoord,
      y: pixelY / this.pixelsPerWorldCoord,
    }
  }

  toPixel(worldX: number, worldY: number): Coord {
    // TODO camera offset
    return {
      x: worldX * this.pixelsPerWorldCoord,
      y: worldY * this.pixelsPerWorldCoord,
    }
  }
}

export class DrawableRange {
  constructor(public serialized:SerializedRange) {}

  getTrack(id:string):SerializedTrackSection {
    if (!(id in this.serialized.trackSections)) {
      throw new Error("Unknown track. id: "+id)
    }
    return this.serialized.trackSections[id]
  }

  getConnection(id: string): SerializedConnection {
    if (!(id in this.serialized.connections)) {
      throw new Error("Unknown connection. id: "+id)
    }
    return this.serialized.connections[id]
  }

  getPlatforms(id: string): SerializedPlatform {
    if (!(id in this.serialized.platforms)) {
      throw new Error("Unknown platform. id: "+id)
    }
    return this.serialized.platforms[id]
  }

  trackToCoordSet(trackId:string): CoordSet {
    const track = this.getTrack(trackId)
    console.log(track.connectionA, track.connectionB)
    let a:Coord|null = null
    let b:Coord|null = null
    if (track.connectionA != null) {
      const {x,y} = this.getConnection(track.connectionA)
      a = {x,y}
    }
    if (track.connectionB != null) {
      const {x,y} = this.getConnection(track.connectionB)
      b = {x,y}
    }
    return {
      a,
      b
    }
  }

  trackList(): string[] {
    return Object.keys(this.serialized.trackSections)
  }
}

export class Graphics {
  readonly coords:CoordSystem
  readonly range:DrawableRange
  readonly g: PIXI.Graphics

  constructor({coordArgs, range, g}:{coordArgs:CoordSystemProps, range:SerializedRange, g:PIXI.Graphics}) {
    this.coords = new CoordSystem(coordArgs)
    this.range = new DrawableRange(range)
    this.g = g

    this.drawTrack = this.drawTrack.bind(this)
  }

  drawTrack(id:string) {
    const {a,b} = this.range.trackToCoordSet(id)
    if (a != null && b != null) {
      const pA = this.coords.toPixel(a.x, a.y)
      const pB = this.coords.toPixel(b.x, b.y)
      console.log("made it", pA.x, pB.y)
      const {g} = this
      g.lineStyle(10, 0xffffaa00)
      g.moveTo(pA.x, pA.y)
      g.lineTo(pB.x, pB.y)
    }
  }

  draw() {
    const tracks = this.range.trackList()
    const {g} = this
    tracks.forEach(this.drawTrack)
  }
}
