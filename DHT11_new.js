/* 
	Copyright (c) 2019 Tedd Hansen. See the file LICENSE for copying permission. 
	Based on work by Spence Konde.
*/

/*
	Reads DHT11 (and DHT22) temperature and relative humidity.
	DHT11 spec used: https://www.electronicwings.com/sensors-modules/dht11
*/

function DHT11(pin) {
	this.pin = pin;
	this.d = "";
	var self = this;
  
	// Read change on input pin and store in buffer
	this.watch = setWatch(function(t) {
		if (self.d.length <= 42) // Make sure we don't keep going in case of failure (i.e. incorrect pin, so some other device is spamming us with signals)
			self.d += 0 | (t.time - t.lastTime > 0.00005);
	}, self.pin, { edge: 'falling', repeat: true } );
}

/** Export so it works with `require('DHT11.js').connect(pin)` */
exports.connect = function (pin) {
	return new DHT11(pin);
};

DHT11.prototype.read = function (cb) {
	var self = this;
	// Clear input buffer so we get a fresh read
	self.d = "";
  
	// We need to send a 18ms+ start pulse (pull down / low) followed by a pull up
	// This tells device to start sending data
	digitalWrite(self.pin, 0);
	pinMode(self.pin, "output"); // force pin state to output
	// raise pulse after 18ms+
	setTimeout(function() { 
		pinMode(self.pin, 'input_pullup'); 
		pinMode(self.pin); 
	}, 20);

	// What follows now is device signaling us start of data
	// -	54us	low
	// -	80us	high
	
	// Then we receive 5 bytes (8 bits per byte) where they look like:
	// Zero:
	// -	54us	low
	// -	24us	high
	// One:
	// -	54us	low
	// -	70us	high
  
	// We are watching for changes, and if change is > 50us we assume it's a 1. This is how we build our buffer.
  
	// This also means that the whole transfer should be done within a minimum of 54+80+(54+70)*40=5096us which is 5.096ms
	// We also need to consder the 20 ms we spend sending
	// So in theory it is safe to read back after 25.096 ms. Lets say 30ms to allow for delays.
  
	setTimeout(function() {
		// Return data (assuming all is well)
		// Two first bytes are header. First is 0 on first, 1 on consecutive. Second is always 1.
		var h = self.d.substr(1,1);				 	// Header, always "1" - we'll include this in checksum test
		var rh = parseInt(self.d.substr(2,8),2);	// Relative humidity
		var rhf = parseInt(self.d.substr(10,8),2);  // Relative humidity fraction
		var t = parseInt(self.d.substr(18,8),2);	// Temperature
		var tf = parseInt(self.d.substr(26,8),2);   // Temperature fraction
		var csum = parseInt(self.d.substr(34,8),2); // Checksum
	
		// Calculate checksum
		var cks = rh + rhf + t + tf;
		
		// Check checksum:
		// - It is not zero (temp and humidity exactly zero?)
		// - Sum all data, compare last byte to checksum byte
		if (h == "1" && cks &&((cks&0xFF)==csum)) {
			// Success, return data
			cb({
				temp: t + "." + tf,
				th: rh + "." + rhf,
				// We usually don't need raw data here, uncomment if you do
				// raw: self.d
			});
			return;
		}

		// Checksum error
		cb({ err: true, raw: self.d, temp: -1, rh: -1 });
	}, 30);
};