var alphabet = "abcdefghijklmnopqrstuvwxyz";
var usedLetters = [];
var wrongLetters = [];
var lettersGuessed = 0;
// whatever
var possibleWords = 
["watermelon", "shopping cart", "nuclear missile", "Led Zeppelin", "contour map"];
var secretWord = "";
// letterbox object (...class? is there such a thing?)
function letterBox (value, htmlElement) {
    this.value = value;
    this.guessed = false;
    this.htmlElement = htmlElement;
};
letterBox.prototype.markOff = function() {
    // guessed this one
    this.htmlElement.text(this.value);
    // lose the border
    this.htmlElement.addClass(" borderless");
    lettersGuessed += 1;
};

// letter objects, hold letters to be guessed
var letters = [];

function wordContainer() {
    var container = $('<div class=wordContainer></div>');
    return container;
}

$(document).ready(newGame);


function newGame () {
    // clear game parameters
    letters = [];
    usedLetters = [];
    wrongLetters = [];
    lettersGuessed = 0;
    $("#discards").text("");
    $("#hangman").attr("src", "images/hangman0.png");
    activateKeyPresses();
    
    // choose a random word
    secretWord = possibleWords[Math.floor(Math.random() * possibleWords.length)];
    // remove all previous boxes
    $(".wordContainer").remove();
    // make a container for each word (so they can go on separate lines if need be)
    var container = $('<div class="wordContainer"></div>');
    // make new boxes for letters

    for (i = 0; i < secretWord.length; i++) {
        // create the letterbox element
        var letterDiv = $('<div class="letterBox">?</div>');
        // create entry for letters object array
        letters.push (new letterBox(secretWord[i], letterDiv));

        // if it's not a space, append to word container
        if (letters[i].value != " "){
            container.append(letterDiv);
        }
        // if it is a space, start a new word container
        else {
            // won't have to guess this "letter"
            letters[i].markOff();
            // add word container to word window, and start a new container
            $("#wordWindow").append(container);
            // new container
            container = $('<div class="wordContainer"></div>');
        }
    }
    // add final container to word window
    $("#wordWindow").append(container);
}

function activateKeyPresses(){
    // return keypress control to the document
    // it will have been disabled while a dialog box is open
    document.onkeyup = keyPress;
}

function deactivateKeyPresses(){
    document.onkeyup = null;
}

function keyPress(event) {
    var guess = event.key.toLowerCase();
    if (alphabet.indexOf(guess) >= 0) {
        // it's a letter, but has it been used already?
        if (usedLetters.indexOf(guess) >= 0) {
            // can't guess the same letter twice
            // ignore
        }
        else {
            // remember this letter has been used
            usedLetters.push(guess);
            // now, is this part of the secret word??
            var location = secretWord.toLowerCase().indexOf(guess);
            if (location >= 0) {
                // yes
                // check off all matching letters
                while (location >= 0) {
                    letters[location].markOff();
                    location = secretWord.toLowerCase().indexOf(guess, location + 1);
                }
                // did we win??
                if (lettersGuessed == letters.length) {
                    setTimeout(function (){
                        alert ("You win!! Starting over.");
                        newGame();
                    }, 500);
                    return;
                }
            }
            else {
                // nope
                wrongLetters.push(guess.toUpperCase());
                $("#discards").text(wrongLetters.join(", "));
                // update the image
                $("#hangman").attr("src", "images/hangman" + wrongLetters.length + ".png");
                // did we lose??
                if (wrongLetters.length == 6){
                    // yes, but...
                    console.log("you lost");
                    openDialog ("You lose!", "loser", 
                        dialogButtons([{
                            text: "Fine.",
                            function: newGame
                        },
                        {
                            text: "No, wait! He needs a face!",
                            function: null
                        }])
                    );
                }
                if (wrongLetters.length == 7){
                    // come on, one more try!
                    console.log("you lost again");
                    openDialog ("That's it! It's over!", "superloser", 
                        dialogButtons([{
                            text: "That's fair.",
                            function: newGame
                        }, {
                            text: "But... What about his hat?",
                            function: null
                        }])
                    );
                }
                if (wrongLetters.length == 8){
                    // that's it. no more second chances
                    openDialog ("Just let it go.  It's over.", "so sorry",
                        dialogButtons([{
                            text: "Ok, ok.",
                            function: newGame
                        }, {
                            text: "nooooooo",
                            function: function(){
                                openDialog ("Starting over now.", "get over it", 
                                dialogButtons([{text: "noooooo", function: newGame}]));
                            }
                        }])
                    );
                }
            }
        }
    }
    else {
        // not a letter (punctuation mark or smth)
        // ignore
    }
}

// dialog box with arbitrary number of buttons and custom function for each
var msgDiv;
function openDialog(message, title, buttons) {
    // make sure dialogButtons is of the dialogButtons class/type

    // no keypress events while dialog is open
    // all buttons will have been set to reactivate keypresses
    deactivateKeyPresses();

    buttons[0].text = (buttons[0].text == undefined) ? "Ok" : buttons[0].text;
    title = (title == undefined) ? "The page says:" : title;

    msgDiv = $('<div class="dialogBox">');
    msgDiv.html(message);
    msgDiv.attr('title', title);
    msgDiv.dialog({
        autoOpen: true,
        modal: true,
        draggable: true,
        resizable: true,
        buttons: buttons
    });
}

// make a list of button objects which can be passed to openDialog function
// adding $(this).dialog("close") msgDiv.remove(), and activateKeyPresses()
// which should happen no matter what else

function dialogButtons (buttons){
    // function expects an array of button objects:
    // [{text: "", function: function()}, ...]
    return buttons.map (function(button) {
        // for each button, return a new button which is the same,
        // except its function has been wrapped in another function
        // which includes these three required actions
        return {
            text: button.text,
            click: function() {
                // close dialog box and remove div
                $(this).dialog("close");
                msgDiv.remove();
                // user-defined custom function
                if (button.function != null) button.function();
                // return keypress control to document
                activateKeyPresses();
            }
        };
    });
}


