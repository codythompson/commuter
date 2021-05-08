import {v4 as uuid} from "uuid"
import { Serializable, SerializedConnection, SerializedPlatform, SerializedTrackSection } from "./Serialized"

// DESIGN NOTE: All links/pointers are TWO WAY. Parent and
// child must know of each other

export class GraphStateError extends Error {
  constructor(message:string) {
    super(message)
  }
}

export abstract class GraphObj {
  static nullOrID(obj:GraphObj|null): string|null {
    return obj != null? obj.id : null
  }

  readonly id: string = uuid()
  constructor(readonly graph:Graph) {
    this.graph.insert(this)
  }

  abstract toJSON(): Serializable
}

/**
 * A connection between two track sections (i.e. a Node).
 */
export class Connection extends GraphObj {
  trackSections: TrackSection[] = []
  x: number
  y: number

  constructor(graph:Graph, x:number, y:number) {
    super(graph)
    this.x = x
    this.y = y
    this.graph.insertConnection(this)
  }

  get first(): TrackSection|null {
    return this.trackSections.length > 0? this.trackSections[0] : null
  }
  get second(): TrackSection|null {
    return this.trackSections.length > 1? this.trackSections[1] : null
  }

  fork():TrackSection {
    const track = new TrackSection(this.graph)
    track.connectionA = this
    this.trackSections.push(track)
    return track
  }

  toString(verbose:boolean = true) {
    const idStr = verbose? `CONNECTION: {this.id} " - "` : "C: "
    return `${idStr}${this.x},${this.y}`
  }

  toJSON(): SerializedConnection {
    const {id, x, y} = this
    return {
      id,
      x,
      y,
      trackSections: this.trackSections.map(section => section.id)
    }
  }
}

/**
 * TrackSections form the links between Connections (i.e. an edge)
 * It can have Zero or Many platforms
 * It has length
 */
export class TrackSection extends GraphObj {
  static start(graph:Graph, x: number, y:number): TrackSection {
    const track = new TrackSection(graph)
    const node = new Connection(graph, x, y)
    track.connectionA = node
    node.trackSections.push(track)
    return track
  }

  connectionA: Connection|null = null
  connectionB: Connection|null = null
  platforms: Platform[] = []
  // alowed vehicle types?
  // adjacent TrackSection???

  get firstA(): TrackSection|null {
    return this.connectionA != null? this.connectionA.first: null
  }
  get secondB(): TrackSection|null {
    return this.connectionB != null? this.connectionB.second: null
  }

  extend(x:number, y:number): TrackSection {
    const node = new Connection(this.graph, x, y)
    const track = new TrackSection(this.graph)
    if (this.connectionB != null) {
      throw new GraphStateError(`Already extended! ${this}`)
    }
    this.connectionB = node
    node.trackSections.push(this)
    track.connectionA = node
    node.trackSections.push(track)
    return track
  }

  fork(chainSplitFunction?:(continuation:TrackSection)=>TrackSection): TrackSection {
    if (this.connectionA == null) {
      throw new GraphStateError(`can't fork, connection A is null ${this}`)
    }
    const continuation = this.connectionA.fork()
    if (chainSplitFunction != undefined) {
      // this happens before any extends on the main chain
      chainSplitFunction(continuation)
    }
    return this
  }

  /**
   * Place a connection without adding a new track segment
   * returns this
   * @param x
   * @param y
   * @returns this
   */
  end(x:number, y:number):TrackSection {
    this.connectionB = new Connection(this.graph, x, y)
    return this
  }


  public toString(): string {
    const aStr = this.connectionA != null? this.connectionA.toString(false) : "null"
    const bStr = this.connectionB != null? this.connectionB.toString(false) : "null"
    return `TrackSection: ${this.id} - ${aStr} - B: ${bStr}`
  }

  toJSON(): SerializedTrackSection {
    return {
      id: this.id,
      connectionA: GraphObj.nullOrID(this.connectionA),
      connectionB: GraphObj.nullOrID(this.connectionA),
      platforms: this.platforms.map(platform => platform.id)
    }
  }
}

/**
 * A platform connects two different kinds of networks (i.e. graphs)
 * (i.e. train to ped/carts network at station)
 */
export class Platform extends GraphObj {
  trackSections: TrackSection[] = []
  // capacity?

  toJSON():SerializedPlatform {
    return {
      id: this.id,
      trackSections: this.trackSections.map(section => section.id)
    }
  }
}

/**
 * Represents a network of track
 */
export class Graph {
  static getGeoString(x:number, y:number): string {
    const xStr = Math.floor(x).toFixed(0)
    const yStr = Math.floor(y).toFixed(0)
    return `${xStr},${yStr}`
  }

  idLookup: Record<string, GraphObj> = {}
  geoLookup: Record<string, Connection[]> = {}

  insertConnection(connection:Connection):void {
    const {x,y} = connection
    const bucketId = Graph.getGeoString(x,y)
    if (!(bucketId in this.geoLookup)) {
      this.geoLookup[bucketId] = []
    }
    const bucket = this.geoLookup[bucketId]
    bucket.push(connection)
  }

  insert(obj:GraphObj):void {
    this.idLookup[obj.id] = obj
  }

  getGeoBucket(x:number, y:number): Connection[] {
    const id = Graph.getGeoString(x, y)
    if (id in this.geoLookup) {
      return this.geoLookup[id]
    }
    return []
  }

  getRange(minX:number, minY:number, width:number, height:number): Connection[] {
    // TODO: cache?

    let result:Connection[] = []

    const maxX = minX + width // exclusive max
    const maxY = minY + height // exclusive max
    for (let y = minY; y < maxY; y++) {
      for (let x = minX; x < maxX; x++) {
        const bucket = this.getGeoBucket(x, y)
        if (bucket.length > 0) {
          result = result.concat(this.getGeoBucket(x, y))
        }
      }
    }

    return result
  }
}
