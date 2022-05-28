const SEARCH_URL = `http://api.are.na/v2/search/channels`;

// Provide help text to the user.
browser.omnibox.setDefaultSuggestion({
  description: `Search are.na channels
    (e.g. "my first channel")`
});

let timeout = 0;
let searchDelay = 200;

let searchChannels = (text, addSuggestions) => {
  if (timeout) clearTimeout(timeout);

  timeout = setTimeout(() => {
    let headers = new Headers({ "Accept": "application/json" });
    let init = { method: 'GET', headers };
    let request = new Request(`${SEARCH_URL}?q=${text}`, init);


    let suggestions = [];
    let suggestionsOnEmptyResults = [{
      content: "https://are.na",
      description: "No channels found"
    }];

    fetch(request).then((response) => {
      response.json().then((json) => {

        console.log(json);

        if (!json.length) {
          addSuggestions(suggestionsOnEmptyResults);
        }

        json.channels.forEach((channel) => {
          suggestions.push({
            content: `https://are.na/${channel.user.slug}/${channel.slug}`,
            description: `${channel.title}`
          })
        })

        addSuggestions(suggestions);

      })
    })
  }, searchDelay)

  addSuggestions();
}

browser.omnibox.onInputChanged.addListener(searchChannels);



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
