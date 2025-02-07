import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, TextInput, Button, Image } from 'react-native'
import React, { useState, useEffect, useContext } from 'react'
import * as ImagePicker from 'expo-image-picker'
import { ConfirmDialog, Dialog } from 'react-native-simple-dialogs'
import { firebase } from '../FileGate/config'
import {doc, setDoc, updateDoc, getDoc} from 'firebase/firestore'
import {db} from '../FileGate/firebase'
import { stringify } from '@firebase/util'
import RNDateTimePicker from '@react-native-community/datetimepicker'
import Checkbox from 'expo-checkbox'
import {userinfo} from './LoginScreen'
import { UploadContext } from './UploadContext';

  const submitForWeather = async (metadata) => {

       // const requestQueue = []; // an array to store pending requests
    // let isFetching = false; // a flag to track whether a request is currently being fetched
    const RATE_LIMIT_DELAY = 750; // the minimum delay between requests, in milliseconds

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

    function isDateBetween(dateStr, startStr, endStr) {
      const date = new Date(dateStr);
      const start = new Date(startStr);
      const end = new Date(endStr);
      return date >= start && date <= end;
    }

    function isEmpty(obj) {
      return Object.keys(obj).length === 0;
  }

  function delay(time) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, time);
      });
  }

  function roundTimeToNearestHour(time) {
    let [hour, minute, second] = time.split(':').map(Number);

    if (minute >= 30) {
        hour += 1;
    }

    if (hour==24){
      hour=23;
    }

    return `${hour.toString().padStart(2, '0')}:00:00`;
}
    // const latMin = latitude;
    // const latMax = latitude;
    // const longMin = longitude;
    // const longMax = longitude;
    const lat = metadata.latitude;
    const long = metadata.longitude;
    let variance = 0;
    let varianceLimit = .2; //arbitrary number. Every .005 variance is equivalent to 1 loop iteration.
    // console.log("lat: " + String(lat));
    // console.log("long: " + String(long));
    // console.log("lat: " + typeof lat);
    // console.log("long: " + typeof long);

    // Feb 13 2023 --> 2023-02-13
    

    // get date in format yyyy-mm-dd
    const today = date;
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    console.log("date: " + formattedDate);

    // const timestampString = metadata.date;
    // const date = new Date(timestampString.replace(/:/g, "-").substring(0, 10));
    // const formattedDate = date.toISOString().substring(0, 10);
    // console.log("date: " + formattedDate);

    // let station1id = "";
    // let station2id = "";
    // let station3id = "";
    let stationids = ["", "", ""];
    let index = 0;
    let weatherLists = [""];

    console.log("1: beginning");

    while (index < 3) {

        console.log("2: while loop started, " + index);
        // console.log('https://www.ncei.noaa.gov/cdo-web/api/v2/stations?extent=' + (lat-variance).toFixed(4) + ',' + (long-variance).toFixed(4) + ',' + (lat+variance).toFixed(4) + ',' + (long+variance).toFixed(4));

        // https://www.ncei.noaa.gov/cdo-web/api/v2/stations?extent=latitude-x,longitude-x,latitude+x,longitude+x

        let response = await fetchWithRateLimit('https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/+ '+lat +'%2C$' + long +'/' + formattedDate + '/' + formattedDate + '?unitGroup=us&include=hours&key=QDUCJXVWNKLYRSG83MJ866SDS&contentType=json', {
            method: 'GET',
        });
        let json = await response.json();

        console.log("3: returned get");
        // console.log(json);

        if (!isEmpty(json)) {
          console.log("4: JSON not empty")
            let hours = json.days[0]?.hours;
            if (hours){
              let roundedHour = roundTimeToNearestHour(time)
              
              let specificHour = hours.find(hour => hour.datetime === targetHour);

              if (specificHour) {
                weatherLists = JSON.stringify(specificHour);
                console.log("5. Got hour data")
            }

        }
        variance += 0.0050;
        if (variance > varianceLimit){
          console.log("Variance limit reached. Breaking loop.");
          throw new Error("Variance limit reached. Breaking loop. Date was: "+formattedDate+". Latitude was: "+lat+". Longitude was: "+long+".");
        }
        console.log("6: variance updated");
    }

    console.log("7: while loop completed");

    }

    console.log("8: submitForWeather function completed");
    console.log("8.1: weatherLists:\n" + weatherLists.join('\n'));
    // setWeatherIsUpdated(false);
    // setWeather(weatherLists);
    // console.log("11.2: weather variable (array) has been set");
    // console.log("11.3: weather:\n" + weather.join('\n'));
    return weatherLists;
}


