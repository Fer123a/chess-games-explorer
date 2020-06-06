function move(board, chessKernel, selectedMove, moves)
{
    // Send move to kernel and update the board 
    chessKernel.move(selectedMove);
    board.position(chessKernel.fen());

    updateHistory(selectedMove)

    var currentDict = moves;
    //var movesHistoryElement = document.getElementById("movesHistory")
    var movesString = "";
    for (let i=0; i<movesHistory.length; i++)
    {
        // Find the "next_moves" in the database from the current position
        currentDict = currentDict[movesHistory[i]]["next_moves"]
        if (i % 2 == 0)
        {
            movesString += (i / 2 + 1).toString() + ". ";
        }
        movesString += movesHistory[i] + " ";
    }

    //movesHistoryElement.innerHTML = movesString;

    createMovesList(currentDict)
    createMovesLinks();
}

function createMovesList(movesDict)
{
    var movesList = document.getElementById("movesList")

    // Remove all elements of the "movesList" element
    while(movesList.firstChild)
    {
        movesList.removeChild(movesList.firstChild);
    }

    for (currentMove in movesDict)
    {
        let white_percentage = movesDict[currentMove]["white_percentage"].toString();
        let draw_percentage = movesDict[currentMove]["draw_percentage"].toString();
        let black_percentage = movesDict[currentMove]["black_percentage"].toString();

        let movesListItem = document.createElement("li");
        movesListItem.classList.add("moves-list-element");

        let progressItem = document.createElement("div");
        progressItem.classList.add("progress");

        let moveItem = document.createElement("div");
        moveItem.classList.add("move");

        let spanMoveItem = document.createElement("span");
        spanMoveItem.classList.add("cursor-pointer");
        let text = document.createTextNode(currentMove);
        spanMoveItem.appendChild(text)
        spanMoveItem.setAttribute("onclick", "move(board, chessKernel, '" + text.textContent + "', " + "moves)");

        moveItem.appendChild(spanMoveItem);

        let moveCountItem = document.createElement("div");
        let spanMoveCountItem = document.createElement("span");
        spanMoveCountItem.classList.add("move-count");
        text = document.createTextNode(movesDict[currentMove]["count"]);
        spanMoveCountItem.appendChild(text)

        moveCountItem.appendChild(spanMoveCountItem);

        let percentageBarWhite = document.createElement("div");
        percentageBarWhite.classList.add("progress-bar", "percentage-bar", "bar-white");
        percentageBarWhite.setAttribute("role", "progressbar");
        percentageBarWhite.style.width = white_percentage + "%"; 
        percentageBarWhite.setAttribute("aria-valuenow", white_percentage);
        percentageBarWhite.setAttribute("aria-valuemin", "0");
        percentageBarWhite.setAttribute("aria-valuemax", white_percentage);
        text = document.createTextNode(white_percentage + "%");
        percentageBarWhite.appendChild(text)

        let percentageBarDraw = document.createElement("div");
        percentageBarDraw.classList.add("progress-bar", "percentage-bar", "bar-draw");
        percentageBarDraw.setAttribute("role", "progressbar");
        percentageBarDraw.style.width = draw_percentage + "%"; 
        percentageBarDraw.setAttribute("aria-valuenow", draw_percentage);
        percentageBarDraw.setAttribute("aria-valuemin", "0");
        percentageBarDraw.setAttribute("aria-valuemax", draw_percentage);
        text = document.createTextNode(draw_percentage + "%");
        percentageBarDraw.appendChild(text)

        let percentageBarBlack = document.createElement("div");
        percentageBarBlack.classList.add("progress-bar", "percentage-bar", "bar-black");
        percentageBarBlack.setAttribute("role", "progressbar");
        percentageBarBlack.style.width = black_percentage + "%"; 
        percentageBarBlack.setAttribute("aria-valuenow", black_percentage);
        percentageBarBlack.setAttribute("aria-valuemin", "0");
        percentageBarBlack.setAttribute("aria-valuemax", black_percentage);
        text = document.createTextNode(black_percentage + "%");
        percentageBarBlack.appendChild(text)
        
        progressItem.appendChild(moveItem);
        progressItem.appendChild(moveCountItem);
        progressItem.appendChild(percentageBarWhite);
        progressItem.appendChild(percentageBarDraw);
        progressItem.appendChild(percentageBarBlack);
        
        movesListItem.appendChild(progressItem);
        
        movesList.appendChild(movesListItem);
    }
}

function reset(board, chessKernel)
{
    //let movesHistoryElement = document.getElementById("movesHistory");

    board.start();
    chessKernel.reset();
    movesHistory = [];
    currentMoveIndex = 0;
    positionInDatabase = true
    //movesHistoryElement.innerHTML = "";

    createMovesList(moves);
    clearMovesLinks();
}

function goBack(board, chessKernel, moves, nTimes=1)
{   
    // Check if the resulting position would be prior to the starting position
    if (currentMoveIndex - nTimes < 0)
    {
        return
    }

    unsetHighlightedMove();

    var currentDict = moves;
    chessKernel.reset();
    positionInDatabase = true;

    currentMoveIndex -= nTimes;


    for (let i=0; i<currentMoveIndex; i++)
    {
        chessKernel.move(movesHistory[i]);
        try
        {
            currentDict = currentDict[movesHistory[i]]["next_moves"]
        }
        catch(err)
        {
            positionInDatabase = false;
        }
    }

    board.position(chessKernel.fen());
    if (positionInDatabase)
    {
        createMovesList(currentDict);
    }

    setHighlightedMove();
}

