var characteristic;
var characteristicWrite;
var service = null;
var BLEdevice = null;
var isBleResponseReceived = false;
var bleResponseTimeout = null;
var fromPage = '';
var onFpMessageHandler;


async function bleConnect() {
    try{
    setTimeout(() => {
      if (BLEdevice == null) {
      instructionNote = 'BYTESEAL biometric device signal data not received. Please TURN OFF and TURN ON again!';
      toastr.error(instructionNote, 'Error', {timeOut: 3000});
    }
    }, 7000);
    try{
     BLEdevice = await navigator.bluetooth.requestDevice({
            filters: [{ services: ['6e400001-b5a3-f393-e0a9-e50e24dcca9e'] }],
           // acceptAllDevices: true,
            optionalServices: ['6e400001-b5a3-f393-e0a9-e50e24dcca9e']
        });
     } catch (err){
        console.log ("ble-module: navigator.bluetooth.requestDevice -> FAILED, reason:", err);
     }  

        BLEdevice.addEventListener('gattserverdisconnected', onDisconnected);
        try {
        var server = await BLEdevice.gatt.connect();
        } catch (err) {
          console.log ("ble-module: BLEdevice.gatt.connect -> FAILED, reason:", err);
        }
        
        try {
          console.log('ble-module.js -> Connecting to GATT Server ...', server);
          service = await server.getPrimaryService('6e400001-b5a3-f393-e0a9-e50e24dcca9e');
        } catch (err) {
          console.log ("ble-module: server.getPrimaryService('6e400001-b5a3-f393-e0a9-e50e24dcca9e') -> FAILED, reason:", err);
        }

        try{
         characteristic = await service.getCharacteristic('6e400003-b5a3-f393-e0a9-e50e24dcca9e');
        } catch (err) {
          console.log ("ble-module: service.getCharacteristic('6e400003-b5a3-f393-e0a9-e50e24dcca9e') -> FAILED, reason:", err);
        }
        characteristic.addEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);
        characteristic.startNotifications();
        localStorage.setItem('isBleDeviceConnected', true);

        try {
         characteristicWrite = await this.service.getCharacteristic('6e400002-b5a3-f393-e0a9-e50e24dcca9e');
        } catch (err) {
          console.log ("ble-module: characteristicWrite object not returned, reason:", err);
        }

        /*--------------------------------------------------------------------------------------- APT COMMENTED 13 JAN 2020 <Start>
        setTimeout( function(){
          if(BLEdevice != null && chrome.storage && chrome.storage.local){
            localStorage.setItem('isBleDeviceConnected', true);
            console.log('ble-module.js -> isBleDeviceConnected .................true.');
          }else{
            localStorage.setItem('isBleDeviceConnected', false);
            console.log('ble-module.js -> isBleDeviceConnected .................false.');
          }
        }, 2000);

        
         if(chrome && extensionId != null && extensionId != '' && extensionId != undefined){
          chrome.runtime.onMessage.removeListener(onFpMessageHandler);
          //On asset icon click listen (csOnClickOfIcon)
          onFpMessageHandler = function(request, sender, sendResponse) {
              if(request && request.action == 'fpComboAuth'){
                  writeCharacteristics(':03,00:03@', 'fromCSFpComboAuth');
              }else if(request && request.action =='fpAuthentication'){
                 writeCharacteristics(':03,00:03@', 'fromCSFpAuth');
              }
          }
          chrome.runtime.onMessage.addListener(onFpMessageHandler);
        }
        ---------------------------------------------------------------------------------------- APT COMMENTED 13 JAN 2020 <End>*/
        
        return BLEdevice;
    }catch(error){
        console.log("ble-module.js, Error Connecting BLE =>",error+"->>"+error.message);
    }
}

