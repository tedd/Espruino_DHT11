/* Copyright (c) 2014 Your Name. See the file LICENSE for copying permission. */
/*
Quick description of my module...
*/

function DHT11(pin) {
  this.pin = pin;
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
function DHT11read(pin, cb, n) {
  if (!n) n=10;
  var d = "";
//  console.log(pin);
//  var ht = this;
  digitalWrite(pin, 0);
  pinMode(pin,"output"); // force pin state to output
  // start watching for state change
  this.watch = setWatch(function(t) {
    d+=0|(t.time-t.lastTime>0.00005);
  }, pin, {edge:'falling',repeat:true} );
  // raise pulse after 1ms
  setTimeout(function() {pinMode(pin,'input_pullup');pinMode(pin);},20);
  // stop looking after 50ms
  setTimeout(function() {
    if(ht.watch){ ht.watch = clearWatch(ht.watch); }
    var cks =
        parseInt(d.substr(2,8),2)+
        parseInt(d.substr(10,8),2)+
        parseInt(d.substr(18,8),2)+
        parseInt(d.substr(26,8),2);
    if (cks&&((cks&0xFF)==parseInt(d.substr(34,8),2))) {
      cb({
        raw : d,
        rh : parseInt(d.substr(2,8),2),
        temp : parseInt(d.substr(18,8),2)
      });
    } else {
      //if (n>1) setTimeout(function() {ht.read(cb,--n);},500);
      if (n>1) setTimeout(function() {DHT11read(pin, cb,--n);},500);
      else cb({err:true, checksumError:cks>0, raw:d, temp:-1, rh:-1});
    }
  }, 50);
}