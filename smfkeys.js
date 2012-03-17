
var States = {
  INDEX: 1,
  BOARD: 2,
  TOPIC: 3,
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
    case 111: // o
      open();
      break;
    case 117: // u
      up();
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
  } else if(SMFKeys.state == States.TOPIC) {
    return $('div[class="post_wrapper"]');
  } else {
    return [];
  }
}

function getRow(a, b) {
  var index;
  var f;
  if(b) {
    index = a;
    f = b;
  } else {
    f = a;
    index = SMFKeys.data[SMFKeys.state].position;
  }

  getRows().eq(index).each(f);
}

// Returns the number of rows in the current state by counting the appropriate DOM elements.
function countRows() {
  return getRows().length;
}

// Focuses the currently selected row.
function focusRow() {
  getRow(function() {
    var row = $(this);

    if(SMFKeys.state == States.INDEX) {
      row.attr('style', 'background: red');
    } else if(SMFKeys.state == States.BOARD) {
      row.attr('style', 'border-left: 3px solid red');
    } else if(SMFKeys.state == States.TOPIC) {
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
  getRow(function() { $(this).attr('style', ''); });
}


// Command handlers
function moveDown() { // j
  var rows = countRows();
  if(SMFKeys.data[SMFKeys.state].position < countRows() - 1) {
    blurRow();
    SMFKeys.data[SMFKeys.state].position++;
    focusRow();
    saveState();
  }
}

function moveUp() { // k
  if(SMFKeys.data[SMFKeys.state].position > 0) {
    blurRow();
    SMFKeys.data[SMFKeys.state].position--;
    focusRow();
    saveState();
  }
}


function open() { // o
  if(SMFKeys.state == States.INDEX) {
    getRow(function(){
      window.location = $('a.subject', this).attr('href');
    });
  } else if(SMFKeys.state == States.BOARD) {
    getRow(function(){
      window.location = $('strong a', this).attr('href');
    });
  }
  // No 'open' on topic.
}

function up() { // u
  if(SMFKeys.state == States.BOARD) {
    document.location.search = ''; // up to index.php
  } else if(SMFKeys.state == States.TOPIC) {
    var matches = $('.navigate_section a[href*="?board="]');
    window.location = matches.first().attr('href');
  }
}



$("document").ready(function() {
  document.addEventListener('keypress', keyPress, false);

  // Determine state from the URL.
  var path = document.location.search;
  if(path.indexOf('board=') >= 0) {
    SMFKeys.state = States.BOARD;
  } else if(path.indexOf('topic=') >= 0) {
    SMFKeys.state = States.TOPIC;
  } else if(document.location.pathname.match(/index.php$/) && !path) {
    SMFKeys.state = States.INDEX;
  }
  SMFKeys.loaded = true;
  maybeInit();
});
