(function() {

  var GoodEggsAPI = {};

  var Cache = {
    'nola': [],
    'la': [],
    'nyc': [],
    'sfbay': []
  };

  function printDate(day) {

    var formatted = day.getFullYear() + '-';

    if ((day.getMonth() + 1) > 9) {
      formatted += (day.getMonth() + 1);
    } else {
      formatted += '0' + (day.getMonth() + 1);
    }

    if (day.getDate() > 9) {
      formatted += '-' + day.getDate();
    } else {
      formatted += '-0' + day.getDate();
    }

    return formatted;

  }

  var timezones = {
    'America/Los_Angeles': 'PT',
    'America/Chicago': 'CT',
    'America/New_York': 'ET'
  }

  function Location(data) {

    this.name = data.location.name;

    this.address1 = data.location.address;
    this.address2 = data.location.vagueAddress;
    this.city = data.location.city;
    this.state = data.location.state;
    this.zip = data.location.zip;
    this.zone = data.location.zone;

    this.foodshed = data.location.foodshed;
    this.latitude = data.location.lat;
    this.longitude = data.location.lon;

    this.pickupStart = new Date(data.pickupWindow.startAt);
    this.pickupEnd = new Date(data.pickupWindow.endAt);

    this.cutoffDate = data.processCutoffOffset;
    this.timezone = data.tzid;

    this.timezoneAbbr = timezones[data.tzid];

  }

  GoodEggsAPI.getLocations = function(region) {

    var deferred = jQuery.Deferred();

    if (['sfbay', 'nyc', 'la', 'nola'].indexOf(region) === -1) {
      region = 'sfbay';
    }

    var url = 'http://www.goodeggs.com/' + region + '/market_pickups';

    var today = new Date();
    var later = new Date();

    later.setDate(today.getDate() + 6);

    function success(data) {
      var results = [], location;
      for (var i = 0; i < data.length; i++) {
        if (!data[i].delivery && data[i].requiredUserFeature === undefined) {
          location = new Location(data[i]);
          if (location.pickupStart < later) {
            results.push(location);
          }
        }
      }
      Cache[region] = results;
      deferred.resolve(results);
    }

    if (Cache.hasOwnProperty(region) && Cache[region].length > 0) {
      deferred.resolve(Cache[region]);
      return deferred;
    }

    $.ajax({
      type: 'GET',
      url: url,
      dataType: 'jsonp',
      data: {
        startAt: printDate(today),
        endAt: printDate(later)
      },
      jsonpCallback: 'myCallback',
      success: success,
      error: function() {
        deferred.reject();
      }
    });

    return deferred;

  };

  window.GoodEggsAPI = GoodEggsAPI;

}());