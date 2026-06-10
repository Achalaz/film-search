function search() {
    console.log("searching...");

    let movieName = document.getElementById("movie").value;
    console.log(movieName);

    let encodedMovie = encodeURIComponent(movieName);
    let url = "https://www.omdbapi.com/?t=" + encodedMovie + "&apikey=4ef17996";
    console.log(url);

    let http = new XMLHttpRequest();
    http.open("GET", url);
    http.responseType = "json";
    http.send();

    http.onload = function() {
        let data = http.response;
        console.log(data);

        if (data.Response === "False") {
            console.error("Error:", data.Error);
            document.getElementById("title").innerHTML = "Error: " + data.Error;
            document.getElementById("poster").src = "";
            document.getElementById("director").innerHTML = "";
            document.getElementById("plot").innerHTML = "";
            return;
        }

        // Title
        document.getElementById("title").innerHTML = data.Title || "No title";

        // Poster
        let posterUrl = (data.Poster && data.Poster !== "N/A") ? data.Poster : "";
        document.getElementById("poster").src = posterUrl;

        // Director
        document.getElementById("director").innerHTML = "Director: " + (data.Director || "Unknown");

        // ✅ Plot (added)
        document.getElementById("plot").innerHTML = "Plot: " + (data.Plot || "No plot available");
    };

    http.onerror = function() {
        console.error("Network request failed");
        document.getElementById("title").innerHTML = "Network error";
        document.getElementById("poster").src = "";
        document.getElementById("director").innerHTML = "";
        document.getElementById("plot").innerHTML = "";
    };
}