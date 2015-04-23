# 2015 Berlin Speedhack - Firebase Code Challenge

This repository hosts the scaffold webapp for the Firebase code
challenge at the 2015 Berlin Speedhack as part of the APIDays conference.


## Get your Toolbox and Workbench ready!
 - Prepare your development environment with the following software:
  - Git
  - Node.js (+NPM installed)
  - Editor of your choice
  - Install Gulp and Firebase Tools ```sudo npm install -g gulp firebase-tools```

 - Fork the repository and after cloning ```git clone <repo-url> && cd <repo-name>``` run ```npm install```to download all required node packages
 - To start the development server run ```gulp```. It'll start a server on [localhost:8000](http://localhost:8000/).

 - You need the following accounts:
  - Free [GitHub Account](https://github.com/join)
  - Free [Firebase Account](https://www.firebase.com/account/) - Hacker Plan is sufficient for development

## Base Camp - Where does everyone start from?
The application currently works single user only. It's built using Twitter Bootstrap and JQuery.
You see 5 panel boxes:
 - *Questions on the menu today ;)* - Shows current active question or placeholder if no question is active
 - *No question active? Fire your question! :)* - Lets you submit a question that instantly becomes active. Hurry to vote :)
 - *How to participate* - Gives instructions on how to participate. This content is currently inactive since only a single user is supported.
 - *#TBT - Nostalgia* - Shows the history of previously submitted and voted questions
 - *Voters News Flash* - is a placeholder for multi-user activity updates - inactive in the single-user scenario

## The Challenge - Can you solve it?
Use [Firebase APIs](https://www.firebase.com/how-it-works.html) to finish the following steps:
 1. Replace the local data structure ```question: {}``` and store questions and votes in Firebase. Enable real-time synchronization and updates between all clients.
 2. Integrate an [authentication provider](https://www.firebase.com/docs/web/guide/user-auth.html#section-providers) of your choice (or all if you like and can spare the time)and show who came online, went inactive or offline in the *Voters News Flash*. Show the question submit panel only to authenticated users.
 3. Configure [security & permissions](https://www.firebase.com/docs/web/guide/understanding-security.html#section-authorization) to secure your Firebase and only authenticated users can write data.

To get started checkout the [Firebase Guide](https://www.firebase.com/docs/web/guide/).

Optional: Unlock bonus points by ensuring that data privacy and anonymity concerns are met. How do you solve that a voting can't be backtracked to its voter still enforcing that everyone can only vote once for each question.

### Disclaimer: This is not an official Google product!