/************************************************
 *
 * Variables and executing code
 * author: xiaonan.jia
 * description:
 *
 ************************************************/
// only this file visible
const default_value = {
    callback: "",
    method: "POST",
    contentType: "application/x-www-form-urlencoded",
    data: "Current value [{value}], last value [{lastValue}], threshold [{compare}{threshold}], triggered by [{datetime}].",
    refresh: "#btn-refresh",
    interval: 3000,
    source: "#data-area",
    capture: "html",
    compare: ">=",
    threshold: 1000,
    most: 0,
    enable: "enable",
    firstRun: true
};

// load user options value
loadLocalOption(function (option) {
    // check first
    if(option.firstRun) {
        console.log("First run. Load default options.");
        option.firstRun = false;
        // save option (when first run)
        saveLocalOption(option);
    } else {
        console.log("User option load ok.");
    }
});

/************************************************
 *
 * Event Registry
 * author: xiaonan.jia
 * description:
 *
 ************************************************/

// Message listener
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log("[background] received message: " + JSON.stringify(request));
    if(request.cmd === "init") {
        sendResponse({
            html: $("#init-html").html()
        });
    } else if(request.cmd === "load-options") {
        loadLocalOption(function (options) {
            sendResponse({
                options: options
            });
        });
    }
    return true;
});



/************************************************
 *
 * Function Declarations
 * Author: xiaonan.jia
 * description:
 *
 ************************************************/

/**
 * Load local option values
 * @param callback
 */
function loadLocalOption(callback) {
    chrome.storage.sync.get({
        callback: default_value.callback,
        method: default_value.method,
        contentType: default_value.contentType,
        data: default_value.data,
        refresh: default_value.refresh,
        interval: default_value.interval,
        source: default_value.source,
        capture: default_value.capture,
        compare: default_value.compare,
        threshold: default_value.threshold,
        most: default_value.most,
        enable: default_value.enable,
        firstRun: default_value.firstRun
    }, function(items) {
        if(typeof callback === "function") {
            callback(items);
        }
    });
}

/**
 * Save options for given
 * @param options save options
 * @param callback
 */
function saveLocalOption(options, callback) {
    options.firstRun = false;
    chrome.storage.sync.set(options, function() {
        const msg = "Options saved success.";
        console.log(msg);
        if(typeof callback === "function") {
            callback(msg);
        }
    });
}

/**
 * Get Current Tab ID
 * @param callback
 */
function getCurrentTabId(callback) {
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function(tabs) {
        if(callback) {
            callback(tabs.length ? tabs[0].id: null);
        }
    });
}

/**
 * Send message to current active content-script
 * @param message
 * @param callback
 */
function sendMessageToContentScript(message, callback) {
    chrome.tabs.query({
        active: true,
        currentWindow: true,
        status: "complete",
        url: [
            "http://*/*",
            "https://*/*"
        ]
    }, function(tabs) {
        if(typeof tabs === "undefined" || tabs.length === 0) {
            if(typeof callback === "function") {
                callback({state:false});
            }
        } else {
            chrome.tabs.sendMessage(tabs[0].id, message, function(response) {
                if(typeof callback === "function") {
                    callback(response);
                }
            });
        }
    });
}

/**
 * convert string to int
 * @param i val
 * @returns {string, number}
 */
function toIntOrString(i) {
    const regex = new RegExp("^\\s*[0-9]+\\s*$");
    if(regex.test(i)) {
        return parseInt(i);
    }
    return i;
}

/**
 * Get default value
 * @returns {{callback: string, method: string, contentType: string, data: string, refresh: string, interval: number, source: string, capture: string, compare: string, threshold: number, most: number, enable: string, firstRun: boolean}}
 */
function getDefaultOptions() {
    return default_value;
}