function goForward(board, chessKernel, moves, nTimes=1)
{
    if (currentMoveIndex + nTimes > movesHistory.length)
    {
        return
    }

    unsetHighlightedMove();

    var currentDict = moves;
    chessKernel.reset();
    currentMoveIndex += nTimes;


    for (let i=0; i<currentMoveIndex; i++)
    {
        try
        {
            chessKernel.move(movesHistory[i]);
            currentDict = currentDict[movesHistory[i]]["next_moves"];
        }
        catch(err)
        {
            positionInDatabase = false;
        }
    }


    // Check if goBack went to a position from the database
    if (positionInDatabase)
    {
        createMovesList(currentDict);
    }
    else
    {
        movesList.innerHTML = "There are no games in this position";
    }
    
    board.position(chessKernel.fen());
    setHighlightedMove();
}

function changeCaret()
{
    this.find('i').toggleClass("fa-caret-right fa-caret-down");
}

// Function from https://chessboardjs.com/examples.html#5000
function onDragStart (source, piece, position, orientation) {
    // do not pick up pieces if the game is over
    if (chessKernel.game_over()) return false
  
    // only pick up pieces for the side to move
    if ((chessKernel.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (chessKernel.turn() === 'b' && piece.search(/^w/) !== -1)) {
      return false
    }
}

// Function modified from https://chessboardjs.com/examples.html#5000
function onDrop (source, target) {
    // see if the move is legal
    var move = chessKernel.move({
      from: source,
      to: target,
      promotion: 'q' // NOTE: always promote to a queen for example simplicity
    })
  
    // illegal move
    if (move === null) return 'snapback'
  
    onDropCreateMoveList(moves, move["san"])
}

// Function from https://chessboardjs.com/examples.html#5000
// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd () {
    board.position(chessKernel.fen())
}

function onDropCreateMoveList(movesDict, selectedMove)
{
    if (positionInDatabase)
    {
        currentDict = movesDict;
        // Iterate to get to the moves currently shown
        for (var i=0; i<currentMoveIndex; i++)
        {
            currentDict = currentDict[movesHistory[i]]["next_moves"];
        }
    }
    else
    {
        currentDict = [];
    }
    

    // Add another move
    updateHistory(selectedMove)

    // Check if this position is in the database
    if (selectedMove in currentDict)
    {
        createMovesList(currentDict[selectedMove]["next_moves"]);
    }
    else
    {
        positionInDatabase = false;
        var movesList = document.getElementById("movesList")

        while(movesList.firstChild)
        {
            movesList.removeChild(movesList.firstChild);
        }

        movesList.innerHTML = "There are no games in this position";
    }

    //var movesHistoryElement = document.getElementById("movesHistory")
    var movesString = "";
    
    for (let i=0; i<movesHistory.length; i++)
    { 
        if (i % 2 == 0)
        {
            movesString += (i / 2 + 1).toString() + ". ";
        }
        movesString += movesHistory[i] + " ";
    }

    //movesHistoryElement.innerHTML = movesString;
    createMovesLinks()
}


function updateHistory(selectedMove)
{
    // Updates the number of moves and add it to the history
    if (movesHistory[currentMoveIndex] == selectedMove)
    {
        // If the move is already in the history at the right place,
        // just increase currentMoveIndex
        currentMoveIndex += 1;
        return;
    }

    movesHistory[currentMoveIndex] = selectedMove; 
    currentMoveIndex += 1;
    
    // Remove every move that has become obsolete 
    movesHistory.splice(currentMoveIndex, movesHistory.length - currentMoveIndex);
}


function createMovesLinks()
{
    var movesLink = document.getElementById("movesHistory")

    clearMovesLinks()

    for (let i = 0; i < movesHistory.length; i++)
    {
        currentMove = movesHistory[i]
        
        let moveItem = document.createElement("div");
        moveItem.classList.add("move-history");

        let spanMoveItem = document.createElement("span");
        spanMoveItem.classList.add("cursor-pointer");

        if (i % 2 == 0)
        {
            var text = document.createTextNode((i / 2 + 1).toString() + ". " + currentMove);
            spanMoveItem.appendChild(text)
            spanMoveItem.setAttribute("onclick", "goToPosition('" + text.textContent.substr(3) + "')");
        }
        else
        {
            var text = document.createTextNode(" " + currentMove);
            spanMoveItem.appendChild(text)
            spanMoveItem.setAttribute("onclick", "goToPosition('" + text.textContent.substr(1) + "')");
        }
        
        moveItem.appendChild(spanMoveItem)
        movesLink.appendChild(moveItem)
    }

    movesLink.children[currentMoveIndex - 1].classList.add("current-move");
}

function clearMovesLinks()
{
    var movesLink = document.getElementById("movesHistory")

    while(movesLink.firstChild)
    {
        movesLink.removeChild(movesLink.firstChild);
    }
}

function goToPosition(selectedMove)
{
    // Get the index of the selected move in the history
    var selectedMoveIndex = movesHistory.findIndex(element => element == selectedMove)

    if (selectedMoveIndex == currentMoveIndex -1)
    {
        return
    }

    // Check if the user is trying to go back or forward  
    if (selectedMoveIndex < currentMoveIndex - 1)
    {
        // Trying to go back
        goBack(board, chessKernel, moves, currentMoveIndex - 1 - selectedMoveIndex)
    }
    else
    {
        goForward(board, chessKernel, moves, selectedMoveIndex + 1 - currentMoveIndex)
    }
}

function setHighlightedMove()
{
    var movesLink = document.getElementById("movesHistory");
    movesLink.children[currentMoveIndex - 1].classList.add("current-move");
}

function unsetHighlightedMove()
{
    var movesLink = document.getElementById("movesHistory");
    movesLink.children[currentMoveIndex - 1].classList.remove("current-move");
}