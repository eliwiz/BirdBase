import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, Image, TextInput, Button } from 'react-native'
import React, { useState, useEffect } from 'react'
import { useStateWithCallbackLazy } from 'use-state-with-callback'
import * as ImagePicker from 'expo-image-picker'
import { firebase } from '../FileGate/config'
import {doc, setDoc, updateDoc, getDoc} from 'firebase/firestore'
import {db} from '../FileGate/firebase'
import { stringify } from '@firebase/util'
// import datetimepicker from '@react-native-community/datetimepicker'
import RNDateTimePicker from '@react-native-community/datetimepicker'
// import { get } from 'jquery'
import {userinfo} from './LoginScreen'

const UploadScreenManual = () => {
    const [image, setImage] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [metadata, setMetadata] = useState({})
    const [uploadTime, setUploadTime] = useState('')
    const [uploader, setUploader] = useState('')
    const [filepath, setFilepath] = useState('')
    // const [weather, setWeather] = useState([])
    // const [weatherIsUpdated, setWeatherIsUpdated] = useState(false)
    const [userPass, setUserPass] = useState('')
    const [weather, setWeather] = useState([]);
    
    const [latitude, setLatitude] = useState(null);
    const [longitude, setLongitude] = useState(null);
    const [date, setDate] = useState(new Date(new Date().toLocaleDateString()));
    const [mode, setMode] = useState('date');
    const [show, setShow] = useState(false);

    // const requestQueue = []; // an array to store pending requests
    // let isFetching = false; // a flag to track whether a request is currently being fetched
    const RATE_LIMIT_DELAY = 500; // the minimum delay between requests, in milliseconds

    async function fetchWithRateLimit(url, options) {
        return new Promise((resolve, reject) => {
          // delay the request by the rate limit delay
          setTimeout(() => {
            fetch(url, options)
              .then(response => {
                // resolve the promise with the response
                resolve(response);
              })
              .catch(error => {
                // reject the promise with the error
                reject(error);
            });
          }, RATE_LIMIT_DELAY);
        });
    }

    // function fetchWithRateLimit(url, options) {
    //     return new Promise((resolve, reject) => {
    //         // create a function to add the request to the queue
    //         const enqueueRequest = () => {
    //         requestQueue.push({ url, options, resolve, reject });
    //         processRequestQueue();
    //         };

    //         // add the request to the queue
    //         enqueueRequest();
    //     });
    // }

    // function processRequestQueue() {
    //     // if a request is already being fetched or the queue is empty, do nothing
    //     if (isFetching || requestQueue.length === 0) {
    //         return;
    //     }

    //     // get the next request from the queue
    //     const { url, options, resolve, reject } = requestQueue.shift();

    //     // fetch the request
    //     isFetching = true;
    //     fetch(url, options)
    //         .then(response => {
    //         // reset the flag and process the next request in the queue after the rate limit delay
    //         isFetching = false;
    //         setTimeout(processRequestQueue, RATE_LIMIT_DELAY);

    //         // resolve the promise with the response
    //         resolve(response);
    //         })
    //         .catch(error => {
    //         // reset the flag and process the next request in the queue immediately
    //         isFetching = false;
    //         processRequestQueue();

    //         // reject the promise with the error
    //         reject(error);
    //         });
    // }

    // useEffect(() => {
    //     console.log("useEffect: weather variable has been updated");
    //     console.log("weather:\n" + weather.join('\n'));
    //     setWeatherIsUpdated(true);
    // }, [weather])

    function isDateBetween(dateStr, startStr, endStr) {
        const date = new Date(dateStr);
        const start = new Date(startStr);
        const end = new Date(endStr);
        return date >= start && date <= end;
    }

    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: false,
            aspect: [4, 3],
            quality: 1,
            exif:true
        });
        //console.log(result.assets);

        /* METADATA */
        console.log("Userid: ", userinfo.userID);
        console.log("Email: ", userinfo.email);
        console.log("Password: ", userinfo.password);
        const assets = result.assets[0]
        const duration = assets.duration
        let filExIndex = assets.uri.search(/\..*/);
        const fileExtension = assets.uri.slice(filExIndex);
        const date = assets.exif.DateTimeOriginal;
        const uploadtime = new Date().toDateString();
        const size = assets.fileSize;
        let latitude = assets.exif.GPSLatitude;
        const latitudeSign = assets.exif.GPSLatitudeRef;
        if (latitudeSign == 'S')
            latitude = -latitude;
        let longitude = assets.exif.GPSLongitude;
        const longitudeSign = assets.exif.GPSLongitudeRef;
        if (longitudeSign == 'W')
            longitude = -longitude;
        
        console.log(assets)
        console.log("RELEVANT METADATA: ")
        // console.log(duration)
        // console.log(fileExtension)
        // console.log(date)
        // console.log(uploadtime)
        // console.log(size)
        // console.log(latitude)
        // console.log(longitude)

        // filepath = assets.uri;
        // metadata.duration = duration;
        // metadata.fileExtension = fileExtension;
        // metadata.date = date;
        // uploadTime = uploadtime;
        // metadata.size = size;
        // metadata.latitude = latitude;
        // metadata.longitude = longitude;
        setMetadata({duration: duration, fileExtension:fileExtension, date:date, latitude:latitude, longitude:longitude, size:size});
        setUploadTime(uploadtime);
        setUploader(userinfo.userID);
        setUserPass(userinfo.password);
        console.log("New uploader: ", uploader)
        setFilepath(assets.uri.substring(assets.uri.lastIndexOf('/') + 1));

        function delay(time) {
            return new Promise(resolve => setTimeout(resolve, time));
          }
          
        delay(1000).then(() => console.log(''));

        console.log(metadata);
        console.log("Filepath: ", filepath);
        console.log("Upload Time: ", uploadTime);
        console.log("Uploader: ", uploader);


        const source = {uri: assets.uri}
        console.log(source);
        setImage(source);
    };

    const uploadImage = async () => {
        setUploading(true);
        const response = await fetch(image.uri);
        const blob = await response.blob();
        const filename = image.uri.substring(image.uri.lastIndexOf('/') + 1);
        var ref = firebase.storage().ref().child(filename).put(blob);

        try {
            await ref;
            console.log("ref: " + ref.snapshot);
            
            // await storageRef;
        } catch (e) {
            console.log(e);
        }
        try{
            console.log(metadata);
            console.log(filepath);
            // setWeatherIsUpdated(false);
            const mseconds = String(Date.now());
            const name = String(uploadTime + "_" + mseconds);
            const weatherList = await submitForWeather();
            setWeather(weatherList);
            // setWeather(await submitForWeather(), async () => {
            //     console.log("Weather: \n" + weather);
            //     await setDoc(doc(db, "fdu-birds-2", name), {filepath: filepath, metadata: metadata, 
            //         uploadTime: uploadTime, uploader: uploader, 
            //         weather: weather});
            // });
            await setDoc(doc(db, "fdu-birds", name), {filepath: filepath, metadata: metadata, 
                uploadTime: uploadTime, uploader: uploader, 
                weather: weatherList});
            // while (!weatherIsUpdated) {
            //     delay(1000);
            //     console.log("Delaying 1 second...")
            // }
            // setWeatherIsUpdated(false);
            const uid = String(userinfo.userID);
            const docRef = doc(db, "Userinfo", uid);
            const docSnap = await getDoc(docRef);
            let count = 0;
            
            if (docSnap.exists()) {
                console.log("Upload count (previous):", docSnap.data().uploadCount);
                count = docSnap.data().uploadCount;
            } else {
            // doc.data() will be undefined in this case
            }
            //Update the uploaded document counter for user
            await updateDoc(docRef, {
                uploadCount: count + 1
            });
        }
        catch(e){
            console.log(e);
            console.log(e.stack);
        }
        setUploading(false);
        Alert.alert('Image/video upload successful!');
        setImage(null);
    };

    const datetimeChanged = (event, datetimeChoice) => {
        console.log(datetimeChoice);
        setDate(datetimeChoice);
    }

    function isEmpty(obj) {
        return Object.keys(obj).length === 0;
    }

    function isNumeric(str) {
        if (typeof str != "string") return false // we only process strings!  
        return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
               !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
    }

    function delay(time) {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve();
          }, time);
        });
    }

    const latitudeChanged = (text) => {
        if (isNumeric(text)) {
            setLatitude(Number(text));
            console.log(latitude);
        }
    }

    const longitudeChanged = (text) => {
        if (isNumeric(text)) {
            setLongitude(Number(text));
            console.log(longitude);
        }
    }

    const submitForWeather = async () => {
        // const latMin = latitude;
        // const latMax = latitude;
        // const longMin = longitude;
        // const longMax = longitude;
        const lat = latitude;
        const long = longitude;
        let variance = 0;
        // console.log("lat: " + String(lat));
        // console.log("long: " + String(long));
        // console.log("lat: " + typeof lat);
        // console.log("long: " + typeof long);
        

        // get date in format yyyy-mm-dd
        const today = date;
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        console.log("date: " + formattedDate);

        // let station1id = "";
        // let station2id = "";
        // let station3id = "";
        let stationids = ["", "", ""];
        let index = 0;
        let weatherLists = ["", "", ""];

        console.log("RAHHHHHHHHH");
        console.log("1: beginning");
        console.log(index);

        while (index < 3) {

            console.log("2: while loop started");
            console.log('https://www.ncei.noaa.gov/cdo-web/api/v2/stations?extent=' + (lat-variance).toFixed(4) + ',' + (long-variance).toFixed(4) + ',' + (lat+variance).toFixed(4) + ',' + (long+variance).toFixed(4));

            // https://www.ncei.noaa.gov/cdo-web/api/v2/stations?extent=latitude-x,longitude-x,latitude+x,longitude+x
            let response = await fetchWithRateLimit('https://www.ncei.noaa.gov/cdo-web/api/v2/stations?extent=' + (lat-variance).toFixed(4) + ',' + (long-variance).toFixed(4) + ',' + (lat+variance).toFixed(4) + ',' + (long+variance).toFixed(4), {
                method: 'GET',
                headers: {
                    token: 'lBrZIkHvtTmYvdYlKdnljwvZOUTRBwgI',
                },
            });
            let json = await response.json();

            console.log("3: json gotten from response");
            console.log(json);

            if (!isEmpty(json)) {

                for (let i = 0; i < json["results"].length; i++) {
                    let stationid = json["results"][i]["id"];
                    console.log("3.5: stationid is " + stationid);
                    if (!isDateBetween(formattedDate, json["results"][i]["mindate"], json["results"][i]["maxdate"]) || stationids.includes(stationid)) {
                        console.log("3.6: stationid " + stationid + " ignored");
                        continue;
                    }
                    //https://www.ncei.noaa.gov/cdo-web/api/v2/datasets?stationid=insertstationidhere
                    let response2 = await fetchWithRateLimit('https://www.ncei.noaa.gov/cdo-web/api/v2/datasets?stationid=' + String(stationid), {
                        method: 'GET',
                        headers: {
                            token: 'nOAusqiwSpCeUaFDUlOtljxvxWeAxQdF',
                        },
                    });
                    let json2 = await response2.json();

                    console.log("4: json2 gotten from response");
                    console.log(json2);

                    if (!isEmpty(json2)) {

                        for (let j = 0; j < json2["results"].length; j++) {
                            if (json2["results"][j]["id"] === "GHCND") {
                                stationids[index] = stationid;
                                index++;
                                console.log("5: station that supports GHCND dataset found");
                            }
                            if (index >= 3) {
                                break;
                            }
                        }
                        if (index >= 3) {
                            break;
                        }
                    
                    }
                }
                // .then(response => response.json())
                // .then(async json => {
                //     for (let i = 0; i < json["results"].length; i++) {
                //         let stationid = json["results"][i]["id"];
                //         //https://www.ncei.noaa.gov/cdo-web/api/v2/datasets?stationid=insertstationidhere
                //         await fetch('https://www.ncei.noaa.gov/cdo-web/api/v2/datasets?stationid=' + String(stationid), {
                //             method: 'GET',
                //             headers: {
                //                 token: 'nOAusqiwSpCeUaFDUlOtljxvxWeAxQdF',
                //             },
                //         })
                //         .then(response2 => response2.json())
                //         .then(json2 => {
                //             for (let j = 0; j < json2["results"].length; j++) {
                //                 if (json2["results"][j]["id"] === "GHCND") {
                //                     stationids[index] = stationid;
                //                     index++;
                //                 }
                //                 if (index >= 3) {
                //                     break;
                //                 }
                //             }
                //         })
                //     }
                // })

            }
            variance += 0.0050;
            console.log("6: variance updated");
        }

        console.log("7: while loop completed");
        console.log("7.0: stationids: " + stationids.toString());

        for (let i = 0; i < stationids.length; i++) { // needs some work

            console.log("8: new for loop started");

            //https://www.ncei.noaa.gov/cdo-web/api/v2/data?datasetid=GHCND&stationid=insertstationidhere&startdate=insertdatehere&enddate=insertdatehere
            let response3 = await fetchWithRateLimit('https://www.ncei.noaa.gov/cdo-web/api/v2/data?datasetid=GHCND&stationid=' + stationids[i]  + '&startdate=' + formattedDate + '&enddate=' + formattedDate, {
                method: 'GET',
                headers: {
                    token: 'nOAusqiwSpCeUaFDUlOtljxvxWeAxQdF',
                },
            });
            let json3 = await response3.json();
            console.log("9: json3 gotten from response");
            console.log(json3);

            if (!isEmpty(json3)) {

                const weatherList = json3["results"];
                // console.log(String(i) + ": " + weatherList.toString());
                console.log(String(i) + ": " + JSON.stringify(weatherList));
                weatherLists[i] = JSON.stringify(weatherList);

                console.log("10: weather added to weatherList");
            }
        }

        console.log("11: submitForWeather function completed");
        console.log("11.1: weatherLists:\n" + weatherLists.join('\n'));
        // setWeatherIsUpdated(false);
        // setWeather(weatherLists);
        // console.log("11.2: weather variable (array) has been set");
        // console.log("11.3: weather:\n" + weather.join('\n'));
        return weatherLists;
    }
    
    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Upload Screen</Text>
      </View>

      {/* Image Preview */}
      <View style={styles.imagePreviewContainer}>
        {image ? (
          <Image source={image} style={styles.imagePreview} />
        ) : (
          <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
            <Text style={styles.imagePickerButtonText}>Pick an image</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Upload Button */}
      <TouchableOpacity style={styles.uploadButton} onPress={uploadImage} disabled={!image}>
      <Text style={styles.uploadButtonText}>Upload</Text>
      </TouchableOpacity>

      {/* Uploading Indicator */}
        {uploading && (
          <View style={styles.uploadingIndicator}>
            <Text style={styles.uploadingText}>Uploading...</Text>
          </View>
        )}



            <View style={styles.container}>
                <TextInput
                    placeholder="Latitude"
                    value={latitude}
                    onChangeText={latitudeChanged}
                    style={styles.input}
                />
                <TextInput
                    placeholder="Longitude"
                    value={longitude}
                    onChangeText={longitudeChanged}
                    style={styles.input}
                />
            {/* </View>
            <View> */}
                <RNDateTimePicker 
                    value={date}
                    mode="date"
                    onChange={datetimeChanged}
                />
                <Text>Selected: {date.toLocaleDateString()}</Text>
                {/* {show && (
                    <DateTimePicker
                        testID="dateTimePicker"
                        value={date}
                        mode={mode}
                        is24Hour={true}
                        onChange={onChange}
                    />
                )} */}
            </View>
            {/* <View style={styles.container}>
                <TouchableOpacity style={styles.buttonStyle} onPress={submitForWeather}>
                    <Text style={styles.textStyle}>
                        Submit for weather
                    </Text>
                </TouchableOpacity>
            </View> */}
        </SafeAreaView>
    )
}

export default UploadScreenManual;

const styles = StyleSheet.create({
    container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    
    },
    header: {
    width: '100%',
    height: 80,
    backgroundColor: '#6646ee',
    alignItems: 'center',
    justifyContent: 'center',
    },
    title: {
    fontSize: 24,
    color: '#fff',
    },
    imagePreviewContainer: {
    width: '90%',
    height: '50%',
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#6646ee',
    alignItems: 'center',
    justifyContent: 'center',
    },
    imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    },
    imagePickerButton: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    },
    imagePickerButtonText: {
    fontSize: 20,
    color: '#6646ee',
    },
    uploadButton: {
    width: '80%',
    height: 50,
    backgroundColor: '#6646ee',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    borderRadius: 10,
    },
    uploadButtonText: {
    fontSize: 20,
    color: '#fff',
    },
    uploadingIndicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    },
    uploadingText: {
    fontSize: 20,
    color: '#fff',
    },
  });