let artistNames = [];
let artistName = "";
let playlistID = "";
let artistID = [];
let trackIDs = [];
let clientid = "d4ea6ecd0c0d405b82714e9a7d4b4c63";
let accessToken = "";
let userID = "";
let currentURL = window.location.href;
let songInfo = [];

getToken();

jQuery.ajaxPrefilter(function (options) {
    if (options.crossDomain && jQuery.support.cors) {
        options.url = 'https://cors-anywhere.herokuapp.com/' + options.url;
    }
});

$("#submit").on("click", function (event) {
    event.preventDefault();
    artistName = $("#inputArtist").val().trim()
    artistNames.push(artistName);
    $.ajax({
        url: "https://tastedive.com/api/similar?q=" + artistName + "&limit=5&k=346362-Playlist-KUO95N87",
        method: "GET"
    }).then(function (response) {
        for (var i = 0; i < response.Similar.Results.length; i++) {
            artistNames.push(response.Similar.Results[i].Name);
        }
        console.log(artistNames);
        getArtists(artistNames, getTopTracks);
    });
});

$("#create").on("click", function (event) {
    event.preventDefault();
    makePlaylist(addTracks);
});

$("#login").on("click", function (event) {
    event.preventDefault();
    authorize();
})

$("#playlist-btn").on("click", function(event){
    event.preventDefault();
    getSongInfo();
})
//takes an array of artist names in text and a callback function. converts array into numerical spoitify IDs and pushes to artistID array (global), then runs callbuck function using the array it populated
function getArtists(artists, callback) {
    let artistCount = 0;

    for (let artist of artists) {
        console.log("getting id for " + artist);
        $.ajax({
            url: "https://api.spotify.com/v1/search?q=" + artist + "&type=artist",
            method: "GET",
            headers: {
                "Authorization": "Bearer " + accessToken
            }
        }).then(function (response) {
            artistID.push(response.artists.items[0].id);
            if (artistCount >= artists.length - 1) {
                callback(artistID);
            }
            artistCount++;
        }).catch(function (error) {
            console.log(error);
        });
    }
}

//takes the array of track IDs and converts them into javascript objects containing song information, then runs tableMaker
function getSongInfo(){
    let songQuery = "";
    for (var i = 0; i < trackIDs.length; i++){
        if(i >= trackIDs.length-1){
            songQuery += trackIDs[i];
        }
        else{
            songQuery += trackIDs[i]+",";
        }
    }
    console.log("assembled info query : " +songQuery);
    $.ajax({
        url: "https://api.spotify.com/v1/tracks?ids="+songQuery,
        method: "GET",
        headers: {
            "Authorization": "Bearer " + accessToken
        }
    }).then(function (response){
        console.log(response);
        let songArray = response.tracks;
        for (var i = 0; i < songArray.length; i++){
            songInfo.push({title: songArray[i].name, artist: songArray[i].artists[0].name, album: songArray[i].album.name, year: songArray[i].album.release_date});
        }
        console.log("Created song data array at songInfo");
        console.log(songInfo);
        tableMaker();
    })
}

//puts the information from songInfo array on the page
function tableMaker() {
    console.log("beginning table construction");
    for (var i = 0; i < songInfo.length; i++) {
        let songPoint = i;
        let newTR = $("<tr>");
        newTR.attr("class","thead-light");
        let songTD = $("<td>");
        songTD.text(songInfo[songPoint].title);
        songTD.attr("scope", "col");
        let artistTD = $("<td>");
        artistTD.text(songInfo[songPoint].artist);
        artistTD.attr("scope", "col");
        let albumTD = $("<td>");
        albumTD.text(songInfo[songPoint].album);
        albumTD.attr("scope", "col");
        let releaseTD = $("<td>");
        releaseTD.text(songInfo[songPoint].year);
        releaseTD.attr("scope", "col");
        newTR.append(songTD);
        newTR.append(artistTD);
        newTR.append(albumTD);
        newTR.append(releaseTD);
        $("#song-table").append(newTR);
        console.log("pushing object to table");
    }
}

//using numerical spotify IDs in an array (artistID) this function retrieves the top tracks of the artists specified and puts them in the trackIDs array (global)
function getTopTracks(artists) {
    let artistCount = 0;
    for (let artist of artists) {
        console.log("getting top tracks for " + artist);
        $.ajax({
            url: "https://api.spotify.com/v1/artists/" + artist + "/top-tracks?country=ES",
            method: "GET",
            headers: {
                "Authorization": "Bearer " + accessToken
            }
        }).then(function (response) {
            if (response.tracks.length > 1) {
                trackIDs.push(response.tracks[0].id);
                trackIDs.push(response.tracks[1].id);
            }
            if (artistCount >= artists.length - 1) {
                console.log("Finished generating track ID list");
            }
            artistCount++;
        }).catch(function (error) {
            console.log(error);
        });
    }
}

//calls the spotify authorization page and prompts the user to log in.
function authorize() {
    window.location.replace("https://accounts.spotify.com/authorize?client_id=d4ea6ecd0c0d405b82714e9a7d4b4c63&redirect_uri=" + currentURL + "&scope=user-read-private%20user-read-email%20playlist-modify-public%20playlist-modify-private&response_type=token&state=123");
}

//retrieves the user's authorization token (only works if they've authrorized)
function getToken() {
    let url = window.location.href;
    url = url.substring(url.indexOf("#") + 14, url.indexOf("&"));
    console.log("returned access token: " + url);
    accessToken = url;
    $.ajax({
        url: 'https://api.spotify.com/v1/me',
        method: "GET",
        headers: {
            "Authorization": "Bearer " + accessToken
        }
    }).then(function (response) {
        console.log(response);
        userID = response.id;
        console.log("User ID retrieved as: " + userID);
    })
    
}

//adds the tracks in the trackIDs array to the playlist and puts it on the embedded web player
function addTracks(tracks) {
    let trackRequest = "";
    let added = 0;
    for (let track of tracks) {
        if (added < tracks.length) {
            trackRequest += "spotify:track:" + track + ",";
        }
        else if (added >= tracks.length) {
            trackRequest += "spotify:track:" + track;
        }
        added++;
    }

    $.ajax({
        url: "https://api.spotify.com/v1/playlists/" + playlistID + "/tracks?uris=" + trackRequest,
        method: "POST",
        headers: {
            "Authorization": "Bearer " + accessToken
        }
    }).then(function (response) {
        console.log(response);
        console.log("Playlist fully populated, pushing to page");
        $("#playlist").attr("src", "https://open.spotify.com/embed/playlist/" + playlistID);

    });

}

//creates a playlist on the user's spotify account, then callbacks to addtracks
function makePlaylist(callback) {
    $.ajax({
        url: "https://api.spotify.com/v1/users/" + userID + "/playlists",
        method: "POST",
        dataType: "json",
        contentType: "application/json",
        headers: {
            "Authorization": "Bearer " + accessToken
        },
        data: JSON.stringify({
            "name": "Musicify : " + artistName
        })
    }).then(function (response) {
        playlistID = response.id;
        console.log("created playlist at id: " + playlistID);
        callback(trackIDs);
    });
}

 