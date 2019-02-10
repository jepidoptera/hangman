/*jshint esversion: 6 */

var alphabet = "abcdefghijklmnopqrstuvwxyz";
var usedLetters = [];
var wrongLetters = [];
var lettersGuessed = 0;
// for playing on mobile, a button for each letter of the alphabet
var letterButtons = [];
var orientation = "";
var categories = [];

// letterbox object (...class? is there such a thing?)
function letterBox (value, htmlElement) {
    this.value = value;
    this.guessed = false;
    this.htmlElement = htmlElement;
}
letterBox.prototype.markOff = function() {
    // guessed this one
    this.htmlElement.text(this.value);
    // lose the border
    // actually, don't
    // this.htmlElement.addClass(" borderless");
    lettersGuessed += 1;
};

// letter objects, hold letters to be guessed
var letters = [];

// category select (start with fruit)
var category = "";
var possibleWords = [];

var maxGuesses = 6;
var firstLoss = true;

// the word or phrase to guess!
var secretWord = "";

////////////////////////////////////////////
// start the game when the document is ready
$(document).ready(initialize);

// this has to be called after page load (makes sense)
function initialize(){

    // set up events
    $("#categories").on ("change", function(){
        category = this.value;
        // possibleWords = getCategoryList(category).randomizeOrder();
        // get the focus off the dropdown, or it will keep changing on you
        $("#hangman").focus();
        newGame();
    });

    $( window ).on( "orientationchange", function( event ) {
        generateLetterButtons(event.orientation);
    });

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

    // category select (start with fruit)
    category = "fruits and vegetables";
    populateCategories();
    // possibleWords = getCategoryList(category).slice(0).randomizeOrder();

    // turn on keypress events
    activateKeyPresses();

    if ($(window).width() < $(window).height()){
        generateLetterButtons("portrait");
    }
    else {
        generateLetterButtons("normal");
    }

    newGame();

    firstLoss = true;
}

function newGame () {
    // clear game parameters
    letters = [];
    usedLetters = [];
    wrongLetters = [];
    lettersGuessed = 0;
    // clear discards list
    $("#discards").text("");
    // reset hangman image
    $("#hangman").attr("src", "images/hangman0.png");
    // reset - hide all the Xes
    $(".X").css({"display": "none"});
    // un-highlight all letter buttons
    $(".letterButton").removeClass("highlighted");
    
    // get the new secret word
    secretWord = getSecretWord(category);
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
            // give non-alphabetical characters for free
            if (alphabet.indexOf(letters[i].value) < 0) {
                letters[i].markOff();
                // don't underline apostrophes, commas and such
                letterDiv.addClass("borderless");
            }
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
    firstLoss = false;
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
    document.onkeydown = keyDown;
}

function deactivateKeyPresses(){
    document.onkeyup = null;
    document.onkeydown = null;
}

function keyDown(event) {
    // skip non-letter keys, avoid errors
    if (alphabet.indexOf(event.key.toLowerCase()) < 0) return;
    // highlight button on keydown
    letterButtons[alphabet.indexOf(event.key.toLowerCase())].addClass("highlighted");
}

