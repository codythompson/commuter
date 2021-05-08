import { Application } from "./Application"

window.addEventListener("load", ()=>{
  (window as any).COMMUTER = {}
  const globals = (window as any).COMMUTER

  const app = new Application()
})
