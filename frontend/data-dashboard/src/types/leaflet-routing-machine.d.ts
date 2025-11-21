// src/types/leaflet-routing-machine.d.ts
declare module "leaflet-routing-machine" {
  import * as L from "leaflet"

  namespace L {
    namespace Routing {
      function control(options: any): any
    }
  }

  export default L
}