const SEARCH_URL = `http://api.are.na/v2/search/channels`;
let key = "";
let timeout = null;
// The delay in milliseconds between when the user stops typing and when the
// search is performed.
let searchDelay = 500; // 500ms = 0.5s
let request = null;
let suggestions = [];
const controller = new AbortController();
const signal = controller.signal;

// Provide help text to the user.
browser.omnibox.setDefaultSuggestion({
  description: `Search your are.na channels by name.`,
});

let initialise = () => {
  // check if the settings is there
  const savedKey = browser.storage.sync.get("key");
  savedKey.then((item) => {
    if (item.key) {
      key = item.key;
    } else {
      console.error("no key found", item);
      // Add a suggestion that navigates to the options page.
      browser.omnibox.setDefaultSuggestion({
        description: `Please set your are.na API key in the options page.`
      });

      browser.omnibox.onInputEntered.addListener((text, disposition) => {
        browser.runtime.openOptionsPage();
      }

      );
    }
  });
}

initialise();


/**
 * Search for channels on are.na
 * @param {string} text - The text to search for.
 * @param {function} addSuggestions - A callback function to call with the
 *                                   results.
 */
let searchChannels = (text, addSuggestions) => {

  // Clear the timeout if it has already been set.
  if (timeout) clearTimeout(timeout);

  // Check if the request is old and abort it if it is.
  // if (request) {
  //   controller.abort();
  // }

  // Set the default suggestion to show in progress.
  browser.omnibox.setDefaultSuggestion({
    description: `Searching for ${text}...`
  });


  // Set a timeout to wait for the user to finish typing.
  // This is to prevent the API from being called on every keystroke.
  // The timeout is reset on every keystroke.
  timeout = setTimeout(() => {

    console.log(`Searching with ${SEARCH_URL}?q=${text}`);

    // Create a new request.
    request = new Request(`${SEARCH_URL}?q=${text}`, {
      method: 'GET',
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${key}`
      },
      signal: signal
    });

    // Fetch the results and add the response to the omnibox.
    fetch(request).then((response) => {

      if (!response.ok) {

        // Show the user that the API returned an error.
        addSuggestions({
          content: `https://are.na/search/${text}`,
          description: `Error: ${response.status} ${response.statusText}`
        });

        throw new Error("Nothing back from API");
      }

      return response.json();

    }).then((json) => {

      // Use console.group to log all the channel titles and user slugs
      // in a collapsible group.
      console.groupCollapsed("Channels");
      json.channels.forEach((channel) => {
        console.log(`${channel.title} by ${channel.user.slug}`);
      })
      console.groupEnd();
          

      // If there are no results, show a suggestion to search on the site.
      if (json.channels.length == 0 || json == undefined) {
        addSuggestions({
          content: `https://are.na/search/${text}`,
          description: `No results. Try searching on site for ${text}?`
        });
      }

      // Reset suggestions
      suggestions = [];

      // Add a suggestion for each result.
      // The content of the suggestion is the URL that will be opened
      // json.channels.forEach((channel) => {
      //   suggestions.push({
      //     content: `https://are.na/${channel.user.slug}/${channel.slug}`,
      //     description: `${channel.title}`
      //   })
      // })

      // Add up to six suggestions from the json channels result
      for (let i = 0; i < 6; i++) {
        if (json.channels[i]) {
          suggestions.push({
            content: `https://are.na/${json.channels[i].user.slug}/${json.channels[i].slug}`,
            description: `${json.channels[i].title}`
          })
        }
      } 

      // Add the suggestions to the omnibox.
      console.log("Adding suggestions", suggestions);      
      addSuggestions(suggestions);

    }).catch((error) => {
      console.error("Problem with fetch to are.na API:", error);

      // Show the user that the API returned an error.
      addSuggestions({
        content: `https://are.na/search/${text}`,
        description: `Error: ${error}`
      });
    })

    // Clear the timeout.
    timeout = 0;
  }, searchDelay)
}

// Listen for changes to the user's input.
// When the user types a new character, the onInputChanged event is fired.
// The callback function is called with the user's input.
browser.omnibox.onInputChanged.addListener(searchChannels);


// Open the page based on how the user clicks on a suggestion.
// If the user clicks on the suggestion with the mouse, disposition will be
// "currentTab". If the user uses the keyboard to select the suggestion and
// then presses Enter, disposition will be "newForegroundTab".
browser.omnibox.onInputEntered.addListener((text, disposition) => {
  let url = text;

  if (!text.startsWith("https://are.na/")) {
    // Update the URL if the user clicks on the default suggestion.
    url = `https://are.na/search/${text}`;
  } else {
    switch (disposition) {
      case "currentTab":
        browser.tabs.update({ url });
        break;
      case "newForegroundTab":
        browser.tabs.create({ url });
        break;
      case "newBackgroundTab":
        browser.tabs.create({ url, active: false });
        break;
    }
  }

});
