import {v4 as uuid} from "uuid"

// DESIGN NOTE: All links/pointers are TWO WAY. Parent and
// child must know of each other

export class GraphStateError extends Error {
  constructor(message:string) {
    super(message)
  }
}

/**
 * A connection between two track sections (i.e. a Node).
 */
export class Connection {
  id: string = uuid()
  trackSections: TrackSection[] = []
  x: number
  y: number

  constructor(x:number, y:number) {
    this.x = x
    this.y = y
  }

  fork():TrackSection {
    const track = new TrackSection()
    track.connectionA = this
    this.trackSections.push(track)
    return track
  }
}

/**
 * TrackSections form the links between Connections (i.e. an edge)
 * It can have Zero or Many platforms
 * It has length
 */
export class TrackSection {
  static start(x: number, y:number): TrackSection {
    const track = new TrackSection()
    const node = new Connection(x, y)
    track.connectionA = node
    node.trackSections.push(track)
    return track
  }

  id: string = uuid()
  connectionA: Connection|null = null
  connectionB: Connection|null = null
  platforms: Platform[] = []
  // alowed vehicle types?
  // adjacent TrackSection???

  extend(x:number, y:number): TrackSection {
    const node = new Connection(x, y)
    const track = new TrackSection()
    if (this.connectionB != null) {
      throw new GraphStateError(`Already extended! ${this}`)
    }
    this.connectionB = node
    node.trackSections.push(this)
    track.connectionA = node
    node.trackSections.push(track)
    return track
  }

  toString() {
    return `TrackSection:${this.id}`
  }
}

/**
 * A platform connects two different kinds of networks (i.e. graphs)
 * (i.e. train to ped/carts network at station)
 */
export class Platform {
  id: string = uuid()
  trackSections: TrackSection[] = []
  // capacity?
}
