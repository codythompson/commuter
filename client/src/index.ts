import { Application } from "./Application"
import { Client } from "./Client"

window.addEventListener("load", ()=>{
  (window as any).COMMUTER = {}
  const globals = (window as any).COMMUTER

  const app = new Application()
  globals.app = app
  globals.client = Client
})
