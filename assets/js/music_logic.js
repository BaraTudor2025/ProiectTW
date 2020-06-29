function delay(delayInms) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, delayInms);
  });
}

function isSharp(note) {
  return (note.length == 2 && note[1] == '#');
}
function isBemol(note) {
  return note.length == 2 && note[1] == 'b';
}
function isPause(note) {
  return note.toLowerCase() == 'r' || note.toLowerCase() == 'p';
}

function mapNoteSharp(note) {
  if (isPause(note))
    return;
  if (note == 'b' || note == 'e')
    return null;
  if (isBemol(note)) {
    return note[0]; // taie din el
  } else {
    return noteListSharp[noteListSharp.indexOf(note) + 1];
  }
}

function mapNoteBemol(note) {
  if (isPause(note))
    return;
  if (note == 'b' || note == 'E')
    return null;
  if (isSharp(note)) {
    return note[0];
  } else {
    return noteListBemol[noteListBemol.indexOf(note) - 1];
  }
}

const noteIDs = ['b', 'E', 'F', 'G', 'A', 'B', 'C', 'D', 'e', 'r', 'R', 'p', 'P'];
const noteListSharp = ['b', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'e'];
const noteListBemol = ['b', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B', 'C', 'Db', 'D', 'eb', 'e'];

async function playNote(note) {
  if (isPause(note)) {
    switch (note) {
      case 'r':
        await delay(50);
        return;
      case 'R':
        await delay(200);
        return;
      case 'p':
        await delay(350);
        return;
      case 'P':
        await delay(750);
        return;
    }
  }
  if (isSharp(note)) {
    note = note[0];
    note += 's'; // simbolul '#' nu prea merge ca url
  }
  await delay(300);
  const sound = new Audio('/note/' + note + '.mp3');
  sound.volume = 0.2;
  sound.play();
}

async function playNotesButton(button) {
  let songNameElem = button.parentElement.getElementsByClassName('song-name');
  if (songNameElem.length != 0) {
    let songName = songNameElem[0].innerHTML;
    let logReq = new XMLHttpRequest();
    logReq.open('POST', '/log-action');
    logReq.setRequestHeader("Content-type", 'application/json');
    let log = {
      "action": "listen-song",
      "song-name": songName,
      "date": (new Date).toLocaleString()
    }
    logReq.send(JSON.stringify({ log: log }), true);
  }

  let noteString = button.parentElement.getElementsByClassName('note-string')[0];
  for (let i = 0; i < noteString.children.length; ++i) {
    let noteElem = noteString.children.item(i);
    await playNote(noteElem.innerHTML);
  }
}