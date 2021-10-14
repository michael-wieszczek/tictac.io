const url = window.location.origin;
let socket = io.connect(url);

var myTurn = true;
var symbol;
var initalizedBoard = false;
var filledCounter = 0;
var counter = 100;
var xPoints = 0;
var oPoints = 0;
const filledChance = 2;
const BOARDSIZE = 100;

// Determines if all squares are filled on board
function isGameOver() {
    if (counter == 0) {
        return true;
    }
    return false;
}

function renderTurnMessage() {
    if (!myTurn) { // If not player's turn disable the board
        $("#message").text("Your opponent's turn");
        $(".board button").attr("disabled", true);
    } else { // Enable it otherwise
        $("#message").text("Your turn.");
        $(".board button").removeAttr("disabled");
    }
}

function makeMove(e) {
    if (!initalizedBoard) {
        $(".board button").each(function() {
            if((Math.floor(Math.random() * 10) + 1) <= filledChance) {
                filledCounter++;
                socket.emit("make.move", { // Valid move (on client side) -> emit to server
                    symbol: "F",
                    position: $(this).attr("id")
                });
            }
          });
    } else {
        if (!myTurn) {
            return; // Shouldn't happen since the board is disabled
        }

        if ($(this).text().length) {
            return; // If cell is already checked
        }

        socket.emit("make.move", { // Valid move (on client side) -> emit to server
            symbol: symbol,
            position: $(this).attr("id")
        });
    }
}

function pointTally() {
    //var state = getBoardState();
    var board = [BOARDSIZE];
    var j = 0;
    $(".board button").each(function() {
        board[j] = $(this).text();
        j++;
    });

    // Logic to tally up points to determine winner
    for (var i = 0; i < BOARDSIZE; i++) {
        if (board[i] == "X") {
            // Horizontal right 3 in a row
            if (i % 10 <= 7) { //if i is greater than 7 there is not enough space to get 3 in a row
                if ((board[i] == board[i+1]) && (board[i] == board[i+2])) {
                    xPoints++;
                }
            }

            // Diagonal down right 3 in a row
            if ((i % 10 <= 7) && (i < 80)) { //combined logic of horizontal and vertical
                if ((board[i] == board[i+11]) && (board[i] == board[i+22])) {
                    xPoints++;
                }
            }

            // Vertical down 3 in a row
            if (i < 80) { //if i is greater than or equal to 80, there is no space to get 3 in a column on the board
                if((board[i] == board[i+10]) && (board[i] == board[i+20])) {
                    xPoints++;
                }
            }

            // Diagonal down left 3 in a row
            if ((i % 10 >= 2) && (i < 80)) { //combined logic of horizontal and vertical with horizontal orientation flipped
                if ((board[i] == board[i+9]) && (board[i] == board[i+18])) {
                    xPoints++;
                }
            }
        } else if (board[i] == "O") {
            // Horizontal right 3 in a row
            if (i % 10 <= 7) { //if i is greater than 7 there is not enough space to get 3 in a row
                if ((board[i] == board[i+1]) && (board[i] == board[i+2])) {
                    oPoints++;
                }
            }

            // Diagonal down right 3 in a row
            if ((i % 10 <= 7) && (i < 80)) { //combined logic of horizontal and vertical
                if ((board[i] == board[i+11]) && (board[i] == board[i+22])) {
                    oPoints++;
                }
            }

            // Vertical down 3 in a row
            if (i < 80) { //if i is greater than or equal to 80, there is no space to get 3 in a column on the board
                if((board[i] == board[i+10]) && (board[i] == board[i+20])) {
                    oPoints++;
                }
            }

            // Diagonal down left 3 in a row
            if ((i % 10 >= 2) && (i < 80)) { //combined logic of horizontal and vertical with horizontal orientation flipped
                if ((board[i] == board[i+9]) && (board[i] == board[i+18])) {
                    oPoints++;
                }
            }
        }
    }   
    
}

// Bind event on players move
socket.on("move.made", function(data) { // Render move
    if (data.symbol == "F") {
        $("#" + data.position).css({"background-color": "black"});
    } else {
        $("#" + data.position).text(data.symbol);
    }

    if (initalizedBoard) {

        counter--;

        // If the symbol of the last move was the same as the current player
        // means that now is opponent's turn
        myTurn = data.symbol !== symbol;

        if (!isGameOver()) { // If game isn't over show who's turn is this
            renderTurnMessage();
        } else { // Else show win/lose message
            pointTally(); // Make this method to tally up all points after game done
            $("#score").text("X has: " + xPoints + ", O has: " + oPoints);
            if (xPoints > oPoints) {
                $("#message").text("X Wins!");
            } else if (oPoints > xPoints) {
                $("#message").text("O Wins!");
            } else {
                $("#message").text("It's a tie.");
            }
            
            $(".board button").attr("disabled", true); // Disable board
        }
    }
});


// Bind event for game begin
socket.on("game.begin", function(data) {
    symbol = data.symbol; // The server is assigning the symbol
    myTurn = symbol === "X"; // 'X' starts first
    if (myTurn) { // Will only activate for first player
        makeMove();
        socket.emit("filledCounter", filledCounter);
    }
    initalizedBoard = true;
    renderTurnMessage();
});

socket.on("filledCounter.set", (data) => {
    filledCounter = data;
});

// Bind on event for opponent leaving the game
socket.on("opponent.left", function() {
    $("#message").text("Your opponent left the game.");
    $(".board button").attr("disabled", true);
});

// Binding buttons on the board
$(function() {
  $(".board button").attr("disabled", true); // Disable board at the beginning
  $(".board> button").on("click", makeMove);
});