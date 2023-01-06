function saveOptions(e) {
	e.preventDefault();
	browser.storage.sync.set({
		key: document.querySelector("#key").value
	});
}

function restoreOptions() {

	function setCurrentChoice(result) {
		document.querySelector("#key").value = result.key || "123";
	}

	function onError(error) {
		console.log(`Error: ${error}`);
	}

	let getting = browser.storage.sync.get("key");
	getting.then(setCurrentChoice, onError);

	
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);

