import statejsonfile from "../layerdata/us-state.json"
import countyjsonfile from "../layerdata/county_0_5m.json"
import congressionjsonfile from "../layerdata/congressional_5m.json"

var turf = require("@turf/turf")

module.exports = function (self) {
    /**
   *  spatial join, points within polygons
   */
  self.spatialJoinState = function( polygons) {

    var tpoints = turf.point(self.getNodeList().map((node, i) => {
        return [node.data.ref.LatY, node.data.ref.LonX]
    })  )

    var pointsFeature = turf.featureCollection(tpoints)

    statejsonfile.features.forEach((state=>{
        //keep property of state, such as name 
        var tpolygon = turf.polygon(state.geometry.coordinates)
        var withinResults = turf.tag(pointsFeature, tpolygon)
        //calculate number of point for each state 

        state.withinpoint  = 
        
    }))

    return statejsonfile 

  }
}