function keyPress(event) {
    // skip non-letter keys, avoid errors
    if (alphabet.indexOf(event.key.toLowerCase()) < 0) return;
    // un-highlight on keyup
    letterButtons[alphabet.indexOf(event.key.toLowerCase())].removeClass("highlighted");
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
            // show the corresponding "X" over the button for this letter
            letterButtons[alphabet.indexOf(guess)].children(".X").css({"display": "block"});
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
                    }, 1000);
                    return;
                }
            }
            else {
                // nope
                wrongLetters.push(guess);
                $("#discards").text(wrongLetters.join(", "));
                // update the image
                $("#hangman").attr("src", "images/hangman" + wrongLetters.length + ".png");
                // did we lose??
                if (wrongLetters.length == 6 && firstLoss){
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
                else if (wrongLetters.length == 7 && firstLoss){
                    // come on, one more try!
                    maxGuesses = 7;
                    console.log("you lost again");
                    openDialog ("That's it! You lost for real!", "superloser", 
                        dialogButtons([{
                            text: "That's fair.",
                            function: startOver
                        }, {
                            text: "But... What about his hat?",
                            function: null
                        }])
                    );
                }
                else if (wrongLetters.length == 8 && firstLoss){
                    // that's it. no more second chances
                    maxGuesses = 8;
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
                else if (wrongLetters.length >= maxGuesses) {
                    // after the first game, maxguesses is set for good and stays where you left it
                    openDialog ("Game over.", "awwwww", 
                        dialogButtons([{text: "ok", function: startOver}])
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

    // use this for keypresses instead (navigate between buttons using arrow keys)
    document.onkeyup =
        function(e)
        {    
            if (e.keyCode == 39 || e.keyCode == 40) {      
                $(".button:focus").next().focus();
    
            }
            if (e.keyCode == 37 || e.keyCode == 38) {      
                $(".button:focus").prev().focus();
    
            }
        };

    buttons[0].text = (buttons[0].text == undefined) ? "Ok" : buttons[0].text;
    title = (title == undefined) ? "The page says:" : title;

    msgDiv = $('<div class="dialogBox">');
    msgDiv.html(message);
    msgDiv.attr('title', title);
    msgDiv.dialog({
        autoOpen: true,
        modal: true,
        closeOnEscape: false,
        // no close option (have to click one of the buttons)
        open: function(event, ui) {
            $(".ui-dialog-titlebar-close", ui.dialog | ui).hide();
        },
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
        // and adds a button class
        return {
            text: button.text,
            class: "button",
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

function generateLetterButtons(layout){
    // generate letter buttons from scratch
    letterButtons = [];
    $(".letterButton").remove();
    $("#letterButtonWindow").empty();
    // keyboard layout for portrait orientation
    if (layout == "portrait"){
        alphabet = "qwertyuiopasdfghjklzxcvbnm";
    }
    // alphabetical layout for landscape-oriented device (which presumably has a keyboard)
    else {
        alphabet = "abcdefghijklmnopqrstuvwxyz";
    }
    // generate the buttons
    [...alphabet].forEach(letter => {
        var letterButton = $('<div class="letterBox letterButton"></div>');
        // add the letter, and an invisible "X" which will show once the letter is used
        var letterContent = $('<div class="innerLetter">');
        letterContent.text(letter);
        var xBox = $('<div class="X">');
        xBox.text("X");
        // add both to the button
        letterButton.append(letterContent);
        letterButton.append(xBox);
        // add click event
        letterButton.mouseup(function(){guessLetter(letter);});
        // add button to window
        $("#letterButtonWindow").append(letterButton);
        // alter layout for keyboard
        if (layout == "portrait" && (letter == "l" || letter == "p")) {
            $("#letterButtonWindow").append($("<br>"));
        }
        // add to array
        letterButtons.push(letterButton);
    });
    // mark off ones which have been guessed already
    usedLetters.forEach(letter => {
        // show the corresponding "X" over the button for this letter
        letterButtons[alphabet.indexOf(letter)].children(".X").css({"display": "block"});
    });
}

function getSecretWord(category) {
    // take the last element off the word list
    // since the list has already been randomized, this means that you won't see the same word twice
    //  until all options have been exhausted (or you switch categories and back again)
    if (this.prevCategory != category || possibleWords.length == 0) {
        // re-get the list (start over, new random order)
        this.prevCategory = category;
        possibleWords = getCategoryList(category).slice(0).randomizeOrder();
        // never show the same word twice in a row
        if (possibleWords[possibleWords.length-1] == secretWord) {
            var placeholder = possibleWords[possibleWords.length-1];
            possibleWords[possibleWords.length-1] = possibleWords[0];
            possibleWords[0] = placeholder;
        }
    }
    return possibleWords.pop();
}

function populateCategories() {
    categories = [{
        "name": "fruits and vegetables",
        "list": ["watermelon", "pineapple", "grapefruit", "zucchini", "pumpkin",
        "bell pepper", "brussels sprouts", "cherry", "canteloupe", "green onion"]
    }, {
        "name": "mass-produced objects",
        "list": ["shopping cart", "happy meal toys", "ikea furniture", "cell phone",
        "shoes", "paperclip", "ball point pen"]
    }, {
        "name": "weapons of mass destruction",
        "list": ["nuclear missile", "death star", "predator drone", "zombie plague",
        "ice nine", "doomsday machine", "mustard gas"]
    }, {
        "name": "rock bands",
        "list": ["Led Zeppelin", "Smashing Pumpkins", "Red Hot Chili Peppers", "Black Sabbath",
        "Nirvana", "White Stripes", "Aerosmith"]
    }, {
        "name": "surveying tools",
        "list": ["contour map", "theodolite", "compass", "transit", "level", 
        "octant", "rangefinder"]
    }, {
        "name": "household appliances",
        "list": ["microwave", "toaster oven", "refrigerator", "vending machine", "blender",
        "washing machine", "dryer"]
    }, {
        "name": "invertebrates",
        "list": ["worm", "jellyfish", "sea cucumber", "octopus", "squid", "centipede", "spider"]
    }, {
        "name": "extinct mammals",
        "list": ["wooly mammoth", "mastodon", "saber tooth tiger", "giant sloth", 
        "stellar's sea cow", "neanderthal", "dire wolf", "cave bear"]
    }];
    // $("#categories").empty();
    categories.forEach(function(category){
        $("#categories").append($('<option value="' + category.name + '">' + category.name + '</option>'));
    });
}

function getCategoryList(category) {
    // return the list for the matching category
    return categories.filter(item => {return item.name === category;})[0].list;
}