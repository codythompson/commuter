import { TrackSection } from "./Graph"

describe("TrackSection", () => {
  describe("start", () => {
    it("should connect everything correctly", ()=> {
      const track = TrackSection.start(-2.24, 3.14)
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
      const track = TrackSection.start(-2.24, 3.14)
      const extension = track.extend(2, 4.5)
      const node = track.connectionB
      expect(node).not.toBeNull()
      expect(node.trackSections.length).toBe(2)
      expect(node.trackSections[1]).toBe(extension)
      expect(extension.connectionA).toBe(node)
      expect(extension.connectionB).toBeNull()
    })
  })
})
