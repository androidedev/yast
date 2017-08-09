/**
 * @description Logs a message to extension status bar
 * @param {string} statusmessage - Status message to show
 */
function logStatus(statusmessage) {
    if (statusmessage != "")
        document.getElementById("statusBar").innerText = statusmessage;
    else
        document.getElementById("statusBar").innerText = "...";
    // if (statusmessage != "")
    //     console.log(statusmessage);
}


/**
 * @description Save all tabs from current window to localstorage
 * @param {string} statusmessage - Status message to show
 */
function saveSession(sessionname) {
    logStatus("");
    chrome.tabs.query({ "currentWindow": true }, function (arrayOfTabs) {
        var storageData = new Array();
        var len = arrayOfTabs.length;
        for (var index = 0; index < len; index++) {
            storageData.push({ index: arrayOfTabs[index].index, url: arrayOfTabs[index].url });
            var storageObject = {};
            storageObject[sessionname] = storageData;
            chrome.storage.local.set(storageObject, function () {
                if (chrome.runtime.lastError !== undefined)
                    logStatus("error saving : " + chrome.runtime.lastError);
                else {
                    init();
                    logStatus("saved: " + sessionname);
                }
            }
            );
        }
    });
}


/**
 * @description Deletes a session from storage
 * @param {string} sessionName The name of session to delete
 */
function deleteSession(sessionName) {
    chrome.storage.local.remove(sessionName, function () {
        if (chrome.runtime.lastError !== undefined) {
            logStatus("error deleting : " + chrome.runtime.lastError);
        } else {
            logStatus("deleted : " + sessionName);
            init();
        }
    });
}


/**
 * @description Clear the session list for DOM and loads all storaged sessions and populates the DOM with it
 */
function init() {
    logStatus("");
    chrome.storage.local.get(null, function (itemsinstorage) {
        if (chrome.runtime.lastError !== undefined) {
            logStatus("error initializing : " + chrome.runtime.lastError);
        } else {
            // delete current items
            var listcontainer = document.getElementById("listcontainer")
            while (listcontainer.hasChildNodes()) {
                listcontainer.removeChild(listcontainer.lastChild);
            }
            // load the storage ones
            var sessionCount = 0;
            for (var sessionName in itemsinstorage) {
                addSessionToList(sessionCount, sessionName, itemsinstorage[sessionName].length);
                sessionCount++;
            }
        }
    });
}


/**
 * @description Adds a new row to session list in DOM
 * @param {int} sessionIndex tab index
 * @param {string} sessionName the name that session has in local storage
 * @param {int} tabCount number of saved tabs in session
 */
function addSessionToList(sessionIndex, sessionName, tabCount) {
    var newRow = document.createElement("div");
    newRow.id = "r-" + sessionIndex;
    newRow.className = "dataRowClass rowBack";
    var newrn = document.createElement("div");
    newrn.id = "rn-" + sessionIndex;
    var sessionspan = document.createElement("span");
    sessionspan.className = "textNormal";
    sessionspan.innerText = sessionName;
    var sessiondata = document.createElement("span");
    sessiondata.className = "textSmall";
    sessiondata.innerText = " (" + tabCount + " tabs)";
    newrn.appendChild(sessionspan);
    newrn.appendChild(sessiondata);
    var newrb = document.createElement("div");
    newrb.id = "rb-" + sessionIndex;
    newrb.className = "dataRowClassB";
    // load button
    var btnLoad = document.createElement("button");
    btnLoad.className = "btn";
    btnLoad.value = sessionName;
    btnLoad.appendChild(document.createElement("span")).innerText = "Load";
    btnLoad.type = "button";
    btnLoad.addEventListener('click', function () {
        loadSession(btnLoad.value, false);
    });
    // load in new window
    var btnLoadWindow = document.createElement("button");
    btnLoadWindow.className = "btn";
    btnLoadWindow.value = sessionName;
    btnLoadWindow.appendChild(document.createElement("span")).innerText = "Load (new window)";
    btnLoadWindow.type = "button";
    btnLoadWindow.addEventListener('click', function () {
        loadSession(btnLoadWindow.value, true);
    });
    // delete button
    var btnDelete = document.createElement("button");
    btnDelete.className = "btn hlButton";
    btnDelete.value = sessionName;
    btnDelete.appendChild(document.createElement("span")).innerText = "Delete";
    btnDelete.type = "button";
    btnDelete.addEventListener('click', function () {
        deleteSession(btnDelete.value);
    });
    // save here button
    var btnSaveHere = document.createElement("button");
    btnSaveHere.className = "btn hlButton";
    btnSaveHere.value = sessionName;
    btnSaveHere.appendChild(document.createElement("span")).innerText = "Save open here";
    btnSaveHere.type = "button";
    btnSaveHere.addEventListener('click', function () {
        saveSession(btnSaveHere.value);
    });
    newrb.appendChild(btnLoad);
    newrb.appendChild(btnLoadWindow);
    newrb.appendChild(btnSaveHere);
    newrb.appendChild(btnDelete);
    newRow.appendChild(newrn);
    newRow.appendChild(newrb);
    var listcontainer = document.getElementById("listcontainer")
    listcontainer.appendChild(newRow);
}

/**
 * @description Open the urls of sessioname storage
 * @param {string} sessionname Session name to open
 * @param {bool} newwindow if true opens they in a new maximized window
 */
function loadSession(sessionname, newwindow) {
    logStatus("");
    itemsinstorage = undefined;
    chrome.storage.local.get(sessionname, function (itemsinstorage) {
        if (chrome.runtime.lastError !== undefined) {
            logStatus("error loading : " + chrome.runtime.lastError);
        } else {
            var sessionCount = 0;
            for (var sessionName in itemsinstorage) {
                if (newwindow) {
                    urlslist = new Array();
                    for (var inneritem in itemsinstorage[sessionName]) {
                        urlslist.push(itemsinstorage[sessionName][inneritem].url);
                    }
                    chrome.windows.create({ url: urlslist, state: "maximized" }, function (window) { /* ignore the callback (we could also pass null here) */ });
                } else {
                    for (var inneritem in itemsinstorage[sessionName]) {
                        chrome.tabs.create({ url: itemsinstorage[sessionName][inneritem].url }, function (tab) { /* ignore the callback (we could also pass null here) */ });
                    }
                }
            }
        }
    });

    if (itemsinstorage == undefined) {
        logStatus("session not found : " + sessionname);
    }
}


/**
 * @description This is the loader, works adding a event listener to the DOM of popup.html
 */
document.addEventListener('DOMContentLoaded', function () {

    // Adds a OnClick event listener to btnSaveSession button (chrome extensions policy doesn't allow to inline javascript)
    var btnSave = document.getElementById('btnSaveSession');
    btnSave.addEventListener('click', function () {
        var sessionname = document.getElementById("inputSessionSaveName").value;
        if (sessionname != "")
            saveSession(sessionname);
        else
            logStatus("Please enter a session name to save");
    });

    //  Adds a OnClick event listener to btnLoadSession button (chrome extensions policy doesn't allow to inline javascript)
    var btnLoad = document.getElementById('btnLoadSession');
    btnLoad.addEventListener('click', function () {
        var sessionname = document.getElementById("inputSessionSaveName").value;
        if (sessionname != "") {
            loadSession(sessionname);
        } else {
            logStatus("Please enter a session name to load");
        }
    });

    // Calls init() to populate list
    init();
});
