import React, { Component } from "react";
import MapView from "react-native-maps";
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Animated,
  Image,
  Dimensions,
  TouchableOpacity,
  Alert,
  Button,
  TouchableHighlight,
  Modal,
} from "react-native";
const { width, height } = Dimensions.get("window");

import { firestore } from "./firebase"


const CARD_HEIGHT = height / 4;
const CARD_WIDTH = CARD_HEIGHT - 50;

export class Map extends Component {
  state = {
    markers: [],
    region: {
      latitude: 45.52220671242907,
      longitude: -122.6653281029795,
      latitudeDelta: 0.04864195044303443,
      longitudeDelta: 0.040142817690068,
    },
  };

  componentWillMount() {
    this.index = 0;
    this.animation = new Animated.Value(0);
  }

  async componentDidMount() {

    navigator.geolocation.getCurrentPosition((position) => {
      console.log("lat", position.coords.latitude, "lng", position.coords.longitude);

      let region = Object.assign({}, this.state.region);    //creating copy of object
      region.latitude = position.coords.latitude;
      region.longitude = position.coords.longitude;

      this.map.animateToRegion(
        {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          latitudeDelta: this.state.region.latitudeDelta,
          longitudeDelta: this.state.region.longitudeDelta,
        },
        5
      );
      this.setState({region: region});
      console.log(this.state.region);
    });


    firestore.collection("reviews").onSnapshot((snapshot) => {
      let markers = [];

      snapshot.forEach(function(doc) {

        if ('coordinates' in doc.data() && 'latitude' in doc.data().coordinates && 'longitude' in doc.data().coordinates)
          markers.push(formatReviewDocument(doc))

      });

      snapshot.docChanges().forEach(function(change) {
            if (change.type === "added") {
                console.log("New city: ", change.doc.data());
              }
            if (change.type === "modified") {
                console.log("Modified city: ", change.doc.data());
                alert("modified");
            }
            if (change.type === "removed") {
                console.log("Removed city: ", change.doc.data());
                alert("removed");
            }
        });

      // let markers = [{
      //   coordinate: {
      //     latitude: 43.43142848128524,
      //     longitude: -80.54408286416437,
      //   },
      //   title: "Second Best Place",
      //   description: "This is the second best place in Portland",
      //   image: Images[1],
      // }];

      this.setState({markers: markers});
    }).catch(error => {
      console.log("vb", error);
    });


    // We should detect when scrolling has stopped then animate
    // We should just debounce the event listener here
    this.animation.addListener(({ value }) => {
      console.log("val", value);
      let index = Math.floor(value / CARD_WIDTH + 0.3); // animate 30% away from landing on the next item
      if (index >= this.state.markers.length) {
        index = this.state.markers.length - 1;
      }
      if (index <= 0) {
        index = 0;
      }

      clearTimeout(this.regionTimeout);
      this.regionTimeout = setTimeout(() => {
        if (this.index !== index) {
          this.index = index;
          const { coordinate } = this.state.markers[index].coordinate;
          console.log("coord2", coordinate);
          this.map.animateToRegion(
            {
              ...coordinate,
              latitudeDelta: this.state.region.latitudeDelta,
              longitudeDelta: this.state.region.longitudeDelta,
            },
            350
          );
        }
      }, 10);
    });
  }

  addNewRating = () => {
    Alert.alert("hello")
  };



  render() {
    const interpolations = this.state.markers.map((marker, index) => {
      console.log("a");
      const inputRange = [
        (index - 1) * CARD_WIDTH,
        index * CARD_WIDTH,
        ((index + 1) * CARD_WIDTH),
      ];
      const scale = this.animation.interpolate({
        inputRange,
        outputRange: [1, 2.5, 1],
        extrapolate: "clamp",
      });
      const opacity = this.animation.interpolate({
        inputRange,
        outputRange: [0.35, 1, 0.35],
        extrapolate: "clamp",
      });
      return { scale, opacity };
    });

    return (
      <View style={styles.container}>

        <MapView
          ref={map => this.map = map}
          initialRegion={this.state.region}
          style={styles.container}
        >
          {this.state.markers.map((marker, index) => {
            const scaleStyle = {
              transform: [
                {
                  scale: interpolations[index].scale,
                },
              ],
            };
            const opacityStyle = {
              opacity: interpolations[index].opacity,
            };
            return (
              <MapView.Marker key={index} coordinate={marker.coordinate}>
                <Animated.View style={[styles.markerWrap, opacityStyle]}>
                  <Animated.View style={[styles.ring, scaleStyle]} />
                  <View style={styles.marker} />
                </Animated.View>
              </MapView.Marker>
            );
          })}
        </MapView>

        <Animated.ScrollView
          horizontal
          scrollEventThrottle={1}
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH}
          onScroll={Animated.event(
            [
              {
                nativeEvent: {
                  contentOffset: {
                    x: this.animation,
                  },
                },
              },
            ],
            { useNativeDriver: true }
          )}
          style={styles.scrollView}
          contentContainerStyle={styles.endPadding}
        >
          {this.state.markers.map((marker, index) => (
            <TouchableOpacity style={styles.card} key={index} onPress={()=> {

              Alert.alert(marker.title)

            }}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>5</Text>
              </View>
              <Image
                source={ {uri: marker.image}}
                style={styles.cardImage}
                resizeMode="cover"
              />
              <View style={styles.textContent}>
                <Text numberOfLines={1} style={styles.cardtitle}>{marker.title}</Text>
                <Text numberOfLines={1} style={styles.cardDescription}>
                  {marker.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </Animated.ScrollView>



        <Button title={"hello"} onPress={() => {this.addNewRating()}}/>

      </View>
    );
  }
}

const styles = StyleSheet.create({
  badge: {
    right: 0,
    left: 0,
    top: 0,
    alignItems: 'center',

    padding: 20,
  },
  badgeText: {
    color: "#007f7f",
    // size: 20,
  },
  container: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 15,
    left: 0,
    right: 0,
    alignItems: 'center'
  },
  scrollView: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    paddingVertical: 10,
  },
  endPadding: {
    paddingRight: width - CARD_WIDTH,
  },
  card: {
    padding: 10,
    elevation: 5,
    borderRadius: 10,
    backgroundColor: "#FFF",
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowRadius: 50,
    shadowOpacity: 1,
    shadowOffset: { x: 2, y: -2 },
    height: CARD_HEIGHT,
    width: CARD_WIDTH,
    overflow: "hidden",
  },
  cardImage: {
    flex: 3,
    width: "100%",
    height: "100%",
    alignSelf: "center",
  },
  textContent: {
    flex: 1,
  },
  cardtitle: {
    fontSize: 12,
    marginTop: 5,
    fontWeight: "bold",
  },
  cardDescription: {
    fontSize: 12,
    color: "#444",
  },
  markerWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  marker: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(130,4,150, 0.9)",
  },
  ring: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(130,4,150, 0.3)",
    position: "absolute",
    borderWidth: 1,
    borderColor: "rgba(130,4,150, 0.5)",
  },
});

AppRegistry.registerComponent("mapfocus", () => Map);

const formatReviewDocument = (doc) => {
  const data = doc.data();
  return {
    title: data.title,
    description: data.description,
    coordinate: {
      latitude: data.coordinates.latitude,
      longitude: data.coordinates.longitude,
    },
    image: data.imageUrl,
  }
};