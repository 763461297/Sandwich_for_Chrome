/************************************************
 *
 * Variables and executing code
 * author: xiaonan.jia
 * description:
 *
 ************************************************/
const background = chrome.extension.getBackgroundPage();

// load options
background.loadLocalOption(function (options) {
    importData(options);
});


/************************************************
 *
 * Event Registry
 * author: xiaonan.jia
 * description:
 *
 ************************************************/

// Component availability correlation
$("#sandwich-form-method").change(function () {
    if($(this).val() === "GET") {
        $("#sandwich-form-contentType").val("application/x-www-form-urlencoded");
        $("#sandwich-form-contentType").attr("disabled","");
    } else {
        $("#sandwich-form-contentType").removeAttr("disabled");
    }
});

// load default
$("#btn-option-default").click(function () {
    importData(background.getDefaultOptions());
    return false;
});

// save options
$("#btn-option-save").click(function () {
    const options = exportData();
    background.saveLocalOption(options, function (message) {
        chrome.notifications.create(null, {
            type: 'basic',
            iconUrl: 'img/icon_48.png',
            title: 'Options',
            message: message
        }, function (id) {
            setTimeout(function(){
                chrome.notifications.clear(id);
            }, 3000);
        });
    });
    return false;
});

/************************************************
 *
 * Function Declarations
 * Author: xiaonan.jia
 * description:
 *
 ************************************************/

/**
 * import data to options page
 * @param options
 */
function importData(options) {
    // Initialize
    for(let key in options){
        let value = options[key];
        $("#sandwich-form-" + key).val(value);
    }
    console.log("Options value load done.");
}

/**
 * export data from options page
 */
function exportData() {
    let options = {};
    for(let key in background.getDefaultOptions()){
        let value = $("#sandwich-form-" + key).val();
        options[key] = background.toIntOrString(value);
    }
    options.firstRun = false;
    return options;
}

