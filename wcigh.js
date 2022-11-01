    var dark;
    let matched = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if(matched) {
	    darkMode();
        dark = true; }
    else {
        lightMode();
        dark = false;
    }
    //Handles Toggling between Dark and Light Mode
    function toggle() {
        if (dark == true) {
            document.getElementById("darkMode").innerText = "DarkMode"
            lightMode();
        } else {
            document.getElementById("darkMode").innerText = "LightMode"
            darkMode();
        }
    }
    //Does the necessary switching of elements colors from Light to Dark
    function darkMode() {
      var element = document.body;
      document.getElementById("clockOut").style.color = "cyan";
      document.getElementById("webpage").style.color = "#82EC5A";
      document.getElementById("file").style.color =  "#82EC5A";
      element.className = "dark-mode";
      dark = true;
    }
    //Does the necessary switching of elements colors from Dark to Light
    function lightMode() {
      var element = document.body;
      document.getElementById("clockOut").style.color = "#008DFF";
      document.getElementById("webpage").style.color =  "#3A940E";
      document.getElementById("file").style.color =  "#3A940E";
      element.className = "light-mode";
      dark = false;
    }

    //initalizes the timer so it can be stopped an started each time 
    var timer;
    var totalSeconds;

    //the HTML elements that will be manipulated by this code
    var startTime = document.getElementById("startTime");
    var lunchStart = document.getElementById("lunchStart");
    var lunchEnd = document.getElementById("lunchEnd");
    var shiftTime = document.getElementById("shiftTime")
    var clockOutSpan = document.getElementById("clockOut");
    var timeRemaining = document.getElementById("timeRemaining");
    var noLunch = document.getElementById("noLunch");

    //Listerners for each of the inputs to change the code immediatly when new entries are given
    // window.addEventListener('keydown', function(e) {if(e.key == 'r') window.location.reload(); }, false);
    window.addEventListener('keydown', function(e) {if(e.key == 'r') logic(); }, false);
    startTime.addEventListener("input", function() { logic(); }, false);
    lunchStart.addEventListener("input", function() { if (lunchEnd.value == lunchStart.value) logic(); else { noLunch.checked = false; noLunchFunc(); logic(); }}, false);
    lunchEnd.addEventListener("input", function() { if (lunchEnd.value == lunchStart.value) logic(); else { noLunch.checked = false; noLunchFunc(); logic(); }}, false);
    shiftTime.addEventListener("input", function() { logic(); }, false);
    noLunch.addEventListener("input", function() { noLunchFunc(); logic();}, false);
    window.addEventListener('keydown', function(e) {if(e.key == 'n') noLunch.click(); noLunchFunc(); }, false);

    //Calls the two functions to modify the text on when they can clock out and time remaining
    function logic(){
        clearInterval(timer);
        totalSeconds = timeValue(startTime.value) + (timeValue(lunchEnd.value) - timeValue(lunchStart.value)) + (shiftTime.value * 3600);
        var time = timeString(totalSeconds);
        clockOutSpan.innerText = time;
        //gets the current time to compare to the total shift time
        let date = new Date();
        let now = currentTime();
         //clears the previous timer that's running to prepare a new one 
        (totalSeconds - now) > 0 ? timer = setInterval(function() {timeRemaining.innerText = remaining(totalSeconds - now); logic();}, 400) : timeRemaining.innerText = "0:00:00";
    }
    //Gets the current time from the client 
    function currentTime() {
        let date = new Date();
        return (date.getHours() * 3600) + (date.getMinutes() * 60) + date.getSeconds();
    }

    //Becasue we're dealing with 24 hours time and AM and PM times, convert all of it to seconds to also account for shiftlength * 3600
    function timeValue(time){
        var seconds = 0;
        for (let i = 0; i < time.length; i++) {
            //Since the strings are predictable, I don't need regex and can use pattern matching here to skip the locations with non-numbers
            if(time[i] == ":" || time[i] == "A" || time[i] == "P" || time[i] == "M"){ continue;}
            else if(i == 0){
                if(time[time.length - 2] == "P"){
                    //Handles adding the 10 hours if in PM format 
                    seconds += parseInt(time[i]) * 10 * 3600 * 12;
                }
                if(time[i + 1] == ":"){seconds += parseInt(time[i]) * 3600;}
                else {seconds += parseInt(time[i]) * 10 * 3600;}
            }
            else if(i == 1){
                seconds += parseInt(time[i]) * 3600;
            } 
            else if(i == 3){
                seconds += parseInt(time[i]) * 10 * 60;
            } 
            else {
                seconds += parseInt(time[i]) * 60;
            }
        }
        return seconds;
    }
    //Converts the time in seconds back to a string in format HH:MM(AM/PM)
    function timeString(time){
        var totalTime = time;
        hours =  Math.floor(totalTime / 3600);
        minutes = Math.floor(totalTime % 3600 / 60);
        minutes < 10 ? minutes = "0" + minutes.toString() : minutes = minutes.toString();

        if(hours == hours % 12){
            return hours.toString() + ":" + minutes+ "AM"; 
        }
        else {
            hours % 12 > 0 ? hours = hours % 12 : hours 
            return hours.toString() + ":" + minutes + "PM";
        }
    }

     //Converts the time in seconds back to a string in format HH:MM:SS for the countdown timer
     function remaining(time){
        var totalTime = time;
        hours =  Math.floor(totalTime / 3600);
        minutes = Math.floor(totalTime % 3600 / 60);
        minutes < 10 ? minutes = "0" + minutes.toString() : minutes = minutes.toString();
        new Date().getSeconds() > 0 ? seconds = 60 - new Date().getSeconds() : seconds = "0"
        seconds < 10 ? seconds = "0" + seconds.toString() : seconds = seconds.toString();

        
        if(hours == hours % 12){
            return hours.toString() + ":" + minutes + ":" + seconds; 
        }
        else {
            hours % 12 > 0 ? hours = hours % 12 : hours 
            return hours.toString() + ":" + minutes + ":" + seconds;
        }
    }

    //Calculates if the client can go home based on the current time and their clockout time 
    function goHome() {
            let date = new Date();
            let now = (date.getHours() * 3600) + (date.getMinutes() * 60);
            if((totalSeconds - now) < 60) {
            alert("Get the fuck out of here!");
        } else {
            alert("Sorry, you're stuck here");
        }
    }

    //If the user selects that they don't have a lunch, change the lunch times to be equal ie. no lunch taken
    function noLunchFunc(){
        if(noLunch.checked == true) {
            document.getElementById("lunchText").innerText = "No Lunch Today";
            lunchStart.value = "12:00";
            lunchEnd.value = "12:00";
        }
        else if(lunchEnd.value != lunchStart.value){
            document.getElementById("lunchText").innerText = "No Lunch Today?";
        }
        else {
            document.getElementById("lunchText").innerText = "No Lunch Today?";
            lunchStart.value = "12:00";
            lunchEnd.value = lunchStart.value + 30;
        }
    }

//This loads the time when the page first appears 
    const form = document.getElementById('form');
    form.onload = logic()
    document.onsubmit = submit
        function submit(event) {
        // This prevents the form from being submitted and the page reloading
        // Now when enter is pressed it will hit the "Can I Clock Out?" Button
        event.preventDefault();
        }