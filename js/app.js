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


  QUESTION_ACTIVE_TIME_MS: 30000,

  // local sequence number
  questionSeqNumber: 1,

  questions: {},
  historyEmpty: true,
  votersNewsStreamEmpty: true,
  questionActive: false,

  /*
   * Initialize the application
   *
   */
  init: function() {
    var self = this;

    // attach vote event to radio buttons
    $('#voting-buttons input[type=radio]').change(function() {
        // disable voting radio buttons
        $('#voting-buttons input[type=radio]').attr('disabled', true);

        // get questionKey
        var questionKey = $('#active-question').attr('key');
        // get reference to votes of question object
        var votesRef = self.questions[questionKey].votes;
        // push vote
        votesRef.push($('#voting-buttons input:radio:checked').val());

        // update Display
        self.processQuestion(questionKey, self.questions[questionKey]);
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

  // function to persist a question to the persistence store (in this example a local data structure)
  // call callback function once finished
  persistQuestion: function(question, callback) {

    // get question sequence number and once obtained persist question and update display
    question.questionNumber = this.questionSeqNumber++;
    this.questions[question.questionNumber] = question;
    callback(question.questionNumber, question);
  },

  // function to lookup question object by key
  // call callback function with object if found
  fetchQuestion: function(questionKey, callback) {
    // fetch question from Firebase
    if (typeof questionKey !== 'undefined') {
        callback(questionKey, this.questions[questionKey]);
    }
  },

  // check if user is authenticated
  checkIfAuthorized: function() {
    return true;
  },

  /*
   * HINT: no changes required below here for Firebase integration!
   *
   */

  // read values from form and add question to data structure
  // trigger update of display
  submitNewQuestion: function() {
    // if question text is empty, show error msg and exit
    if ($('#question').val() == '') {
        $('#question-submit-error').show();
        return;
    }

    $('#question-submit-error').hide();

    // create question object
    question = {
        questionNumber: -1,
        question: $('<div/>').text($('#question').val()).html(),
        activationTime: $.now(),
        votes: []
    };

    // clear input
    $('#question').val('');

    // persist question
    var self = this;
    this.persistQuestion(question, function(questionKey, question) {
      // update display
      self.processQuestion(questionKey, question);
    });
  },

  // update display, move expired questions to #tbt history
  processQuestion: function(questionKey, question) {

      question = helper.transformQuestionVotesToArray(question);

      // check if question is onAir (not yet expired)
      var questionVotingTimeLeft = (this.QUESTION_ACTIVE_TIME_MS -
          ($.now() - question.activationTime)) / 1000;

      if (Math.round(questionVotingTimeLeft) > 0) {
        this.questionActive = true;
        // is the question already displayed? then only update the stats
        var liveQuestionKey = $('#active-question').attr('key');
        if (typeof liveQuestionKey == 'undefined' || liveQuestionKey != questionKey) {
          $('#active-question').text("#" + question.questionNumber + " - " + $('<div/>').html(question.question).text());
          $('#active-question').attr('key', questionKey);
          $('#time-left').show();
          this.resetVotingRadioButtons();
        }
        // update stats
        // calculate average rating and update Stats
        $('#question-avg').text(helper.getAverageOfNumberArray(question.votes));
        $('#question-vote-count').text(question.votes.length);
      } else {
        this.addToQuestionHistory(question);
      }
  },

  // disable / enable admin panel based on auth and if question is currently active
  toggleEnabledQuestionAdminPanel: function(callback) {
    // check if user is allowed to see the admin panel

    if (callback()) {
        $('#question-admin-panel').show();
    } else {
        $('#question-admin-panel').hide();
    }

    // if any question is active -> disable question input and submission
    $('#question-submit-form :input').prop('disabled', this.questionActive);
  },

  // reset the voting radio buttons
  resetVotingRadioButtons: function() {
    // reset radio buttons by clearing prior voting and enable buttons + show info + buttons
    $('#voting-buttons input[type=radio]').attr('checked', false).attr('disabled', false);
    $('#voting-buttons-info').show();
    $('#voting-buttons').show();
  },

  // add expired question to #tbt history
  addToQuestionHistory: function(question) {
    // remove empty history element
    if (this.historyEmpty) {
      $('#tbt-question-history li:last').remove();
      this.historyEmpty = false;
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

  // add voter activity to Voters News Stream - unused in single user scenario
  addToVotersNewsStream: function(voter, action) {
    // remove placeholder entry
    if (this.votersNewsStreamEmpty) {
      $('#voters-feed li:last').remove();
      this.votersNewsStreamEmpty = false;
    }

    $('#voters-feed').prepend('<li><div class="btn-block btn-sm btn-social btn-' + voter.provider + '">' +
      '<i class="fa fa-' + voter.provider + '"></i>' + voter.displayName + ' is now ' + action + '</div></li>');

    // only show the last 20 activities
    if ($('#voters-feed li').length > 20) {
      $('#voters-feed li:last').remove();
    }
  },

  // function to update timer
  refreshDisplay: function() {
    if (this.questionActive) {
      //get the current question in the question-menu-panel
      var liveQuestionKey = $('#active-question').attr('key');
      var self = this;
      this.fetchQuestion(liveQuestionKey, function(key, question) {
        if (typeof question !== 'undefined') {
          var questionVotingTimeLeft = (self.QUESTION_ACTIVE_TIME_MS -
            ($.now() - question.activationTime)) / 1000;
          if (Math.round(questionVotingTimeLeft) <= 0) {
              $('#time-left').text("Voting for this question has closed!");
              $('#voting-buttons input[type=radio]').attr("disabled", true);
              self.processQuestion(liveQuestionKey, question);
              self.questionActive = false;
          } else {
              // Update remaining time to vote
              $('#time-left').text("Time left to vote: " + Math.round(questionVotingTimeLeft) + " sec");
          }

          // show/hide | disable/hide question admin panel
          self.toggleEnabledQuestionAdminPanel(self.checkIfAuthorized);
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
  setInterval(function(){app.refreshDisplay();}, 500);
});