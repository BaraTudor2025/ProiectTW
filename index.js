const express = require("express");
const path = require("path");
const formidable = require("formidable");
const session = require("express-session");
const crypto = require("crypto");
const fs = require("fs");

const crypto_key = "ce_i_criptarea_lmao";

const activateLogging = true; // ca sa nu umple hard-ul

let app = express();

/* task-uri: 
 * 3.3: undo note
 * 5.3: template ?id=num 
 * 5.4: logging
*/

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "assets")))
app.use(express.json());
app.use(session({
  secret: 'chestie_sesiune',
  resave: true,
  saveUninitialized: false
}))

function getSessionUser(req) {
  if (req.session && req.session.user)
    return req.session.user
  else
    return null;
}

function readUsersData() {
  return JSON.parse(fs.readFileSync('users.json'));
}
function writeUsersData(usersData) {
  fs.writeFileSync('users.json', JSON.stringify(usersData));
}
function getUserFromDataById(usersData, id) {
  return usersData.users.find(function (u) { return u.id == id; });
}
function getSongsFromUser(user) {
  let songs = [];
  for (let i = 0; i < user.songs.length; ++i) {
    songs.push({
      author: user.username,
      name: user.songs[i].name,
      notes: user.songs[i].notes
    });
  }
  return songs;
}

function logAction(log) {
  if (activateLogging) {
    let logs = JSON.parse(fs.readFileSync('logs.json'));
    logs.push(log);
    fs.writeFileSync('logs.json', JSON.stringify(logs));
  }
}

app.get("/", function (req, res) {
  let user = getSessionUser(req)
  res.render("html/index", { user: user });
})

app.get('/page_compose', function (req, res) {
  let user = getSessionUser(req)
  res.render("html/page_compose", { user: user });
})

app.get('/page_songs', function (req, res) {
  let user = getSessionUser(req)
  res.render("html/page_songs", { user: user });
})

app.get('/page_login', function (req, res) {
  let user = getSessionUser(req)
  if (user)
    res.render("html/page_login", { user: user, username: user.username, login_status: "OK" });
  else
    res.render("html/page_login", { username: "", login_status: "" });
})

app.get('/page_signup', function (req, res) {
  res.render("html/page_signup");
})

