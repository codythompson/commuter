import {v4 as uuid} from "uuid"
import { Route } from "./Route"
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

  extend(x: number, y:number):Connection {
    const newConn = new Connection(this.graph, x, y)
    const newTrack = new TrackSection(this.graph)
    this.trackSections.push(newTrack)
    newConn.trackSections.push(newTrack)
    newTrack.connectionA = this
    newTrack.connectionB = newConn
    return newConn
  }

  connect(other:Connection): Connection {
    const newTrack = new TrackSection(this.graph)
    newTrack.connectionA = this
    newTrack.connectionB = other
    this.trackSections.push(newTrack)
    other.trackSections.push(newTrack)
    return other
  }

  getTrack(other:Connection): TrackSection|null {
    for (let track of this.trackSections) {
      if (track.connectionA == other || track.connectionB == other) {
        return track
      }
    }
    return null
  }

  /**
   * @deprecated
   * @returns 
   */
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

  /**
   * @deprecated
   * @param x 
   * @param y 
   * @returns 
   */
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

  /**
   * @deprecated
   * @param chainSplitFunction 
   * @returns 
   */
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
   * @deprecated
   * @param otherTrack 
   * @param x 
   * @param y 
   * @returns 
   */
  connect(otherTrack:TrackSection, x:number, y:number):TrackSection {
    if (this.connectionB != null) {
      throw new GraphStateError(`can't connect, connection B is NOT null ${this}`)
    }
    if (otherTrack.connectionB != null) {
      throw new GraphStateError(`can't connect, other track's connection B is NOT null ${otherTrack}`)
    }
    this.end(x, y)
    otherTrack.connectionB = this.connectionB
    return this
  }

  addPlatform(existing?:Platform): Platform {
    let platform:Platform
    if (existing != undefined) {
      platform = existing
    }
    else {
      platform = new Platform(this.graph)
    }
    platform.trackSections.push(this)
    this.platforms.push(platform)
    return platform
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

  getNeighbors():TrackSection[] {
    let neighbors:TrackSection[] = []
    if (this.connectionA != null) {
      neighbors = neighbors.concat(this.connectionA.trackSections.filter(track => track.id != this.id))
    }
    if (this.connectionB != null) {
      neighbors = neighbors.concat(this.connectionB.trackSections.filter(track => track.id != this.id))
    }
    return neighbors
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
      connectionB: GraphObj.nullOrID(this.connectionB),
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
  routes: Route[] = []
  // capacity?

  toJSON():SerializedPlatform {
    return {
      id: this.id,
      trackSections: this.trackSections.map(section => section.id),
      routes: this.routes.map(route => route.id)
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
  trackLookup: Record<string, TrackSection> = {}
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
    if (obj instanceof TrackSection) {
      this.trackLookup[obj.id] = obj
    }
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

  /**
   * Find the shortest path from the source track-section to the destination track section
   * TODO: make it distance base instead of track section count based
   * adapted from:
   * https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm#Pseudocode
   * @param source 
   * @param destination 
   * @returns 
   */
  findPath(source:TrackSection, destination:TrackSection):TrackSection[] {
    // Sort of Dijkstras
    let tracks = Object.values(this.trackLookup)

    const dist:Record<string, number> = {}
    const prev:Record<string, string> = {}
    const visited:Record<string, boolean> = {}

    for (let track of tracks) {
      dist[track.id] = Infinity
    }
    dist[source.id] = 0

    while (tracks.length > 0) {
      // sort such that closest is last
      tracks = tracks.sort((n,m)=>dist[m.id]-dist[n.id])
      // get closest still in the tracks array (AKA Q)
      const track = tracks.pop() as TrackSection
      visited[track.id] = true

      if (track.id == destination.id) {
        // found the shortest path
        break;
      }

      // only look at neighbors that are still in tracks (AKA not visited)
      const neighbors = track.getNeighbors()
        .filter(neighbor => !visited[neighbor.id])
      for (let neighbor of neighbors) {
        const distTrackNeighbor = dist[track.id] + 1 // TODO: actual track section length
        if (distTrackNeighbor < dist[neighbor.id]) {
          dist[neighbor.id] = distTrackNeighbor
          prev[neighbor.id] = track.id
        }
      }
    }

    // Now we can read the shortest path from source to target by reverse iteration: (see wiki)
    const result:TrackSection[] = []
    let current:string|null = destination.id
    if (prev[current] != undefined || current == source.id) {
      while (current != undefined) {
        result.unshift(this.trackLookup[current])
        current = prev[current]
      }
    }

    return result
  }
}
