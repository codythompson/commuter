import { Graph, TrackSection } from "commuter-common";

const graph = new Graph()
TrackSection
  .start(graph, 0, 0)
  .extend(1, 1)
  .extend(2, 2)
  .fork(main => (
    main
      .extend(3,2.5)
      .extend(4,3)
      .end(5,3.5)
  ))
  .extend(3, 3)
  .extend(4, 4)

export default graph
