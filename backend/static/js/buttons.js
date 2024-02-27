import { getCurrentLanguage, translations, notifyListeners } from "./appstate.js";
import appState from "./appstate.js";

function translate(key) {
    var currentLanguage = getCurrentLanguage();
    return translations[key][currentLanguage];
}

function closeButton(contentId) {
    let content = document.getElementById(contentId);
    if (!content) return;

    let closeButton = document.createElement("button");
    closeButton.textContent = "X";
    closeButton.style.cssText = "position: absolute; top: 0; right: 0; margin: 5px; padding: 5px; background-color: #f44336; color: white; border: none; cursor: pointer;";

    closeButton.addEventListener("click", function() {
        content.style.display = "none";
        window.location.reload();
    });

    content.appendChild(closeButton);
}

function closeAllMenus() {
    let contentIds = [
        "termsOfUseContent",
        "language_selector",
        "pongMenu",
        "pongSettings",
        "profileSettings",
        "tournamentContainer",
        "tournamentMatchContainer",
        "smallNavbar",
        "hangman_game_mode"
    ];

    contentIds.forEach(function(id) {
        let content = document.getElementById(id);
        if (content && content.style.display !== "none") {
            content.style.display = "none";
        }
    });
}

closeButton("termsOfUseContent");
closeButton("language_selector");
closeButton("pongMenu");
closeButton("profileSettings");
closeButton("tournamentContainer");
closeButton("tournamentMatchContainer");
closeButton("hangman_game_mode");
closeButton("tournamentView");

// terms of use
document.getElementById("termsOfUseButton").addEventListener("click", function() {
    closeAllMenus();
    let content = document.getElementById("termsOfUseContent");
    content.style.display = content.style.display === "none" ? "block" : "none";
    // if (content.style.display === "none")
    // {
    //     content.style.display = "block";
    //     // content.style.position = "absolute";
    // }
    // else {
    //     content.style.display = "none"
    // }

});
//end of terms of use

//button for scroll
window.onscroll = function() {scrollFunction()};

function scrollFunction() {
    var divContent = document.getElementById("termsOfUseContent");
}

function scrollToTop() {
    document.body.scrollTop = 0; /* For Safari */
    document.documentElement.scrollTop = 0; /* For Chrome, Firefox, IE, and Opera */
}
//end button for scroll

//language
document.getElementById("languageBtn").addEventListener("click", function() {
    closeAllMenus();
    let content = document.getElementById("language_selector");
    content.style.display = content.style.display === "none" ? "block" : "none";
});
//end of language

//pong buttons
document.getElementById("pongButns").addEventListener("click", function() {
    closeAllMenus();
    let content = document.getElementById("pongMenu");
    content.style.display = content.style.display === "none" ? "block" : "none";
    let content1 = document.getElementById("pongSettings");
    content1.style.display = content.style.display === "none" ? "block" : "none";
});

document.getElementById("pongButns").addEventListener("click", function() {
    let content = document.getElementById("pongSettings");
    content.style.display = content.style.display === "none" ? "block" : "none";
});
//end of pong buttons

//profileSettings
document.getElementById("profileSettingsBtn").addEventListener("click", function() {
    closeAllMenus();
    let content = document.getElementById("profileSettings");
    content.style.display = content.style.display === "none" ? "block" : "none";
});
//end of profile settings

//tournament
document.getElementById("playPongButtonTournament").addEventListener("click", function() {
    closeAllMenus();
    let content = document.getElementById("tournamentContainer");
    content.style.display = content.style.display === "none" ? "block" : "none";
    let content2 = document.getElementById("tournamentControls");
    content2.style.display = content2.style.display === "none" ? "block" : "none";
    let content1 = document.getElementById("tournamentMatchContainer");
    content1.style.display = content1.style.display === "none" ? "block" : "none";
});

document.getElementById("tournamentView").addEventListener("click", function() {
    let content = document.getElementById("tournamentView");
    content.style.display = content.style.display === "none" ? "block" : "none";
});
//end of tournament

// small menu
document.getElementById("menuBtn").addEventListener("click", function() {
    closeAllMenus();
    let content = document.getElementById("smallNavbar");
    content.style.display = content.style.display === "none" ? "block" : "none";
});
//end of small menu

//start of h_img
document.getElementById("hangmanBtn").addEventListener("click", function() {
    closeAllMenus();
    let content = document.getElementById("hangman_game_mode");
    content.style.display = content.style.display === "none" ? "block" : "none";
});
//end of h_img