function writeCharacteristics(command, from){ 

  if(from && from == 'fromManageDevice'){
    console.log("ble-module.js, writeCharacteristics, from page", from);
    fromPage = 'fromManageDevice';
    if (command==='identify') {command=':03,00:03@'} else {console.log('invalid command received fromManageDevice');}
 
  }else if(from && from == 'fromCSFpComboAuth'){
    console.log("ble-module.js, writeCharacteristics, from page", from);
    fromPage = 'fromCSFpComboAuth';
    if (command==='identify') {command=':03,00:03@'} else {console.log('invalid command received fromCSFpComboAuth');}
 
  }else if(from && from == 'fromCSFpAuth'){
    console.log("ble-module.js, writeCharacteristics, from page", from);
    fromPage = 'fromCSFpAuth';
 
  }else if(from && from == 'authFinger'){
    console.log("ble-module.js, writeCharacteristics, from page", from);
    fromPage = 'authFinger';
  }else if(from && from =='fromManageFingerprint'){
    console.log("ble-module.js, writeCharacteristics, from page", from);
    fromPage = 'manageFingerprint';
  }else if(from && from =='dummy'){
    console.log("ble-module.js, writeCharacteristics, from page", from);
    fromPage = 'dummycall';
  }


  isBleResponseReceived = false;
  
  console.log("BLE command to send .....", command);
      try{
          let encoder = new TextEncoder('utf-8');
          var helloString = encoder.encode(command);
          try {
            characteristicWrite.writeValue(helloString); //command sent
            console.log("ble-module.js, just sent command to BLE device",helloString);
            //var writeVal = characteristic.writeValue(helloString); //command sent
          } catch (err) {
            console.log ("ble-module: function: writeCharacteristics -> FAILED, reason:", err);
            toastr.error ("BLE device not responding. On/Off device", 'Error', {timeOut: 5000});
            window.dispatchEvent(new CustomEvent("deviceNotResponding"));
            localStorage.setItem('isBleDeviceConnected', false);
            chrome.runtime.sendMessage({action:"bleDeviceDisconnected", message:"disconnected"});
          }  

          /* ----------------------------------------------APT COMMENT - 13 JAN 2020 START --------------
          if(bleResponseTimeout!=null){
            clearInterval(bleResponseTimeout);
          }
        
          bleResponseTimeout = setTimeout( function(){
            if(!isBleResponseReceived){
              toastr.error("BLE device not responding. On/Off device", 'Error', {timeOut: 5000});
              console.log('------BLE response timeout!');
              window.dispatchEvent(new CustomEvent("deviceNotResponding"));
              localStorage.setItem('isBleDeviceConnected', false);
              chrome.runtime.sendMessage({action:"bleDeviceDisconnected", message:"disconnected"});
            }
          }, 10000);
          ----------------------------------------------APT COMMENT - 13 JAN 2020 END -------------- */

      } catch(error) {
          console.log('ble-module.js -> writeCharacteristics() -> catch(error): ',error);
      }
}






/*---------------------------------------------*
 * Function to handle write characteristic value change event
 */
function handleCharacteristicValueChanged(event){
    let result = new TextDecoder().decode(event.target.value);
    isBleResponseReceived = true;
    console.log(result);
    console.log(result.length);
    if(result.length == 31){
      try{
        document.getElementById('fname').value=result.substring(7,15);
      }
      catch{
        document.getElementById('sign').value=result.substring(7,15);
      }
        
    }
    else{
        console.log('wrong user');
    }
}



/**
 * Function to handle on disconnect BLE
 */
function onDisconnected() {
    console.log('ble-module.js -> onDisconnected(): BLE device disconnected, trying to reconnect');
    localStorage.setItem('isBleDeviceConnected', false);
      chrome.runtime.sendMessage({action:"bleDeviceDisconnected", message:"disconnected"});
    BLEdevice = null;
    //gat_connect();
}

/*---------------------------------*
 * Function to reconnect gatt server based on how many times reconnect(max retries) and after how much time(delay)
 */
function gat_connect() {
    exponentialBackoff(3 /* max retries */, 
                       2 /* seconds delay */,
                        function toTry() {
                            time('gat_connect(), toTry(): Connecting to Bluetooth Device... ');
                            return BLEdevice.gatt.connect();
                            },
                        function success() {
                            time('gat_connect(), success(): Bluetooth Device connected. Try disconnect it now.');
                            },
                        function fail() {
                            time('gat_connect(), fail():vFailed to reconnect.');
                            }
                     );
}

/*-----------------------------------*
 * Function to max retries and delay
 */
function exponentialBackoff(max, delay, toTry, success, fail) {
    toTry().then(result => success(result))
    .catch(_ => {
                    if (max === 0) {
                        return fail();
                        }
                    time('exponentialBackoff() -> Retrying in ' + delay + 's... (' + max + ' tries left)');
                    setTimeout(function() {
                            exponentialBackoff(--max, delay * 2, toTry, success, fail);
                        }, delay * 1000);
    });
}
  
function time(text) {
    console.log('[' + new Date().toTimeString().substr(0,8) + '] ' + 'ble-module.js -> ' + text);
}

function onBLEDisconnect() {
    if (!BLEdevice) {
      return;
    }
    console.log('Disconnecting from Bluetooth Device...');
    if (BLEdevice.gatt.connected) {
      BLEdevice.gatt.disconnect();
      BLEdevice = null;
    } else {
      console.log('> Bluetooth Device is already disconnected');
    }
  }