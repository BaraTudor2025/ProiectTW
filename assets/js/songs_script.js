setInterval(getSongsAndDisplay, 2000);

let songFilters = {
  author: "",
  songsName: "",
  sort: false
};

let isLoading = true;
function getSongsAndDisplay() {
  let req = new XMLHttpRequest();
  req.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      let songsStr = this.responseText;
      let localSongs = localStorage.getItem('songs');
      if (isLoading || localSongs == null || localSongs.localeCompare(songsStr) != 0) {
        isLoading = false;
        localStorage.setItem('songs', songsStr);
        displaySongs(JSON.parse(songsStr), songFilters);
      }
    }
  }
  req.open('get', '/songs.json', true);
  req.send();
}


window.onload = function () {
  getSongsAndDisplay();
  document.getElementById('filter-autor').oninput = function (e) {
    songFilters.author = e.target.value;
    displaySongs(JSON.parse(localStorage.getItem('songs')), songFilters);
  }
}

function displaySongs(songs, filters) {
  let songListElem = document.getElementById('song-list');
  songListElem.innerHTML = '';
  document.getElementById('num-songs').innerHTML = ' ' + songs.length;
  for (let i = 0; i < songs.length; ++i) {
    //if (!filter('', song))
    //continue;
    if (filters.author != '' && !songs[i].author.includes(filters.author)) {
      continue;
    }
    let songElem = songListElem.appendChild(document.createElement('li'));
    songElem.setAttribute('class', 'simple-box');
    songElem.innerHTML = ejs.render(" \
        <p> Autor: <%= song.author %> </p>  \
        <p> Nume: <%= song.name %></p> \
        <ul class='note-string'> \
           <% for(let i=0; i<song.notes.length; ++i) { %>\
          <li style='display: inline'><%= song.notes[i] %></li> \
          <% } %>\
        </ul> \
        <div class='song-name' style='display:none'><%=song.name%></div>\
        <button type='button' onclick='playNotesButton(this)'>play</button>"
      , { song: songs[i] });
  }
}
