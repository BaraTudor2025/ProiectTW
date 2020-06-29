
document.addEventListener("keydown", function (event) {
  if (event.altKey) {
    if (event.key == 'b') {
      let noteString = document.getElementById("note-string");
      let note = mapNoteBemol(noteString.lastChild.innerHTML);
      if (note)
        noteString.lastChild.innerHTML = note;
    } else if (event.key == 's') {
      let noteString = document.getElementById("note-string");
      let note = mapNoteSharp(noteString.lastChild.innerHTML);
      if (note)
        noteString.lastChild.innerHTML = note;
    }
  }
})

function createNoteElem(note) {
  let el = document.createElement('li');
  el.innerHTML = note;
  el.style.display = "inline-block";
  el.style.paddingRight = "5px";
  return el;
}

window.onload = function () {
  let istoricNote = [];
  let noteString = document.getElementById("note-string");
  // setup pentru butoanele de note
  for (let i = 0; i < noteIDs.length; ++i) {
    let note = noteIDs[i];
    document.getElementById("note-" + note).onclick = function () {
      noteString.appendChild(createNoteElem(note));
      //istoricNote = []
      istoricNote.push('u');
    };
  }

  // play notes 
  document.getElementById("play-button").onclick = async function () {
    for (let i = 0; i < noteString.children.length; ++i) {
      let noteElem = noteString.children.item(i);
      await playNote(noteElem.innerHTML);
    }
  }

  // delete note
  document.getElementById("delete-note-button").onclick = function () {
    istoricNote.push(noteString.lastChild.innerHTML);
    noteString.removeChild(noteString.lastChild);
  }

  // modificator sharp
  document.getElementById("modifier-sharp").onclick = function () {
    let noteElem = noteString.lastChild;
    let note = mapNoteSharp(noteElem.innerHTML);
    if (note)
      noteElem.innerHTML = note;
  }

  // modificator bemol
  document.getElementById("modifier-bemol").onclick = function () {
    let noteElem = noteString.lastChild;
    let note = mapNoteBemol(noteElem.innerHTML);
    if (note)
      noteElem.innerHTML = note;
  }

  // undo
  document.getElementById("undo-note-button").onclick = function () {
    let note = istoricNote.pop();
    if (note) {
      if (note == 'u') // delete last added
        noteString.removeChild(noteString.lastChild);
      else
        noteString.appendChild(createNoteElem(note));
    }
  }

  // reset undo
  // document.getElementById("reset-undo-button").onclick = function () {
  //   istoricNote = [];
  // }

  // save song
  document.getElementById("save-song-button").onclick = function () {
    let song = {};
    song.name = document.getElementById('song-name-input').value;
    song.notes = [];
    for (let i = 0; i < noteString.children.length; ++i) {
      let noteElem = noteString.children.item(i);
      song.notes.push(noteElem.innerHTML);
    }
    let req = new XMLHttpRequest();
    req.open("POST", '/save-song-action');
    req.setRequestHeader("Content-type", 'application/json');
    req.send(JSON.stringify({ song: song }), true);

    // let logReq = new XMLHttpRequest();
    // logReq.open('POST', '/log-action');
    // logReq.setRequestHeader("Content-type", 'application/json');
    // let log = {
    //   "action": "create-song",
    //   "song-name": song.name,
    //   "date": (new Date).toLocaleString()
    // }
    // logReq.send(JSON.stringify({ log: log }), true)
  }

}