(function() {

  /**
   * @method calculateDistance
   */
  function calculateDistance(lat1, lng1, lat2, lng2) {

    var RADIUS = 3959;

    function toRad(val) {
      return val * Math.PI / 180;
    }

    var latDelta = toRad(lat2 - lat1);
    var longDelta = toRad(lng2 - lng1);

    var lat1Rad = toRad(lat1);
    var lat2Rad = toRad(lat2);

    var a = Math.sin(latDelta/2) * Math.sin(latDelta/2) +
      Math.sin(longDelta/2) * Math.sin(longDelta/2) * Math.cos(lat1Rad) * Math.cos(lat2Rad);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return Math.round(100*Math.abs(RADIUS * c))/100;

  }

  /**
   * method @formatDate
   * @param day
   * @returns {string}
   */
  function formatDate(day) {

    day = new Date(day);

    var ampm = 'am';

    var weekday = [];
    weekday[0] = "Sunday";
    weekday[1] = "Monday";
    weekday[2] = "Tuesday";
    weekday[3] = "Wednesday";
    weekday[4] = "Thursday";
    weekday[5] = "Friday";
    weekday[6] = "Saturday";

    var hours = day.getHours();
    if (hours > 12) {
      hours = hours - 12;
      ampm = 'pm';
    }

    var minutes = day.getMinutes();
    if (minutes < 10) {
      minutes = '0' + minutes;
    }

    return weekday[day.getDay()] + ', ' + (day.getMonth() + 1) + '/' + day.getDate() + ' at ' + hours + ':' + minutes + ampm;

  }

  function formatTime(day) {

    day = new Date(day);

    var ampm = 'am';

    var hours = day.getHours();
    if (hours > 12) {
      hours = hours - 12;
      ampm = 'pm';
    }

    var minutes = day.getMinutes();
    if (minutes < 10) {
      minutes = '0' + minutes;
    }

    return hours + ':' + minutes + ampm;


  }

  /**
   * @class LookupForm
   * @emits select
   * @constructor
   */
  function LocationMenu(target, location) {

    // store target DOM reference
    this.target = $(target);
    this.location = location;

    this.target.find('[data-id="' + location + '"]').addClass('selected');

    this.target.find('.navigation').on('click', 'li', $.proxy(this.onClick, this));
    this.target.find('.navigation').on('click', function(e) {
      e.stopPropagation();
    });

  }

  /**
   * @method show
   */
  LocationMenu.prototype.show = function() {
    this.target.removeClass('inactive');
  };

  /**
   * @method hide
   */
  LocationMenu.prototype.hide = function() {
    this.target.addClass('inactive');
  };

  /**
   * @method onClick
   * @param e
   */
  LocationMenu.prototype.onClick = function(e) {

    e.stopPropagation();

    this.target.find('li').removeClass('selected');
    $(e.currentTarget).addClass('selected');

    this.location = $(e.currentTarget).attr('data-id');

    this.fire('select', $(e.currentTarget).text());

    this.hide();

    window.location.hash = '#' + this.location;

  };


  /**
   * @class LookupForm
   * @emits back, map
   * @constructor
   */
  function LookupForm(target, location) {

    // store target DOM reference
    this.target = $(target);
    this.location = 'sfbay';
    this.visible = false;

    switch(location) {
      case 'sfbay':
        this.target.find('.location-field').text('San Francisco');
        break;
      case 'nyc':
        this.target.find('.location-field').text('New York City');
        break;
      case 'la':
        this.target.find('.location-field').text('Los Angeles');
        break;
      case 'nola':
        this.target.find('.location-field').text('New Orleans');
    }

  }

  /**
   * @method setLocation
   * @param location
   */
  LookupForm.prototype.setLocation = function(location) {
    this.location = location;
    this.show();
  };

  /**
   * @method setLocation
   * @param location
   */
  LookupForm.prototype.setLocationName = function(location) {
    this.target.find('.location-field').text(location);
  };

  /**
   * @method show
   */
  LookupForm.prototype.show = function() {
    if (this.visible) {
      return;
    } else {
      this.visible = true;
    }
    this.target.removeClass('hidden').removeClass('inactive');
    this.target.find('.time-chooser').on('click', 'li', $.proxy(this.onSelect, this));
    this.target.find('#lookup-btn').on('click', $.proxy(this.onLookup, this));
    this.target.find('.location-field').on('click', $.proxy(this.onLocation, this))
  };

  /**
   * @method hide
   */
  LookupForm.prototype.hide = function() {
    this.visible = false;
    this.target.addClass('hidden');
    this.target.find('.time-chooser').off();
    this.target.find('#lookup-btn').off();
  };

  LookupForm.prototype.onLocation = function(e) {
    e.stopPropagation();
    this.fire('location');
  };

  /**
   * @method showError
   */
  LookupForm.prototype.showError = function() {

    var that = this;

    this.target.find('.error-message').removeClass('hidden');

    setTimeout(function() {
      that.target.find('.error-message').addClass('hidden');
    }, 1000);

  };

  /**
   * @method onSelect
   * @param e
   */
  LookupForm.prototype.onSelect = function(e) {

    e.stopPropagation();

    var target = $(e.currentTarget);

    if (target.hasClass('selected')) {
      target.removeClass('selected');
    } else {
      target.addClass('selected');
    }

  };

  /**
   * @method onLookup
   * @param e
   */
  LookupForm.prototype.onLookup = function(e) {

    e.stopPropagation();

    var times = [], that = this;

    var zipcode = $('#zipcode-field').val();

    this.target.find('.time-chooser-item.selected').each(function() {
      times.push({
        min: parseInt($(this).attr('data-min'), 10),
        max: parseInt($(this).attr('data-max'), 10)
      });
    });

    if (!this.validate(zipcode, times)) {
      return;
    };

    var query = {
      times: times
    };

    this.target.addClass('inactive');

    var geocoder = new google.maps.Geocoder();

    geocoder.geocode({ 'address': zipcode }, function(results, status) {

      if (status == google.maps.GeocoderStatus.OK) {
        var lat = results[0].geometry.location.lat();
        var lng = results[0].geometry.location.lng();
        query.latitude = lat;
        query.longitude = lng;
        that.fire('lookup', that.location, query);
      } else {
        that.showError();
      }
    });

  };

  LookupForm.prototype.validate = function(zipcode, times) {

    var valid = true;

    if (!zipcode || zipcode.length !== 5 || !/^\d+$/.test(zipcode)) {
      this.target.find('.zipcode-error').removeClass('hidden');
      valid = false;
    } else {
      this.target.find('.zipcode-error').addClass('hidden');
    }

    if (times.length === 0) {
      this.target.find('.times-error').removeClass('hidden');
      valid = false;
    } else {
      this.target.find('.times-error').addClass('hidden');
    }

    return valid;

  };

  LookupForm.prototype.markActive = function() {
    this.target.removeClass('active');
  };

  /**
   * @class LookupList
   * @constructor
   */
  function LookupList(target) {

    // store target DOM reference
    this.target = $(target);

  }

  /**
   * @method show
   */
  LookupList.prototype.show = function() {
    this.target.removeClass('hidden');
    this.target.find('.back-btn').on('click', $.proxy(this.onBack, this));
    this.target.find('.map-btn').on('click', $.proxy(this.onMap, this));
  };

  /**
   * @method hide
   */
  LookupList.prototype.hide = function() {
    this.target.addClass('hidden');
    this.target.find('.back-btn').off();
    this.target.find('.map-btn').off();
  };

  /**
   * @method searchPickups
   * @param query
   * @returns {Orange.Deferred}
   */
  LookupList.prototype.searchPickups = function(location, query) {

    var deferred = new Orange.Deferred();

    GoodEggsAPI.getLocations(location).then(function(locations) {
      _.each(locations, function(location) {
        location.distance = calculateDistance(location.latitude, location.longitude, query.latitude, query.longitude);
      });
      locations = _.sortBy(locations, 'distance');
      deferred.resolve(locations);
    }, function() {
      deferred.reject();
    });

    deferred.done(function(locations) {
      this.show();
      this.renderLocations(locations, query);
    }, this);

    return deferred;

  };

  /**
   * @method renderLocations
   * @param locations
   * @param query
   */
  LookupList.prototype.renderLocations = function(locations, query) {

    var list = this.target.find('.location-list'), item;

    locations = _.filter(locations, function(location) {
      return location.distance < 20; // 20 mile radius
    });

    locations = _.filter(locations, function(location) {

      var match = false;

      var start = location.pickupStart.getHours();
      var end = location.pickupEnd.getHours();

      _.each(query.times, function(time) {

        if (start <= time.min && end > time.min) {
          match = true;
        } else if (start >= time.min && start < time.max) {
          match = true;
        }

      });

      return match;

    });

    list.empty();

    if (locations.length === 0) {
      list.append('<li class="no-results">Sorry, no pickups by you. Try our delivery instead.</li>')
    }

    for (var i = 0; i < locations.length; i++) {
      item = $('<li class="location-list-item">' +
        '<div class="name">' + locations[i].name + '</div>' +
        '<div class="address">' + (locations[i].address2 || locations[i].address1) + '</div>' +
        '<div class="distance">' + locations[i].distance + ' mi away</div>' +
        '<div class="pickup-time">' + formatDate(locations[i].pickupStart) + ' ' + locations[i].timezoneAbbr+ ' to ' + formatTime(locations[i].pickupEnd) + ' ' + locations[i].timezoneAbbr + '</div>' +
        '</li>');
      list.append(item);
    }

  };

  /**
   * @method showError
   */
  LookupList.prototype.showError = function() {

    var that = this;

    this.target.find('.error-message').removeClass('hidden');

    setTimeout(function() {
      that.target.find('.error-message').addClass('hidden');
    }, 1000);

  };

  /**
   * @method markActive
   */
  LookupList.prototype.markActive = function() {
    this.target.removeClass('inactive');
  };

  /**
   * @method markInactive
   */
  LookupList.prototype.markInactive = function() {
    this.target.addClass('inactive');
  };

  /**
   * @method onMap
   * @param e
   */
  LookupList.prototype.onMap = function(e) {
    e.stopPropagation();
    this.fire('map');
    this.markInactive();
  };

  /**
   * @method onBack
   * @param e
   */
  LookupList.prototype.onBack = function(e) {
    e.stopPropagation();
    this.hide();
    this.target.find('.location-list').empty();
    this.fire('back');
  };

  /**
   * @class LookupMap
   * @emits close
   * @constructor
   */
  function LookupMap(target) {

    // store target DOM reference
    this.target = $(target);
    this.visible = false;

  }

  /**
   * @method show
   */
  LookupMap.prototype.show = function() {
    this.target.removeClass('hidden');
    this.target.find('.close-btn').on('click', $.proxy(this.onClose, this));
  };

  /**
   * @method hide
   */
  LookupMap.prototype.hide = function() {
    this.target.addClass('hidden');
    this.target.find('.close-btn').off();
  };

  /**
   * @method populateMap
   * @param locations
   * @returns {Orange.Deferred}
   */
  LookupMap.prototype.populateMap = function(locations) {

    var deferred = new Orange.Deferred();

    setTimeout(function() {
      deferred.resolve(locations);
    }, 2000);

    deferred.done(function() {
      this.show();
    }, this);

    return deferred;

  };

  /**
   * @method onClose
   * @param e
   */
  LookupMap.prototype.onClose = function(e) {

    e.stopPropagation();

    this.hide();
    this.fire('close');

  };

  // mixin events utility
  Orange.Event.mixin(LocationMenu);
  Orange.Event.mixin(LookupForm);
  Orange.Event.mixin(LookupList);
  Orange.Event.mixin(LookupMap);

  /**
   * @class GoodEggsPickups
   * @constructor
   */
  function GoodEggsPickups(locationMenu, lookupForm, lookupList, lookupMap) {

    var region = window.location.hash;
    region = region.replace('#', '');

    this.locationMenu = new LocationMenu(locationMenu, region || 'sfbay');
    this.lookupForm = new LookupForm(lookupForm, region || 'sfbay');
    this.lookupList = new LookupList(lookupList);
    this.lookupMap = new LookupMap(lookupMap);

    this.render();

  }

  GoodEggsPickups.prototype.render = function() {

    var that = this;

    function onHashChange() {
      var region = window.location.hash;
      region = region.replace('#', '');
      that.lookupForm.setLocation(region);
      that.lookupList.hide();
      that.lookupMap.hide();
    }

    $(window).on('hashchange', onHashChange);

    $('body').on('click', $.proxy(function() {
      this.locationMenu.hide();
    }, this));

    this.locationMenu.on('select', function(e, location) {
      this.lookupForm.setLocationName(location);
    }, this);

    this.lookupForm.on('lookup', function(e, location, query) {
      this.lookupList.searchPickups(location, query).then(function() {
        this.lookupForm.hide();
        this.lookupForm.markActive();
      }, function() {
        this.lookupForm.showError();
        this.lookupForm.markActive();
      }, this);
    }, this);

    this.lookupForm.on('location', function() {
      this.locationMenu.show();
    }, this);

    this.lookupList.on('map', function(e, locations) {
      this.lookupMap.populateMap(locations).fail(function() {
        this.lookupList.showError();
        this.lookupList.markActive();
      }, this);
    }, this);

    this.lookupList.on('back', function() {
      this.lookupForm.show();
    }, this);

    this.lookupMap.on('close', function() {
      this.lookupList.markActive();
    }, this);

    onHashChange();

  };

  $(document).ready(function() {
    new GoodEggsPickups('#location-menu', '#lookup-form', '#lookup-list', '#lookup-map');
  });

}());