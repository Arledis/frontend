import React, { Component } from 'react';
import { Map, TileLayer, Marker, CircleMarker, GeoJSON, Popup, ZoomControl   } from 'react-leaflet';
import Request from '../../helpers/request'
import './MapBox.css'
import './SideBar.css'
import SideBar from './SideBar'
import LocationPopup from './LocationPopup'


class MapBox extends Component {

  constructor(props){
    super(props)
    this.state = {
      settings: {
        lat: 57.00,
        lng: -6.00,
        zoom: 7
      },
      trail: null,
      locations: {},
      newRoute: {
        start: null,
        end: null
      },
      trailPoints: null
    }
  }

  fetchTrail() {
    const url = "https://raw.githubusercontent.com/DafyddLlyr/geoJSON_test/master/map.geojson"
    fetch(url)
    .then(res => res.json())
    .then(trail => {
      let newState = Object.assign({}, this.state)
      newState.trail = trail
      this.setState(newState)
      this.fetchPoints()
    })
  }

  showTrail() {
    if(this.state.trail) {
      return (
        <GeoJSON
        key={this.state.trail}
        data={this.state.trail} />
      )
    }
  }


  fetchLocations() {
    const request = new Request()
    const url = "api/locations/"

    let promise1 = request.get(url + "accommodation")
    let promise2 = request.get(url + "services")
    let promise3 = request.get(url + "pointsOfInterest")

    Promise.all([promise1, promise2, promise3])
    .then(data => {
      const newState = Object.assign({}, this.state);
      newState.locations.accommodation = data[0]
      newState.locations.services = data[1]
      newState.locations.pointsOfInterest = data[2]
      this.setState(newState);
    })
  }

  showLocations() {
    let layerGroup = []
    if(this.state.locations) {
      for(let type of Object.keys(this.state.locations)) {
        for(let location of this.state.locations[type]) {
          layerGroup.push(
            <Marker position={location.coordinates} key={location.id}>
            <LocationPopup location={location} saveFavourite={this.props.updateUser} user={this.props.user}></LocationPopup>
            </Marker>
          )
        }
      }
    }
    return layerGroup;
  }

  fetchPoints() {
    var geojson = {
      type: "FeatureCollection",
      features: []
    }
    if(this.state.trail) {
      for(let point of this.state.trail.features[0].geometry.coordinates) {
        geojson.features.push(
          {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: point
            }
          }
        )
      }
    }

    let newState = Object.assign({}, this.state)
    newState.trailPoints = geojson
    this.setState(newState)
  }

  // Display point on mouseover
  // handleMarkerMouseOver(event) {
  //   event.target.options.radius = 10;
  //   event.target.options.opacity = 1;
  //   console.log(event.target._leaflet_id)
  //   console.log(event)
  // }

  createPoints() {
    let layerGroup = []
    if(this.state.trailPoints) {
      for(let point of this.state.trailPoints.features) {
        let coords = [point.geometry.coordinates[1], point.geometry.coordinates[0]]
        layerGroup.push(
          <CircleMarker key={coords} center={coords} radius={0} opacity={0} onClick={(event) => this.handleMarkerClick(event, this.props.getCoords)} onMouseOver={this.handleMarkerMouseOver}/>
        )
      }
    }
    return layerGroup
    // Decide if layer group or geoJSON works better
    // return <GeoJSON data={this.state.trailPoints} />
  }

  handleMarkerClick(event, getCoords) {
    getCoords([event.latlng.lat, event.latlng.lng])
  }

  componentDidMount() {
    this.fetchTrail()
    this.fetchLocations()
  }

  render() {

    const position = [this.state.settings.lat, this.state.settings.lng]

    return (
      <>
      <SideBar
      view={this.props.view}
      setView={this.props.setView}
      user={this.props.user}
      createNewRoute={this.props.createNewRoute}
      newRoute={this.props.newRoute}
      currentCoords={this.props.currentCoords}/>

      <Map center={position} zoom={this.state.settings.zoom} id="map-box" zoomControl={false}>
      <ZoomControl position={"topright"} />
      <TileLayer
      attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
      url="https://maps.heigit.org/openmapsurfer/tiles/roads/webmercator/{z}/{x}/{y}.png"
      />
      {this.showTrail()}
      {this.showLocations("accommodation")}
      {this.createPoints()}
      </Map>
      </>
    )
  }
}
export default MapBox;
