import { Application } from "./Application"
import { Client } from "./Client"

window.addEventListener("load", ()=>{
  document.body.style.margin = "0";

  (window as any).COMMUTER = {}
  const globals = (window as any).COMMUTER

  const app = new Application()
  globals.app = app
  globals.client = Client

  setTimeout(() => app.client.connectSocket(), 2000)
})
