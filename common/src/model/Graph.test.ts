import { Graph, TrackSection } from "./Graph"

describe("TrackSection", () => {
  let graph:Graph

  beforeEach(() => {
    graph = new Graph()
  })

  describe("start", () => {
    it("should connect everything correctly", ()=> {
      const track = TrackSection.start(graph, -2.24, 3.14)
      expect(track.connectionA).not.toBeNull()
      expect(track.connectionB).toBeNull()
      const connection = track.connectionA
      expect(connection.trackSections.length).toBe(1)
      expect(connection.x).toBe(-2.24)
      expect(connection.y).toBe(3.14)
    })
  })

  describe("extend", ()=> {
    it("should connect everything correctly", ()=> {
      const track = TrackSection.start(graph, -2.24, 3.14)
      const extension = track.extend(2, 4.5)
      const node = track.connectionB
      expect(node).not.toBeNull()
      expect(node.trackSections.length).toBe(2)
      expect(node.trackSections[1]).toBe(extension)
      expect(extension.connectionA).toBe(node)
      expect(extension.connectionB).toBeNull()
    })
  })

  describe("addPlatform", () => {
    it("should setup the platform pointers correctly", () => {
      const trackA = TrackSection.start(graph, -2.24, 3.14)
      const trackB = TrackSection.start(graph, 3, 4)
      const platformA = trackA.addPlatform()
      expect(platformA.trackSections.length).toBe(1)
      expect(platformA.trackSections[0]).toBe(trackA)
      expect(trackA.platforms.length).toBe(1)
      expect(trackA.platforms[0]).toBe(platformA)

      trackB.addPlatform(platformA)
      expect(platformA.trackSections.length).toBe(2)
      expect(platformA.trackSections[0]).toBe(trackA)
      expect(platformA.trackSections[1]).toBe(trackB)
      expect(trackA.platforms.length).toBe(1)
      expect(trackA.platforms[0]).toBe(platformA)
      expect(trackB.platforms.length).toBe(1)
      expect(trackB.platforms[0]).toBe(platformA)
    })
  })
})

describe("Connection", ()=> {
  let graph:Graph

  beforeEach(() => {
    graph = new Graph()
  })

  describe("fork", ()=> {
    it("should connect everything correctly", ()=> {
      const track = TrackSection.start(graph, 0.2, 3.3)
        .extend(2.2, -5.6)
      const trackE = track.connectionA.fork()

      expect(trackE.connectionA).toBe(track.connectionA)
      expect(track.connectionA.trackSections[0].connectionB).toBe(trackE.connectionA)
    })
  })
})

describe("Graph", () => {
  let graph:Graph

  beforeEach(() => {
    graph = new Graph()
  })

  describe("getGeoString", () => {
    it("should make the right string", () =>{
      expect(Graph.getGeoString(3.99, 4.01)).toBe("3,4")
    })
  })

  describe("add", ()=>{
    it("should insert into the correct lookup tables and geo buckets", () => {
      const track = TrackSection.start(graph, 3.99, 4)
      const tId = track.id
      const cId = track.connectionA.id

      expect(graph.idLookup[tId]).toBe(track)
      expect(graph.idLookup[cId]).toBe(track.connectionA)
      const keys = Object.keys(graph.idLookup)
      expect(keys.length).toBe(2)

      const bucket = graph.geoLookup["3,4"]
      expect(bucket.length).toBe(1)
      expect(bucket[0]).toBe(track.connectionA)
    })
  })

  describe("getRange", ()=> {
    it("should return the right connections", () => {
      const last = TrackSection.start(graph, 12, -1)
        .extend(-12, -4)
        .fork(forkedTrack => (
          forkedTrack
            .extend(2, 2)
            .extend(3, 2.5)
        ))
        .extend(5, 4)

      const first = last.firstA.firstA
      const second = first.connectionB.trackSections[2]
      const forkedFirst = second.secondB
      const forkedLast = forkedFirst.secondB

      // console.log("DICT ------------------------------")
      // console.log(""+first)
      // console.log(""+second)
      // console.log(""+last)
      // console.log("SPLITED")
      // console.log(""+forkedFirst)
      // console.log(""+forkedLast)
      // console.log("END ------------------------------")
      let range = graph.getRange(0, 0, 4, 3)
      expect(range.length).toBe(2)
      expect(range[0]).toBe(forkedFirst.connectionA)
      expect(range[1]).toBe(forkedFirst.connectionB)

      range = graph.getRange(-13, -5, 2, 2)
      expect(range.length).toBe(1)
      expect(range[0]).toBe(second.connectionA)

      range = graph.getRange(-13, -5, 26, 10)
      expect(range.length).toBe(5)
      expect(range[3]).toBe(forkedLast.connectionA)
    })
  })
})
