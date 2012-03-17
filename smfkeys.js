
var States = {
  INDEX: 1,
  BOARD: 2,
  THREAD: 3,
  OFF: 4,
};

var SMFKeys = {};

SMFKeys.state = States.OFF;
SMFKeys.ready = false;
SMFKeys.loaded = false;

chrome.extension.sendRequest({ type: 'get', site: document.location.hostname }, handleGet);

function handleGet(response) {
  SMFKeys.data = response;
  SMFKeys.ready = true;
  maybeInit();
}

function maybeInit() {
  if(SMFKeys.ready && SMFKeys.loaded) {
    focusRow();
  }
}

function saveState() {
  chrome.extension.sendRequest({ type: 'put', site: document.location.hostname, state: SMFKeys.data });
}

function keyPress(event) {
  switch(event.keyCode) {
    case 106: // j
      moveDown();
      break;
    case 107: // k
      moveUp();
      break;
    default:
      return;
  }
}

// utility functions

// Returns the jQuery objects for all the rows in the current state.
function getRows() {
  if(SMFKeys.state == States.INDEX) {
    return $('tbody[class="content"] tr');
  } else if(SMFKeys.state == States.BOARD) {
    return $('div[id="messageindex"] table tbody tr');
  } else if(SMFKeys.state == States.THREAD) {
    return $('div[class="post_wrapper"]');
  } else {
    return [];
  }
}

function getRow(index, f) {
  getRows().eq(index).each(f);
}

// Returns the number of rows in the current state by counting the appropriate DOM elements.
function countRows() {
  return getRows().length;
}

// Focuses the currently selected row.
function focusRow() {
  getRow(SMFKeys.data[SMFKeys.state].position, function() {
    var row = $(this);

    if(SMFKeys.state == States.INDEX) {
      row.attr('style', 'background: red');
    } else if(SMFKeys.state == States.BOARD) {
      row.attr('style', 'border-left: 3px solid red');
    }

    var rowTop = row.offset().top;
    var rowHeight = row[0].offsetHeight;
    var rowBottom = rowTop + rowHeight;
    var windowHeight = $(window).height();

    if(rowTop < window.scrollY) { // need to scroll up
      window.scrollTo(0, rowTop);
    } else if (rowBottom > window.scrollY + windowHeight) { // need to scroll down
      if(rowHeight > windowHeight) { // doesn't fit, scroll to rowTop
        window.scrollTo(0, rowTop);
      } else { // does fit, scroll down to put it at the bottom.
        window.scrollTo(0, rowBottom - windowHeight);
      }
    }
  });
}

// Unfocuses the currently selected row.
function blurRow() {
  getRow(SMFKeys.data[SMFKeys.state].position, function() { $(this).attr('style', ''); });
}


// Command handlers
function moveDown() { // j
  window.console.log('moveDown');
  var rows = countRows();
  if(SMFKeys.data[SMFKeys.state].position < countRows() - 1) {
    blurRow();
    SMFKeys.data[SMFKeys.state].position++;
    focusRow();
    saveState();
  }
}

function moveUp() { // k
  window.console.log('moveUp');
  if(SMFKeys.data[SMFKeys.state].position > 0) {
    blurRow();
    SMFKeys.data[SMFKeys.state].position--;
    focusRow();
    saveState();
  }
}



$("document").ready(function() {
  document.addEventListener('keypress', keyPress, false);

  // Determine state from the URL.
  var path = document.location.search;
  if(path.indexOf('board=') >= 0) {
    SMFKeys.state = States.BOARD;
  } else if(path.indexOf('topic=') >= 0) {
    SMFKeys.state = States.THREAD;
  } else if(document.location.pathname.match(/index.php$/) && !path) {
    SMFKeys.state = States.INDEX;
  }
  SMFKeys.loaded = true;
  maybeInit();
  window.console.log(SMFKeys.state);
});
