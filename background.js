const SEARCH_URL = `http://api.are.na/v2/search/channels`;

// Provide help text to the user.
browser.omnibox.setDefaultSuggestion({
  description: `Search your are.na channels
    (e.g. "my first channel")`
});

// Update the suggestions whenever the input is changed.
browser.omnibox.onInputChanged.addListener((text, addSuggestions) => {
  console.log(`Receiving input: ${text}`);

  let headers = new Headers({ "Accept": "application/json" });
  let init = { method: 'GET', headers };
  let request = new Request(`${SEARCH_URL}?q=${text}`, init);


  let suggestions = [];
  let suggestionsOnEmptyResults = [{
    content: SEARCH_URL,
    description: "no results found"
  }];

  fetch(request).then((response) => {
    response.json().then((json) => {

      console.log(json);

      json.channels.forEach((channel) => {
        suggestions.push({
          content: `https://are.na/${channel.user.slug}/${channel.slug}`,
          description: `${channel.title}`
        })
      })

      addSuggestions(suggestions);

    })

  })


});

// Open the page based on how the user clicks on a suggestion.
browser.omnibox.onInputEntered.addListener((text, disposition) => {
  let url = text;
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
});
