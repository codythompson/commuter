import express from "express"
import { nextTick } from "node:process"
import graph from "./devgraph"
import { SerializeRange } from "./model/Serialized"
import { handler } from "./result"

const app = express()

const devgraph = graph

app.get("/range/:x0/:y0/:x1/:y1", handler(async ({req})=>{
  const {x0, y0, x1, y1} = req.params
  const x = new Number(x0) as number
  const y = new Number(y0) as number
  const x1n = new Number(x1) as number
  const y1n = new Number(y1) as number
  const width = x1n - x
  const height = y1n - y
  const range = graph.getRange(x, y, width, height)
  return SerializeRange(range)
}))

app.listen(80)
