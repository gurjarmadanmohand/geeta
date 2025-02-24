document.addEventListener("DOMContentLoaded", function () {
  // Get chapter number from URL query parameter
  let chapterNumber = new URLSearchParams(window.location.search).get("chapter");
  console.log("Selected Chapter:", chapterNumber);

  // Default language is English
  let currentLanguage = "english";
  const toggleCircle = document.getElementById("toggleCircle");
  const languageToggle = document.getElementById("languageToggle");

  // Global variable to store the index (0-based) of the currently selected verse.
  let currentVerseIndex = 0;

  // Global variables for speech functionality
  let currentUtterance = null;
  let isPaused = false;
  let currentPlayBtn = null;

  // Force load voices on page start
  window.speechSynthesis.onvoiceschanged = () => {
      console.log("Voices Loaded:", speechSynthesis.getVoices());
  };

  // Function to stop any ongoing speech and reset the play button
  function stopSpeech() {
    if (speechSynthesis.speaking || speechSynthesis.paused) {
      speechSynthesis.cancel();
      isPaused = false;
      if (currentPlayBtn) {
        currentPlayBtn.textContent = "Play";
      }
      currentUtterance = null;
    }
  }

  // Function to toggle speech (play/pause) for given text and update the button text.
  function toggleSpeech(text, lang, btn) {
    // If a different button is pressed, cancel any ongoing speech.
    if (currentPlayBtn && currentPlayBtn !== btn) {
      stopSpeech();
    }

    // If the same button is pressed and an utterance exists, toggle pause/resume.
    if (currentUtterance && currentPlayBtn === btn) {
      if (speechSynthesis.speaking && !isPaused) {
        speechSynthesis.pause();
        isPaused = true;
        btn.textContent = "Play";
        return;
      } else if (speechSynthesis.paused) {
        speechSynthesis.resume();
        isPaused = false;
        btn.textContent = "Pause";
        return;
      }
    }
    
    // Always cancel any previous speech before starting a new one.
    stopSpeech();

    // Create a new utterance.
    currentUtterance = new SpeechSynthesisUtterance(text);
    currentUtterance.lang = lang;
    currentUtterance.rate = 0.9;
    let voices = speechSynthesis.getVoices();
    if (lang === "hi-IN") {
      let hindiVoice = voices.find(voice => voice.lang.includes("hi"));
      if (hindiVoice) {
        currentUtterance.voice = hindiVoice;
      } else {
        console.warn("⚠️ No specific Hindi voice found, using default.");
      }
    } else if (lang === "en-US") {
      let englishVoice = voices.find(voice => voice.lang.includes("en"));
      if (englishVoice) {
        currentUtterance.voice = englishVoice;
      }
    }
    currentUtterance.onend = function () {
      isPaused = false;
      btn.textContent = "Play";
      currentUtterance = null;
      currentPlayBtn = null;
    };
    currentUtterance.onerror = function () {
      console.error("Speech synthesis error");
      btn.textContent = "Play";
    };

    speechSynthesis.speak(currentUtterance);
    btn.textContent = "Pause";
    currentPlayBtn = btn;
    isPaused = false;
  }

  // Function to load JSON data based on the current language.
  function loadData() {
    let datasetFile = currentLanguage === "english" ? "dataset_english.json" : "dataset_hindi.json";

    fetch(datasetFile)
      .then(response => response.json())
      .then(data => {
        console.log(`Loaded JSON Data (${currentLanguage}):`, data);

        let chapterData = data.chapters[chapterNumber];
        if (!chapterData) {
          console.error("❌ No chapter found for number:", chapterNumber);
          return;
        }
        document.getElementById("chapter-title").innerText =
          `Chapter ${chapterData.chapter_number}: ${chapterData.name}`;

        let versesData = data.verses[chapterNumber];
        if (!versesData) {
          console.error("❌ No verses found for chapter:", chapterNumber);
          return;
        }

        let versesArray = Object.keys(versesData)
          .sort((a, b) => Number(a) - Number(b))
          .map(vNum => versesData[vNum]);

        // References to display containers
        const verseTitleEl = document.getElementById("verse-title");
        const verseTextEl = document.getElementById("verse-text");
        const verseTranslationEl = document.getElementById("verse-translation");
        const verseListDesktop = document.getElementById("verse-list-container-desktop");
        const verseListMobile = document.getElementById("verse-list-mobile");
        const playVerseBtn = document.getElementById("play-verse");
        const playTranslationBtn = document.getElementById("play-translation");

        // Clear previous lists
        verseListDesktop.innerHTML = "";
        verseListMobile.innerHTML = "";

        // Cancel any ongoing speech when reloading data
        stopSpeech();

// ... (previous code remains the same until displayVerse)

function displayVerse(verse, index, btn) {
  stopSpeech();  // Cancel current speech when changing verses
  currentVerseIndex = index;
  verseTitleEl.innerHTML = `<b>Verse ${verse.verse_number}:</b>`;
  // Use <p> directly to match HTML structure and leverage CSS
  verseTextEl.innerHTML = verse.text;
  verseTranslationEl.innerHTML = `<p>${verse.meaning}</p>`;

  // Remove highlight from all verse items in desktop and mobile list.
  document.querySelectorAll(".verse-item").forEach(item => item.classList.remove("bg-orange-500", "text-white"));
  btn.classList.add("bg-orange-500", "text-white");

  // Update play buttons: play verse text in Hindi; play translation in en-US if language is English, else hi-IN.
  playVerseBtn.onclick = () => toggleSpeech(verse.text, "hi-IN", playVerseBtn);
  playTranslationBtn.onclick = () => toggleSpeech(verse.meaning, currentLanguage === "english" ? "en-US" : "hi-IN", playTranslationBtn);
}

// ... (rest of the code remains the same)

        // Populate desktop verse list
        versesArray.forEach((verse, index) => {
          let btn = document.createElement("div");
          btn.innerText = `Verse ${verse.verse_number}`;
          btn.classList.add(
            "verse-item", // so we can query for highlights later
            "cursor-pointer",
            "px-5",
            "py-4",
            "rounded-xl",
            "hover:bg-orange-400",
            "hover:text-white",
            "transition-all",
            "duration-300",
            "text-center",
            "shadow-lg",
            "border",
            "border-orange-300",
            "backdrop-blur-lg",
            "hover:scale-105"
          );
          btn.onclick = () => displayVerse(verse, index, btn);
          verseListDesktop.appendChild(btn);
        });

        // Populate mobile verse list (horizontal layout)
        versesArray.forEach((verse, index) => {
          let btn = document.createElement("div");
          btn.innerText = `V${verse.verse_number}`;
          btn.classList.add(
            "verse-item", // Added this class so mobile items are included in the highlight removal
            "cursor-pointer",
            "px-4",
            "py-3",
            "rounded-lg",
            "hover:bg-orange-400",
            "hover:text-white",
            "transition-all",
            "duration-300",
            "text-center",
            "shadow-md",
            "border",
            "border-orange-300",
            "backdrop-blur-lg",
            "hover:scale-105",
            "inline-block",
            "min-w-[60px]"
          );
          btn.onclick = () => displayVerse(verse, index, btn);
          verseListMobile.appendChild(btn);
        });
        

        // Display the first verse by default if none is selected
        if (versesArray.length > 0) {
          let mobileBtns = Array.from(verseListMobile.children);
          displayVerse(versesArray[currentVerseIndex], currentVerseIndex, mobileBtns[currentVerseIndex] || mobileBtns[0]);
          let desktopBtns = Array.from(verseListDesktop.children);
          displayVerse(versesArray[currentVerseIndex], currentVerseIndex, desktopBtns[currentVerseIndex] || desktopBtns[0]);
        }
      })
      .catch(error => console.error("❌ Error loading JSON:", error));
  }

  // Initial data load
  loadData();

  // Toggle language event listener with sliding animation
  languageToggle.addEventListener("click", function () {
    currentLanguage = currentLanguage === "english" ? "hindi" : "english";
    stopSpeech();
    toggleCircle.classList.toggle("translate-x-11");
    loadData();
  });

  // Reapply text constraints after load (from previous fix)
  const verseText = document.getElementById('verse-text');
  if (verseText) {
    function fixVerseOverflow() {
      verseText.style.wordBreak = 'break-all';
      verseText.style.overflowWrap = 'break-word';
      verseText.style.overflowX = 'hidden';
      verseText.style.maxWidth = '100%';
    }

    fixVerseOverflow();

    const observer = new MutationObserver(fixVerseOverflow);
    observer.observe(verseText, { childList: true, subtree: true });
    
    window.addEventListener('unload', () => observer.disconnect());
  }
});