const UploadScreenCombined = () => {
    const { uploadState, setUploadState } = useContext(UploadContext);
    const [image, setImage] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [metadata, setMetadata] = useState({})
    const [uploadTime, setUploadTime] = useState('')
    const [uploader, setUploader] = useState('')
    const [filepath, setFilepath] = useState('')
    const [userPass, setUserPass] = useState('')
    const [dialogVisible, setDialogVisible] = useState(false);
    const [latitude, setLatitude] = useState(null);
    const [longitude, setLongitude] = useState(null);
    const [date, setDate] = useState(new Date(new Date().toLocaleDateString()));
    const [uploadName, setUploadName] = useState("");

    const [imageButtonVisible, setImageButtonVisible] = useState(false);
    const [latitudeDialogVisible, setLatitudeDialogVisible] = useState(false);
    const [longitudeDialogVisible, setLongitudeDialogVisible] = useState(false);
    const [dateDialogVisible, setDateDialogVisible] = useState(false);
    
    const [toggleCheckBox, setToggleCheckBox] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const showDatePickerModal = () => {
        setShowDatePicker(true);
      };

    useEffect(() => {
      console.log("Latitude: " + metadata.latitude);
      console.log("Longitude: " + metadata.longitude);
      console.log("Date: " + metadata.date);
      console.log("Checkbox: " + toggleCheckBox);
      if (image) {
        setImageButtonVisible(true);
      }
      else {
        setImageButtonVisible(false);
      }
    }, [image, metadata, toggleCheckBox])

    function doesNotExist(x) {
      return (x == undefined || x == null || x == "NotFound" || x == "");
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

        pickImageCont(result);
      }
    
    function pickImageCont(result) {

      console.log("Value of uploading:::", uploadState);

      /* METADATA */
      console.log("Userid: ", userinfo.userID);
      console.log("Email: ", userinfo.email);
      console.log("Password: ", userinfo.password);
      
      const assets = result.assets[0]
      console.log(assets)
      const duration = assets.duration
      let filExIndex = assets.uri.search(/\..*/);
      const fileExtension = assets.uri.slice(filExIndex);
      const uploadtime = new Date().toDateString();
      const size = assets.fileSize;

      let date;
      let latitude;
      let longitude;

      if (assets.exif){
          date = assets.exif.DateTimeOriginal;
          // date = "NotFound";
          latitude = assets.exif.GPSLatitude;
          const latitudeSign = assets.exif.GPSLatitudeRef;
          if (latitudeSign == 'S')
              latitude = -latitude;
          longitude = assets.exif.GPSLongitude;
          const longitudeSign = assets.exif.GPSLongitudeRef;
          if (longitudeSign == 'W')
              longitude = -longitude;
      }
      else{
        date = "NotFound";
        latitude = "NotFound";
        longitude = "NotFound";
      }

      // REACT NATIVE DIALOG ASKING FOR DATE
      // REACT NATIVE DIALOG ASKING FOR LATITUDE
      // REACT NATIVE DIALOG ASKING FOR LONGITUDE
      console.log("latitude: " + latitude);
      console.log("longitude: " + longitude);
      console.log("date: " + date);
      
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
        
      //delay(1000).then(() => console.log('after delay'));

      console.log(metadata);
      console.log("Filepath: ", filepath);
      console.log("Upload Time: ", uploadTime);
      console.log("Uploader: ", uploader);

      const source = {uri: assets.uri}
      console.log(source);
      setImage(source);

      if (doesNotExist(latitude)) {
        setLatitudeDialogVisible(true);
      }
      else if (doesNotExist(longitude)) {
        setLongitudeDialogVisible(true);
      }
      else if (doesNotExist(date)) {
        setDateDialogVisible(true);
      }


    }

    function runPromise(func){
      return new Promise((resolve, reject) => {
        resolve(func());
      })
    }

    const uploadImage = async () => {
      let weatherSuccess = true;
      let failReason = "";
      let name;
      let weatherList;
      let failLog = "";
      setUploading(true);
      Alert.alert("Your upload is being processed. Please do not close out of the app until the upload is complete. You may move onto other tasks while it is running.");
      setImage(null); 
      setUploadName("");
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
          weatherSuccess = false;
          failLog = String(e);
          failReason = "Error in uploading document to storage."
      }
      try{
          console.log(metadata);
          console.log(filepath);
          const mseconds = String(Date.now());
          if(uploadName != ""){
            name = String(uploadTime + "_" + uploadName);
          }
          else{
            name = String(uploadTime + "_" + mseconds);
          }
            
          
          if(metadata.date != "NotFound" && !toggleCheckBox){ // add another condition: run weatherless
            weatherList = await submitForWeather(metadata);
          }
          else{
            weatherList = {};
          }

        }
        catch(e){
          if(weatherSuccess){
            console.log(e);
            console.log(e.stack);
            failLog = String(e);
            weatherSuccess = false;
            failReason = "Weather algorithm failure."
          }
        }

        try{
          await setDoc(doc(db, "fdu-birds", name), {filepath: filepath, metadata: metadata, 
              uploadTime: uploadTime, uploader: uploader, 
              weather: weatherList});

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
        if(weatherSuccess){
          console.log(e);
          console.log(e.stack);
          weatherSuccess = false;
          failLog = String(e);
          failReason = "Error in uploading metadata."
        }
      }
      setUploading(false);
      if(weatherSuccess){
        Alert.alert('Image/video upload successful!');
      }
      else{
        Alert.alert("Could not upload Image/Video: "+failReason+" Uploading error logs to database.");
        var today = new Date();
        const failTime = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        await setDoc(doc(db, "errorLogs", name), {uploadTime:uploadTime+" "+failTime, error:failLog});
      }

  };


  const latitudeChanged = (text) => {
    if (isNumeric(text)) {
        setLatitude(Number(text));
        setMetadata({...metadata, latitude: Number(text)})
        // const meta = Object.assign(metadata);
        // meta.latitude = Number(text);
        // setMetadata(meta);
        // console.log(latitude);
    }
  }

  const longitudeChanged = (text) => {
    if (isNumeric(text)) {
        setLongitude(Number(text));
        setMetadata({...metadata, longitude: Number(text)})
        // const meta = metadata;
        // meta.longitude = Number(text);
        // setMetadata(meta);
        // console.log(longitude);
    }
  }

  const dateChanged = (event, dateChoice) => {
    console.log(dateChoice);
    setDate(dateChoice);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    dateChoice = `${year}:${month}:${day} ${hours}:${minutes}:${seconds}`;
    setMetadata({...metadata, date: dateChoice});
  }

  const fixLatitude = () => {
    setLatitudeDialogVisible(false);
    if (doesNotExist(metadata.longitude)) {
      setLongitudeDialogVisible(true);
    }
    else if (doesNotExist(metadata.date)) {
      setDateDialogVisible(true);
    }
  }

  const fixLongitude = () => {
    setLongitudeDialogVisible(false);
    if (doesNotExist(metadata.date)) {
      setDateDialogVisible(true);
    }
  }

  const fixDate = () => {
    setDateDialogVisible(false);
  }

  function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
           !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
  }

  const makeDialogVisible = () => {
    setDialogVisible(true);
  }

  // const switchCheckbox = () => {
  //   const checked = toggleCheckBox;
  //   setToggleCheckBox(!checked);
  // }

  function formatDate(dateChoice) {
    if (doesNotExist(dateChoice)) {
      return "Not chosen";
    }
    dateChoice = new Date(dateChoice);
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthsOfYear = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const day = daysOfWeek[date.getDay()];
    const month = monthsOfYear[date.getMonth()];
    const dateStr = date.getDate();
    const year = date.getFullYear();

    const formattedDate = `${day}. ${month} ${dateStr}, ${year}`;
    return formattedDate;
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

      <View style={{ flexDirection: 'row', alignItems: 'center'}}>
        <Checkbox
          style={{ width: 30, height: 30}}
          disabled={false}
          value={toggleCheckBox}
          onValueChange={setToggleCheckBox}
        />
        <Text style={{ fontSize: 16, paddingLeft: 10 }}>
          Upload without weather data?
        </Text>
      </View>

      <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center'}}>
        <Text style={{ flex: 0.8, fontSize: 12, textAlign: 'center' }}>
          This option is recommended for images taken within the last 30 days as historical weather data is less likely to exist.
        </Text>
      </View>

      <View style={{width:300}}>
        <Text style={{marginTop:10}}>Name:</Text>
        <TextInput value={uploadName} onChangeText={inputName => setUploadName(inputName)} style={styles.input} onSubmitEditing={(value) => {setUploadName(value.nativeEvent.text)}}></TextInput>
      </View>

      {/* Upload Button */}
      {imageButtonVisible ? (
        <TouchableOpacity style={styles.uploadButton} onPress={uploadImage} disabled={!image}>
          <Text style={styles.uploadButtonText}>Upload</Text>
        </TouchableOpacity>
      ) : null}

      {/* Uploading Indicator */}
      {/* {uploading && (
        <View style={styles.uploadingIndicator}>
          <Text style={styles.uploadingText}>Uploading...</Text>
        </View>
      )} */}

      {/* <TouchableOpacity style={styles.uploadButton} onPress={makeDialogVisible}>
        <Text style={styles.uploadButtonText}>Dialog</Text>
      </TouchableOpacity>
      
      <Dialog
        visible={dialogVisible}
        title="Custom Dialog"
        onTouchOutside={() => setDialogVisible(false)}>
          <View>
            <TextInput
              placeholder="Latitude"
              value={latitude}
              onChangeText={latitudeChanged}
              style={styles.imagePickerButtonText}
            />
            <TextInput
              placeholder="Longitude"
              value={longitude}
              onChangeText={longitudeChanged}
              style={styles.imagePickerButtonText}
            />
          </View>
      </Dialog> */}
      
      <ConfirmDialog
        visible={latitudeDialogVisible}
        title="There was no latitude detected in this image's metadata. Please tap below and enter a latitude."
        // message="There was no latitude detected in this image's metadata. Please input a latitude."
        positiveButton={{
          title: "Submit",
          onPress: () => fixLatitude()
        }}>
          <View>
            <TextInput
              placeholder="Latitude"
              value={latitude}
              onChangeText={latitudeChanged}
              style={styles.imagePickerButtonText}
              onSubmitEditing={(value) => {
                if (isNumeric(value.nativeEvent.text)) {
                  if (Number(value.nativeEvent.text) < -90 || Number(value.nativeEvent.text) > 90) {
                    Alert.alert("Please enter only latitude values that are between -90 and 90.")
                  }
                }
                else {
                  Alert.alert("Please enter only numeric values for latitudes.")
                }
              }}
            />
          </View>
      </ConfirmDialog>

      <ConfirmDialog
        visible={longitudeDialogVisible}
        title="There was no longitude detected in this image's metadata. Please tap below and enter a longitude."
        // message="There was no longitude detected in this image's metadata. Please input a longitude."
        positiveButton={{
          title: "Submit",
          onPress: () => fixLongitude()
        }}>
          <View>
            <TextInput
              placeholder="Longitude"
              value={longitude}
              onChangeText={longitudeChanged}
              style={styles.imagePickerButtonText}
              onSubmitEditing={(value) => {
                if (isNumeric(value.nativeEvent.text)) {
                  if (Number(value.nativeEvent.text) < -180 || Number(value.nativeEvent.text) > 180) {
                    Alert.alert("Please enter only longitude values that are between -180 and 180.")
                  }
                }
                else {
                  Alert.alert("Please enter only numeric values for longitudes.")
                }
              }}
            />
          </View>
      </ConfirmDialog>

      <ConfirmDialog
        visible={dateDialogVisible}
        title="There was no date detected in this image's metadata. Please tap below and enter a date."
        // message="There was no date detected in this image's metadata. Please input a date."
        positiveButton={{
          title: "Submit",
          onPress: () => fixDate()
        }}>
        <View>
          {showDatePicker ? (
          <RNDateTimePicker 
            value={new Date()}
            mode="date"
            onChange={(event, selectedDate) => {
              if (selectedDate !== undefined) {
                dateChanged(event, selectedDate);
              }
              setShowDatePicker(false);
            }}
            />) : <Button title="Select Date" onPress={showDatePickerModal} />}
          <Text>Date Selected: {formatDate(metadata.date)}</Text>
        </View>
      </ConfirmDialog>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
  flex: 1,
  backgroundColor: '#fff',
  alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  header: {
  width: '100%',
  height: 60,
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

  export default UploadScreenCombined;
  export {submitForWeather};