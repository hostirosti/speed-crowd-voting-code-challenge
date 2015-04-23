/*
 * Copyright 2015, Google, Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


/*
 * Speed Crowd Voting Application Class
 *
 */
var app = {

  // a submitted question is active for 30 sec
  QUESTION_ACTIVE_TIME_MS: 30000,

  // local sequence number - only used for single user scenario
  questionSeqNumber: 1,

  // local persistence data structure - only used for single user scenario
  questions: {},

  historyEmpty: true,
  votersNewsStreamEmpty: true,
  questionActive: false,

  /*
   * Initialize the application
   * add event listeners here that you want to have available after page load
   */
  init: function() {
    var self = this;

    // attach vote event to radio buttons
    $('#voting-buttons input[type=radio]').change(function() {
      // disable voting radio buttons
      $('#voting-buttons input[type=radio]').attr('disabled', true);

      // get questionKey of the active question
      var questionKey = $('#active-question').attr('key');

      // get reference to votes of question object
      var votesRef = self.questions[questionKey].votes;

      // push vote directly to data persistence
      votesRef.push($('#voting-buttons input:radio:checked').val());

      // update display by fetching the question from persistence and call processQuestion on it
      self.fetchQuestion(self, questionKey, self.processQuestion);
    });

    // set QRCode image in how-to-participate box
    $('#join-url-qrcode').attr("src", "https://chart.googleapis.com/chart?cht=qr&chs=200x200&chl=" + window.location.href);

    // button submit event
    $('#question-submit').click(function() {
      self.submitNewQuestion()
    });

    // form submit event
    $('#question-submit-form').submit(function() {
      self.submitNewQuestion();
      // avoid default form submit behavior
      return false;
    });
  },

  // function to persist a question to the persistence store (in the scaffold app we use a local data structure)
  // It is called when a user submits a new question (submitNewQuestion() function)
  // calls callback function with questionKey and question object once finished
  persistQuestion: function(self, question, callback) {
    // get question sequence number (this should be a globally unique number)
    question.questionNumber = self.questionSeqNumber++;

    // for the scaffold app we use the questionNumber as the question key. For Firebase use the generated key.
    var questionKey = question.questionNumber;
    self.questions[questionKey] = question;

    callback(self, questionKey, question);
  },

  // function to lookup a question by questionkey
  // calls callback function with questionKey and question object if question was found
  fetchQuestion: function(self, questionKey, callback) {
    // fetch question from persistence store
    if (typeof questionKey !== 'undefined') {
      callback(self, questionKey, self.questions[questionKey]);
    }
  },

  // check if user is authenticated
  checkIfAuthorized: function() {
    return true;
  },

  /*
   * HINT: no changes required below here for Firebase integration!
   * You'll only need to use the following two functions (processQuestion and addToVotersNewsStream)
   * in your Firebase event listeners
   *
   * processQuestion updates the displayed question (active/history question, update votes)
   * addToVotersNewsStream adds an entry to the voters activity feed
   *  it expects the following object structure:
   *  voter = {
   *    provider: 'google|twitter|github',
   *    displayName: 'No Name',
   *    status: 'online|inactive'
   *  }
   */

  // displays question in active-question-panel if not expired otherwise adds it to #tbt history
  processQuestion: function(self, questionKey, question) {
    // needed because Firebase stores scalable arrays as object lists
    question = helper.transformQuestionVotesToArray(question);

    // check if question is on air (not yet expired)
    var questionVotingTimeLeft = (self.QUESTION_ACTIVE_TIME_MS -
      ($.now() - question.activationTime)) / 1000;

    if (Math.round(questionVotingTimeLeft) > 0) {
      self.questionActive = true;
      var liveQuestionKey = $('#active-question').attr('key');
      // is the question already displayed? then only update the stats
      if (typeof liveQuestionKey == 'undefined' || liveQuestionKey != questionKey) {
        $('#active-question').text("#" + question.questionNumber + " - " + $('<div/>').html(question.question).text());
        $('#active-question').attr('key', questionKey);
        $('#time-left').show();
        self.resetVotingRadioButtons();
      }

      // calculate average rating and update Stats
      $('#question-avg').text(helper.getAverageOfNumberArray(question.votes));
      $('#question-vote-count').text(question.votes.length);
    } else {
      self.addToQuestionHistory(self, question);
    }
  },

  // add voter activity to voters news stream - not used in single user scenario
  addToVotersNewsStream: function(self, voter, action) {
    // remove placeholder entry
    if (self.votersNewsStreamEmpty) {
      $('#voters-feed li:last').remove();
      self.votersNewsStreamEmpty = false;
    }

    $('#voters-feed').prepend('<li><div class="btn-block btn-sm btn-social btn-' + voter.provider + '">' +
      '<i class="fa fa-' + voter.provider + '"></i>' + voter.displayName + ' is now ' + action + '</div></li>');

    // only show the last 20 activities
    if ($('#voters-feed li').length > 20) {
      $('#voters-feed li:last').remove();
    }
  },

  // read values from form and add question to data structure
  // trigger update of display
  submitNewQuestion: function() {
    var self = this;
    // if question text is empty, show error msg and exit
    if ($('#question').val() == '') {
      $('#question-submit-error').show();
      return;
    }

    // hide error if question text is not empty
    $('#question-submit-error').hide();

    // construct question object
    question = {
      questionNumber: -1, // sequence number is set in the persistence function
      question: $('<div/>').text($('#question').val()).html(),
      activationTime: $.now(),
      votes: {}
    };

    // clear input
    $('#question').val('');

    // persist question
    this.persistQuestion(this, question, function(self, questionKey, question) {
      // callback to processQuestion to update the display
      self.processQuestion(self, questionKey, question);
    });
  },

  // disable / enable admin panel based on auth and if question is currently active
  // use callback function to determine if user is authenticated
  toggleEnabledQuestionAdminPanel: function(self, callback) {
    // check if user is allowed to see the admin panel

    if (callback()) {
      $('#question-admin-panel').show();
    } else {
      $('#question-admin-panel').hide();
    }

    // if any question is active -> disable question input and submission
    $('#question-submit-form :input').prop('disabled', self.questionActive);
  },

  // reset the voting radio buttons
  resetVotingRadioButtons: function() {
    // reset radio buttons by clearing prior voting and enable buttons + show info + buttons
    $('#voting-buttons input[type=radio]').attr('checked', false).attr('disabled', false);
    $('#voting-buttons-info').show();
    $('#voting-buttons').show();
  },

  // add expired question to #tbt history
  addToQuestionHistory: function(self, question) {
    // remove empty history element
    if (self.historyEmpty) {
      $('#tbt-question-history li:last').remove();
      self.historyEmpty = false;
    }

    $('#tbt-question-history').prepend(
      '<li><div class="question-container img-rounded panel panel-default"><div class="tbt-question">#' +
      question.questionNumber + " - " + question.question +
      '</div><div class="tbt-question-statistics">Average rating: ' +
      helper.getAverageOfNumberArray(question.votes) + " | " + "votes: " + question.votes.length +
      '</div><div></li>');

    // only show the last 20 questions, if new are coming in throw the old ones out
    if ($('#tbt-question-history li').length > 20) {
      $('#tbt-question-history li:last').remove();
    }
  },

  // refresh the timer display if question is active and move the question to the history once it's expired
  refreshDisplay: function() {
    if (this.questionActive) {
      //get the current question in the active-question-panel
      var liveQuestionKey = $('#active-question').attr('key');
      var self = this;
      this.fetchQuestion(this, liveQuestionKey, function(self, questionkey, question) {
        if (typeof question !== 'undefined') {
          var questionVotingTimeLeft = (self.QUESTION_ACTIVE_TIME_MS -
            ($.now() - question.activationTime)) / 1000;

          if (Math.round(questionVotingTimeLeft) <= 0) {
            $('#time-left').text("Voting for this question has closed!");
            $('#voting-buttons input[type=radio]').attr("disabled", true);
            self.processQuestion(self, questionkey, question);
            self.questionActive = false;
          } else {
            // Update remaining time to vote
            $('#time-left').text("Time left to vote: " + Math.round(questionVotingTimeLeft) + " sec");
          }

          // show/hide | enable/disable question admin panel
          self.toggleEnabledQuestionAdminPanel(self, self.checkIfAuthorized);
        }
      });
    }
  },
};


/*
 * Helper Class
 *
 *
 */
var helper = {
  getAverageOfNumberArray: function(array) {
    if (typeof array !== 'undefined') {
      return array.length > 0 ? (array.reduce(function(a, b) {
        return a + b;
      }) / array.length).toPrecision(2) : 0;
    }
    return 0;
  },

  transformQuestionVotesToArray: function(question) {
    // transform votes into array
    if (typeof question.votes == 'undefined') {
      question.votes = [];
    } else if (typeof question.votes == 'object') {
      var tempArray = [];
      for (var key in question.votes) {
        tempArray.push(parseInt(question.votes[key]));
      }
      question.votes = tempArray;
    }
    return question;
  }
};


/*
 * Initialize App
 *
 */
$(document).ready(function() {
  app.init();
  // set refresh interval used to update question timer display
  setInterval(function() {
    app.refreshDisplay();
  }, 500);
});