import * as PIXI from "pixi.js"
import { SerializedRange } from "../../server/src/model/Serialized"

export class Application {
  pixiApp:PIXI.Application
  range:SerializedRange|null = null

  redDot:PIXI.Texture

  constructor(root:HTMLElement=document.body) {
    this.pixiApp = new PIXI.Application({})

    this.pixiApp.ticker.add(this.draw.bind(this))

    root.appendChild(this.pixiApp.view)
  }

  draw() {
    const tmpScale = 10

    const g = new PIXI.Graphics()
    g.beginFill(0xffff0000)
    g.drawCircle(200, 200, 10)
    g.endFill()

    this.pixiApp.stage.addChild(g)
  }
}
