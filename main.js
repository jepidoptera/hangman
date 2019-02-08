/*jshint esversion: 6 */

var alphabet = "abcdefghijklmnopqrstuvwxyz";
var usedLetters = [];
var wrongLetters = [];
var lettersGuessed = 0;
// for playing on mobile, a button for each letter of the alphabet
var letterButtons = [];

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

// "extension method" for randomizing the order of an array
Object.defineProperty(Array.prototype, "randomizeOrder", {
    value: function ()
    {
        for (i = 0; i < this.length; i++){
            var placeholder = this[i];
            var randomPos = Math.floor(Math.random() * this.length);
            this[i] = this[randomPos];
            this[randomPos] = placeholder;
        }
        return this;
    },
    writable: true,
    configurable: true
});

function getCategoryList (category) {
    if (category == "fruits and vegetables"){
        return ["watermelon", "pineapple", "grapefruit", "zucchini", "pumpkin",
        "bell pepper", "brussels sprout"];
    } 
    else if (category == "mass-produced objects"){
        return ["shopping cart", "happy meal toys", "ikea furniture", "cell phone",
        "shoes", "microwave", "ball point pen"];
    } 
    else if (category == "wmds"){
        return ["nuclear missile", "death star", "predator drone", "zombie plague",
        "ice nine", "doomsday machine", "mustard gas"];
    } 
    else if (category == "rock bands"){
        return ["Led Zeppelin", "Smashing Pumpkins", "Red Hot Chili Peppers", "Black Sabbath",
        "Nirvana", "White Stripes", "Aerosmith"];
    } 
    else if (category == "surveying tools"){
        return ["contour map", "theodolite", "compass", "transit", "level", 
        "octant", "rangefinder"];
    }
    else alert('bad category');
    return [];
}

// start the game when the document is ready
$(document).ready(newGame);

// this has to be called after page load (makes sense)
function setEvents(){
    $("#categories").on ("change", function(){
        category = this.value;
        possibleWords = getCategoryList(category).randomizeOrder();
        // get the focus off the dropdown, or it will keep changing on you
        $("#hangman").focus();
        newGame();
    });
}

// letter objects, hold letters to be guessed
var letters = [];

// category select (start with fruit)
var category = "fruits and vegetables";
var possibleWords = getCategoryList(category).randomizeOrder();

// the word or phrase to guess!
var secretWord = "";
function newGame () {
    // clear game parameters
    letters = [];
    usedLetters = [];
    wrongLetters = [];
    lettersGuessed = 0;
    $("#discards").text("");
    $("#hangman").attr("src", "images/hangman0.png");
    activateKeyPresses();
    setEvents();
    
    // take the last element off the list
    // since the list has already been randomized, this means that you won't see the same word twice
    //  until all options have been exhausted (or you switch categories and back again)
    if (possibleWords.length > 0) {
        secretWord = possibleWords.pop();
    }
    else {
        // re-get the list (start over, new random order)
        possibleWords = getCategoryList(category).randomizeOrder();
    }
    // remove all previous boxes
    $(".wordContainer").remove();
    // make a container for each word (so they can go on separate lines if need be)
    var container = $('<div class="wordContainer"></div>');
    // make new boxes for letters

    for (i = 0; i < secretWord.length; i++) {
        // create the letterbox element
        var letterDiv = $('<div class="letterBox"> </div>');
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

function startOver(){
    // when you lose
    // show what the word was
    letters.forEach(element => {
        element.markOff();
    });
    // wait one second, then start over
    setTimeout(newGame, 3000);
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
    guessLetter(event.key.toLowerCase());
}

function guessLetter (guess){
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
                    // give just half a second to appreciate the beauty of this success
                    setTimeout(function (){
                        openDialog ("You win!! Starting over.", "yay",
                            dialogButtons([{
                                text: "ok", function: newGame
                            }])
                        );
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
                            function: startOver
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
                            function: startOver
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
                            function: startOver
                        }, {
                            text: "nooooooo",
                            function: function(){
                                openDialog ("Starting over now.", "get over it", 
                                dialogButtons([{text: "noooooo", function: startOver}]));
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

function generateLetterButtons(){
    var xCorner = 0;
    for (i = 0; i < alphabet.length; i++) {
        var letterButton = $('<div class="letterBox letterButton">');
        letterbutton.text(alphabet[i]);
        var xBox = $('<div class="letterBox X">');
        xBox.text("X");
        xBox.attr("display", "none");
        letterButton.append(xBox);
        $("document").append(letterbutton);
    }
}
