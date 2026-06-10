function search() {
    console.log("searching...");

    let movieName = document.getElementById("movie").value;
    console.log(movieName);

    
    let url = "https://www.omdbapi.com/?t=" + movieName + "&apikey=4ef17996";
    console.log(url);

    let http = new XMLHttpRequest();
    http.open("GET", url);
    http.responseType = "json";
    http.send();

    http.onload = function() {
        let data = http.response;
        console.log(data);

    };
}