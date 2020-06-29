
function deleteSong(button, profileId) {
  let songName = button.parentElement.getElementsByClassName('song-name')[0];
  if (confirm("sigur vrei sa stergi cantecul: " + songName.innerHTML + '?')) {
    let req = new XMLHttpRequest();
    req.open('POST', '/delete-song');
    req.setRequestHeader('content-type', 'application/json');
    let song = {
      name: songName.innerHTML,
      profile_id: profileId
    }
    req.send(JSON.stringify({ song: song }), true);
    songName.parentElement.remove();
  }
}