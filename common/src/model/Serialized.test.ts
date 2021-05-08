import {Graph, Platform, TrackSection} from "./Graph"
import { SerializeRange } from "./Serialized"

describe("Serializerange", () => {
  it("should have the correct number of entries", () => {
    const graph = new Graph()
    TrackSection.start(graph, 0, 0)
      .extend(1.2, 1.2)
      .fork(main => (
        main
          .end(2, 3)
      ))
      .extend(1.3, 2)
      .end(1.3, 4)

    const range = graph.getRange(0, 0, 4, 5)
    let ser = SerializeRange(range)
    expect(Object.keys(ser.connections).length).toBe(5)
    expect(Object.keys(ser.trackSections).length).toBe(4)
    expect(Object.keys(ser.platforms).length).toBe(0)

    range[2].first.platforms.push(new Platform(graph))
    ser = SerializeRange(range)
    expect(Object.keys(ser.platforms).length).toBe(1)
  })
})
