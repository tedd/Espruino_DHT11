/* Copyright (c) 2014 Your Name. See the file LICENSE for copying permission. */
/*
Quick description of my module...
*/

function DHT11(pin) {
  this.pin = pin;
  this.d="";
  var _this = this;
  // start watching for state change
  this.watch = setWatch(function(t) {
    if (_this.d.length < 50) // Make sure we don't keep going if no read is happening
      _this.d += 0|(t.time-t.lastTime>0.00005);
  }, _this.pin, {edge:'falling',repeat:true} );

}

/** 'public' constants here */
DHT11.prototype.read = function(cb, n) {
  DHT11read(this.pin, cb,n);
};

/** This is 'exported' so it can be used with `require('MOD123.js').connect(pin1,pin2)` */
exports.connect = function (pin) {
  return new DHT11(pin);
};


var ht={};
DHT11.prototype.read = function (cb, n) {
  if (!n) n=10;
  var ht = this;
  //console.log(ht.pin + ": " + ht.d);
  // Clear input buffer so we get a fresh read
  ht.d = "";
  digitalWrite(ht.pin, 0);
  pinMode(ht.pin,"output"); // force pin state to output
  // raise pulse after 1ms
  setTimeout(function() { pinMode(ht.pin, 'input_pullup'); pinMode(ht.pin); }, 20);
  // stop looking after 50ms
  setTimeout(function() {
    //if(ht.watch){ ht.watch = clearWatch(ht.watch); }
    var cks =
        parseInt(ht.d.substr(2,8),2)+
        parseInt(ht.d.substr(10,8),2)+
        parseInt(ht.d.substr(18,8),2)+
        parseInt(ht.d.substr(26,8),2);
    if (cks&&((cks&0xFF)==parseInt(ht.d.substr(34,8),2))) {
      cb({
        raw : ht.d,
        rh : parseInt(ht.d.substr(2,8),2),
        temp : parseInt(ht.d.substr(18,8),2)
      });
    } else {
      if (n>1) setTimeout(function() {ht.read(cb,--n);},500);
      //if (n>1) setTimeout(function() {DHT11read(pin, cb,--n);},500);
      else cb({err:true, checksumError:cks>0, raw:ht.d, temp:-1, rh:-1});
    }
  }, 50);
};
