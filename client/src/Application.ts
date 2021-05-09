import * as PIXI from "pixi.js"
import { Graphics } from "./Graphics"
import { Client } from "./Client"

export class Application {
  pixiApp:PIXI.Application
  g:PIXI.Graphics
  client:Client
  graphics:Graphics|null = null

  drawOutOfDate:boolean = false

  pixelsPerWorldCoord:number = 100
  x:number = 0
  y:number = 0
  w:number
  h:number

  constructor(root:HTMLElement=document.body) {
    this.w = window.innerWidth/this.pixelsPerWorldCoord
    this.h = window.innerHeight/this.pixelsPerWorldCoord
    this.pixiApp = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
      antialias: true
    })
    this.g = new PIXI.Graphics()

    this.client = new Client()
    this.client.updateRange(0, 0, 100, 100)

    this.pixiApp.ticker.add(this.update.bind(this))
    this.pixiApp.ticker.add(this.draw.bind(this))
    this.pixiApp.stage.addChild(this.g)

    root.appendChild(this.pixiApp.view)
  }

  toPixel(worldX:number, worldY:number):{x:number, y:number} {
    return {
      x: worldX * this.pixelsPerWorldCoord,
      y: worldY * this.pixelsPerWorldCoord,
    }
  }

  update() {
    const range = this.client.useRange()
    if (range != null) {
      console.log("range not null")
      const { x, y, pixelsPerWorldCoord, g } = this
      this.graphics = new Graphics({
        coordArgs: {
          cameraWorldX: x,
          cameraWorldY: y,
          pixelsPerWorldCoord,
          pixiWidth: window.innerWidth,
          pixiHeight: window.innerHeight
        },
        range,
        g
      })
      this.drawOutOfDate = true
    }
  }

  draw() {
    if (!this.drawOutOfDate) {
      return
    }
    this.drawOutOfDate = false

    this.g.clear()
    this.graphics.draw()
  }
}
