const SEARCH_URL = `http://api.are.na/v2/search/channels`;
let key = "";
let timeout = 0;
let searchDelay = 300;
let request = null;
let suggestions = [];

// Provide help text to the user.
browser.omnibox.setDefaultSuggestion({
  description: `Search for are.na channels (e.g. "arena influences").`,
});

let initialise = () => {
  // check if the settings is there
  const savedKey = browser.storage.sync.get("key");
  savedKey.then((item) => {
    if (item.key) {
      key = item.key;
    } else {
      console.error("no key found", item);
    }
  });
}

initialise();

let searchChannels = (text, addSuggestions) => {


  if (timeout) clearTimeout(timeout);

  timeout = setTimeout(() => {
    request = new Request(`${SEARCH_URL}?q=${text}`, {
      method: 'GET',
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${key}`
      }
    });

    fetch(request).then((response) => {

      if (!response.ok) {
        throw new Error("Nothing back from API");
      }

      return response.json();

    }).then((json) => {
      console.log(json);

      if (json.length == 0) {
        addSuggestions({
          content: `https://are.na/search/${text}`,
          description: `No results. Try searching on site for ${text}?`
        });
      }

      // Reset suggestions
      suggestions = [];

      json.channels.forEach((channel) => {
        suggestions.push({
          content: `https://are.na/${channel.user.slug}/${channel.slug}`,
          description: `${channel.title}`
        })
      })

      addSuggestions(suggestions);

      // })
    }).catch((error) => {
      console.error("Problem with fetch to are.na API:", error);
    })
  }, searchDelay)
}

browser.omnibox.onInputChanged.addListener(searchChannels);


// Open the page based on how the user clicks on a suggestion.
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
