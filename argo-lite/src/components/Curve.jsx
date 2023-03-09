import React, {useEffect} from 'react'
import L from 'leaflet'
import 'leaflet-curve'
import { useLeafletContext } from '@react-leaflet/core'

const Curve = (props) => {
    const context = useLeafletContext()
    const {path, options} = props

    useEffect(() => {
        const curve = new L.Curve(path, options)
        const container = context.layerContainer || context.map
        container.addLayer(curve)

        return () => {
            container.removeLayer(curve)
        }
    })

    return null

}

export default Curve