import express from "express"
import graph from "./devgraph"
import { SerializeRange } from "commuter-common"
import { handler } from "./result"
import cors from "cors"
import http from "http"
import { Server } from "socket.io"

const app = express()
const httpServer = http.createServer(app)
const io = new Server(httpServer, {
  cors: { }
})

app.use(cors())

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

io.on("connection", (socket) => {
  socket.emit("hello", {
    hello: true
  })
  socket.on("world", (msg) => {
    console.log(msg)
  })
})

httpServer.listen(3000)
// app.listen(3000)