function note2FileName(note) {
  const noteListBemol = ['b', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B', 'C', 'Db', 'D', 'eb', 'e'];
  if (note == 'b') {
    note = 'b-mic';
  } else if (note.length == 2) {
    if (note[1] == 'b') {
      note = noteListBemol[noteListBemol.indexOf(note) - 1];
    } else {
      note = note[0];
    }
    note = note.toLowerCase();
    note += 'sh';
  } else if (note == 'e') {
    note = 'e2';
  } else {
    note = note.toLowerCase();
  }
  return note;
}

app.get('/note/:nota.mp3', function (req, res) {
  let fileName = note2FileName(req.params.nota);
  const file = fs.readFileSync("assets/audio/" + fileName + ".mp3");
  res.contentType = 'audio/mp3';
  res.write(file);
  res.end();
})

app.post('/save-song-action', function (req, res) {
  let song = req.body.song;
  let usersData = readUsersData();
  let user = getUserFromDataById(usersData, req.session.user.id);
  user.songs.push(song);
  writeUsersData(usersData);
  logAction({
    "user_id": user.id,
    "action": "create-song",
    "song-name": song.name,
    "date": (new Date).toLocaleString()
  });
  res.end()
})


app.get('/songs.json', function (req, res) {
  let users = readUsersData().users;
  let songs = [];
  for (let i = 0; i < users.length; ++i) {
    let user = users[i];
    for (let j = 0; j < user.songs.length; ++j) {
      songs.push({
        author: user.username,
        name: user.songs[j].name,
        notes: user.songs[j].notes
      });
    }
  }
  res.json(songs);
})

// /profile?id={num}
app.get('/profile', function (req, res) {
  const id = req.query.id;
  let puser = getUserFromDataById(readUsersData(), id);
  let suser = getSessionUser(req);
  if (!puser) {
    res.render('html/page_404', { user: suser })
  } else if (suser && suser.id != puser.id) {
    logAction({
      "action": "visualize-profile",
      "user_id": suser.id,
      "user_id_visited": id,
      "date": (new Date).toLocaleString()
    });
    res.render('html/page_profile', { user: suser, profile: puser });
  } else {
    res.render('html/page_profile', { user: suser, profile: puser });
  }
})

app.post('/delete-song', function (req, res) {
  let song = req.body.song;
  if (req.session.user.id == song.profile_id) {
    logAction({
      "action": "delete-song",
      "user_id": song.profile_id,
      "song_name": song.name,
      "date": (new Date).toLocaleString()
    });
    let users = readUsersData();
    let user = getUserFromDataById(users, song.profile_id);
    user.songs = user.songs.filter(function (s) { return s.name != song.name; });
    writeUsersData(users);
  }
  res.end()
})

// doar music_logic.js:playNotesButton foloseste asta
app.post('/log-action', function (req, res) {
  logAction({
    "user_id": req.session.user.id,
    ...req.body.log
  });
  res.end()
})

app.post("/register-action", function (req, res) {
  let form = new formidable.IncomingForm();
  form.parse(req, function (err, fields, files) {
    if (err) {
      console.log("Eroare de register: ", err);
      res.redirect("/")
      return;
    }
    if (fields.password == fields.repeat_password) {
      let usersData = readUsersData();
      let algoritmCriptare = crypto.createCipher("aes-128-cbc", crypto_key);
      let pwdCrypt = algoritmCriptare.update(fields.password, "utf-8", "hex");
      pwdCrypt += algoritmCriptare.final("hex");
      let newUser = {
        id: usersData.usersCount,
        username: fields.username,
        password: fields.password,
        sex: fields.gender,
        password_crypt: pwdCrypt,
        songs: []
      };
      usersData.usersCount++;
      usersData.users.push(newUser);
      writeUsersData(usersData);
      res.redirect("/page_login");
    } else {
      res.redirect("/");
    }
  })
})

app.post('/login-action', function (req, res) {
  let form = new formidable.IncomingForm()
  form.parse(req, function (err, fields, files) {
    console.log(fields.username)
    console.log(fields.password)
    let usersData = readUsersData();
    let algoritmCriptare = crypto.createCipher("aes-128-cbc", crypto_key);
    let pwdCrypt = algoritmCriptare.update(fields.password, "utf-8", "hex");
    pwdCrypt += algoritmCriptare.final("hex");
    let user = usersData.users.find(function (u) {
      return u.username == fields.username;
    })
    if (user) {
      //if (user.password_crypt == pwdCrypt) {
      if (user.password == fields.password) {
        console.log('User:', user, ' logged in');
        req.session.user = user;
        res.redirect('/')
      } else {
        console.log('User:', user, ' a gresit parola');
        res.render('html/page_login', { username: user.username, login_status: "ERR-PWD" })
      }
    } else {
      console.log("user: ", fields.username, " nu este");
      res.render('html/page_login', { username: fields.username, login_status: "ERR-USER" })
    }
  })
})

app.get('/logout-action', function (req, res) {
  req.session.destroy()
  res.redirect('/')
})

app.get('/*', function (req, res) {
  res.render('html/page_404', { user: req.session.user });
})

// app.get("/*", function (req, res) {

//   console.log("============================");
//   console.log(req.url);
//   //err este null daca randarea s-a terminat cu succes, si contine eroarea in caz contrar (a survenit o eroare)
//   //rezRandare - textul in urma randarii (compilarii din ejs in html)
//   var un = req.session ? (req.session.utilizator ? req.session.utilizator.username : null) : null;

//   res.render("html" + req.url, { username: un },
//     function (err, rezRandare) {
//       if (err) {
//         if (err.message.includes("Failed to lookup view")) {
//           res.status(404).render("html/404", { username: un });
//         }
//         else {
//           throw err;
//         }
//       }
//       else {
//         res.send(rezRandare);
//       }
//     })
// })

// app.use(function (req, res) {
//   // de pus pagina 404
//   res.status(404).render("html/404")
// })

app.listen(8080)

console.log("nush")