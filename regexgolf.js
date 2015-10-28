/*global ko, document, $, componentHandler*/


var MATCH_VALUE = 20,
    CHAR_VALUE  = 1;


function underlineSegment(whole, part, color) {
  var startIndex = whole.indexOf(part);

  color = color || 'green';
  return whole.slice(0, startIndex) +
    '<u class="mdl-color-text--' + color + '">' +
    whole.slice(startIndex, startIndex + part.length) +
    '</u>' +
    whole.slice(startIndex + part.length);
}


function MatchVM(strings, color) {
  var self = this,
      match = null;


  var updateMatches = function (regex) {
    var numMatches = 0;

    self.match().forEach(function (elem, i) {
      elem = self.match()[i];
      match = regex.exec(elem.original);

      if (match !== null) {
        numMatches += 1;
        self.match.replace(self.match()[i], {
          original: elem.original,
          display: underlineSegment(elem.original, match[0], color)
        });
      } else {
        self.match.replace(self.match()[i], {
          original: elem.original,
          display: elem.original
        });
      }
    });

    return numMatches;
  };


  self.addLine = function (stuff) {
    self.match.push({ display: stuff });
  };


  self.check = function (regex) {
    if (!(regex instanceof RegExp)) {
      regex = RegExp(regex);
    }
    self.score = MATCH_VALUE * updateMatches(regex);
    return self.score;
  };


  self.match = ko.observableArray(
    strings.map(function (value) {
      return {
        original: value,
        display: value
      };
    })
  );


  self.score = 0;
}


function ChallengeVM(setupInfo) {
  var self = this;

  self.inputValue = '';

  self.input = ko.computed({
    read: function () {
      return self.inputValue;
    },
    write: function (value) {
      self.inputValue = value;
      console.log(value);
      self.execRegex(value);
    },
    owner: self
  });


  self.execRegex = function (regex) {
    try {
      self.score(
        self.matchVM.check(regex) -
        self.unmatchVM.check(regex) -
        (CHAR_VALUE * regex.length)
      );
      /*
      self.score = self.matchVM.check(regex) -
        self.unmatchVM.check(regex) -
        regex.length;
       */
      self.invalidRegex = false;
    } catch (e) {
      self.invalidRegex = true;
    }
    return true;
  };


  self.title = setupInfo.title;
  self.score = ko.observable(0);
  self.invalidRegex = false;
  self.matchVM = new MatchVM(setupInfo.match, 'green');
  self.unmatchVM = new MatchVM(setupInfo.unmatch, 'red');
}


function AppState() {
  var challenges = [],
      self = this,
      navNode = document.body;


  self.loadChallenges = function () {
    $.getJSON('regexgolf-data.json', function (data, status) {
      self.challenges = [];
      ko.cleanNode(navNode);
      data.forEach(function (challenge) {
        self.challenges.push(new ChallengeVM(challenge));
      });
      self.currentChallenge(self.challenges[0]);
      ko.applyBindings(self, navNode);
    });
  };


  self.goToChallenge = function (challenge) {
    console.log(challenge);
    if (typeof challenge === 'number') {
      challenge = self.challenges[challenge];
    }
    self.currentChallenge(challenge);
    componentHandler.upgradeDom();
  };



  self.challenges = challenges;
  self.currentChallenge = ko.observable(new ChallengeVM({ match: [], unmatch: [] }));
  self.regexInput = ko.computed({
    read: function () {
      return self.currentChallenge().input();
    },
    write: function (value) {
      self.currentChallenge().input(value);
    },
    owner: self
  });
}

var state = new AppState();

state.loadChallenges();
