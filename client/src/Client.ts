// TODO dynamic config

import { SerializedConnection, SerializedRange } from "commuter-common";

let config = {
  baseURL: "http://localhost:3000"
}

export enum DataState {
  INITIAL = "INITIAL",
  LOADING = "LOADING",
  ERROR = "ERROR",
  READY = "READY",
  IN_USE = "IN_USE"
}

export class Client {
  static async fetch<T>(method:"GET"|"POST"|"PUT", path:string, body?:object): Promise<T> {
    const url = `${config.baseURL}${path}`
    const result = await fetch(url,
      {
        method,
        headers: {
          "content-type": "application/json;charset=UTF-8"
        },
        body: body != undefined? JSON.stringify(body): undefined
      }
    )
    const data = await result.json()
    if (data.meta.successful) {
      return data.payload as T
    }
    else {
      throw data
    }
  }

  static post = Client.fetch.bind(Client, "POST")
  static get = Client.fetch.bind(Client, "GET")
  static put = Client.fetch.bind(Client, "PUT")

  static async getRange(x0:number, y0:number, x1:number, y1:number):Promise<SerializedRange> {
    return await Client.get(`/range/${x0}/${y0}/${x1}/${y1}`)
  }

  range:SerializedRange|null = null
  rangeState:DataState = DataState.INITIAL

  updateRange(x0:number, y0:number, x1:number, y1:number) {
    this.rangeState = DataState.LOADING
    Client.getRange(x0, y0, x1, y1)
      .then((range) => {
        this.range = range
        this.rangeState = DataState.READY
      })
      .catch((e) => {
        console.error("ERROR WHILE LOADING RANGE")
        console.error(e)
        this.range = null
        this.rangeState = DataState.ERROR
      })
  }

  useRange():SerializedRange|null {
    if (this.rangeState == DataState.READY) {
      console.log("ready")
      this.rangeState = DataState.IN_USE
      return this.range
    }
  }
}
