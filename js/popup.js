/************************************************
 *
 * Variables and executing code
 * author: xiaonan.jia
 * description:
 *
 ************************************************/
// background
const background = chrome.extension.getBackgroundPage();

// load content-script page
background.sendMessageToContentScript({cmd: "load"}, function (response) {
    if(typeof response === "object" && response.state) {
        const popup_html = response.html;
        $("#sandwich-popup-content").html(popup_html);
    }
});

// Properties depend
if($("#callback_req_method").val() === "GET") {
    $("#callback_req_content_type").val("application/x-www-form-urlencoded");
}

// Clean logs button
$("#btn-clean-log").click(function () {
    clean();
});

$("#callback_req_method").change(function () {
    if($(this).val() === "GET") {
        $("#callback_req_content_type").val("application/x-www-form-urlencoded");
        $("#callback_req_content_type").attr("disabled","");
        $("#callback_req_content_type").addClass("depend-disabled");
    } else {
        $("#callback_req_content_type").removeAttr("disabled");
        $("#callback_req_content_type").removeClass("depend-disabled");
    }
});

/**
 * Get current yyyy-MM-dd HH:mm:ss
 * @returns {string}
 */
function log_date() {
    function f_0(n) {
        return n < 10 ? "0" + n : n;
    }
    var now = new Date();
    return now.getFullYear() + "-"
        + f_0(now.getMonth() + 1) + "-"
        + f_0(now.getDate()) + " "
        + f_0(now.getHours()) + ":"
        + f_0(now.getMinutes()) + ":"
        + f_0(now.getSeconds());
}

/**
 * var/object to format string
 * @param o var/object
 * @param t initial indent, default 0
 * @returns {string}
 */
function toString(o, t){
    var tb = t === undefined ? 0 : parseInt(t);
    if(typeof o === "object") {
        tb += 4;
        var description = "{\n";
        for(var i in o){
            var property = o[i];
            description += " ".repeat(tb) + i + ": " + toString(property, tb) + ",\n";
        }
        return description.slice(0, -2) + "\n" + " ".repeat(t) + "}";
    } else if(typeof o === "string") {
        return '"' + o + '"';
    }
    return o;
}

/**
 * convert string to int
 * @param i val
 * @returns {string, number}
 */
function toIntOrString(i) {
    var regex = new RegExp("^\\s*[0-9]+\\s*$");
    if(regex.test(i)) {
        return parseInt(i);
    }
    return i;
}

/**
 *  Print a log with time
 * @param m log/message
 * @param c whether output in the system console, true/false
 */
function print_log(m, c) {
    var sc = false;
    var fm = "[" + log_date() + "] " + m;
    $("div.console-log").each(function () {
        // Automatically scrolls when the scroll bar is at the bottom
        if($(this).scrollTop() + $(this).outerHeight() >= $(this).prop("scrollHeight")) {
            sc = true;
        }
        $(this).append("<pres>" + fm + "</pres>")
        if (sc) {
            $(this).scrollTop($(this).prop("scrollHeight"));
        }
    });
    if(c === true) {
        console.log(fm);
    }
}

var change_until_option = {
    value: "",
    flag: false
};
/**
 * Calculate
 * @param v value
 * @param c comparator
 * @param t threshold
 * @return {boolean}
 */
function calculate(v,c,t) {
    if(c === "regexp") {
        var regexp = new RegExp(t + "");
        return regexp.test(v + "");
    } else if(c === "change until") {
        if(v + "" !== change_until_option.value) {
            if(new RegExp(t + "").test(v + "")) {
                change_until_option.flag = true;
            }
            return true;
        }
        return false;
    } else if(c === "between" || c === "not between") {
        var eval_prefix = c === "between" ? "" : "!";
        if(new RegExp("^[^,]+,[^,]+$").test(t)) {
            var res = t.split(",");
            var low = toIntOrString(res[0]);
            var high = toIntOrString(res[1]);
            if(low <= high) {
                return eval(eval_prefix + "(v >= low && v <= high)");
            }
        }
        print_log("[ERROR] Illegal closed interval [" + t + "]!");
        return false;
    } else {
        // Conventional symbols
        return eval("v " + c + " t");
    }
    return false;
}

/**
 * Process task
 * @param d parameter data
 */
function process(d) {
    var elem_val = "0";
    eval("elem_val = $(d.element)."+ d.source +"().trim();");
    elem_val = toIntOrString(elem_val);
    if(calculate(elem_val, d.compare, d.threshold)) {
        print_log("[T] C[" + elem_val + "] T[" + d.compare + "(" + d.threshold + ")] L[" + change_until_option.value + "]");
        if(d.enable === "enable") {
            var now_s = log_date();
            var rep_obj = {
                url: d.ajax.url,
                type: d.ajax.type,
                contentType: d.ajax.contentType,
                compare: d.compare,
                threshold: d.threshold,
                interval: d.interval,
                most: d.most,
                maximum: (d.most === 0 ? "&#8734;" : d.most),
                current: d.current,
                datetime: now_s,
                value: elem_val,
                lastValue: toIntOrString(change_until_option.value)
            };
            if(d.most === 0 || d.current <= d.most) {
                var ajax_params = d.ajax;
                ajax_params.data = build_data(d.ajax.data, rep_obj);
                console.log(toString(ajax_params));
                if(default_value.debug) {
                    print_log("[" + d.current + "/" + (d.most === 0 ? "&#8734;" : d.most) + "] Debugging... {" + ajax_params.data + "}, last value[" + change_until_option.value + "]", true);
                } else {
                    print_log("[" + d.current + "/" + (d.most === 0 ? "&#8734;" : d.most) + "] Request interface... {" + ajax_params.data + "}, last value[" + change_until_option.value + "]", true);
                    $.ajax(ajax_params);
                }
                d.current++;
            }
            if((d.most !== 0 && d.current > d.most) || change_until_option.flag) {
                if(change_until_option.flag) {
                    print_log("[STOP] The last value[" + elem_val +"] match the change until regexp[" + d.threshold + "], the process stops automatically.", true);
                } else {
                    print_log("[STOP] The maximum number of callbacks[" + d.most + "] has been reached, the process stops automatically.", true);
                }
                if($("#btn_process_run").attr("process-state") !== "stop") {
                    $("#btn_process_run").click();
                }
            }
        } else {
            print_log("[N/A] Alert disabled. Skipped.")
        }
    } else {
        print_log("[F] C[" + elem_val + "] T[" + d.compare + "(" + d.threshold + ")] L[" + change_until_option.value + "]");
    }
    change_until_option.value = elem_val + "";
    $(d.refresh)[0].click();
}

function build_data(s, d) {
    for(var k in d){
        var v = d[k];
        s = s.replace(new RegExp("\\{\\s*" + k + "\\s*}", "g"), v);
    }
    return s;
}

/**
 * Proxy method for 'process', convenient timing task passing parameter
 * @param p parameter
 * @return {Function}
 */
function process_proxy(p){
    return function(){
        process(p);
    }
}

// Interval instance
var interval_obj = undefined;
// Click for run
$("#btn_process_run").click(function () {
    if($(this).attr("process-state") === "stop") {
        $(this).html("Stop").attr("process-state","run").removeClass("console-btn-ok").addClass("console-btn-cancel");
        $(".form-control").attr("disabled","");
        $(".form-group label").attr("disabled","");
        if(interval_obj === undefined) {
            var inv = parseInt($("#data_interval").val());
            var req_data = $("#callback_req_data").val();
            var ajax_data = {
                url: $("#callback_interface").val(),
                type: $("#callback_req_method").val(),
                contentType: $("#callback_req_content_type").val(),
                data: req_data
            };
            if($("#data_alert_most").val() < 0) {
                $("#data_alert_most").val(0);
            }
            var p_data = {
                ajax: ajax_data,
                refresh: $("#data_ref_selector").val(),
                element: $("#data_elem_selector").val(),
                source: $("#data_elem_val_src").val(),
                compare: $("#data_elem_val_cmp").val(),
                threshold: toIntOrString($("#data_threshold_val").val()),
                enable: $("#data_alert_enable").val(),
                most: toIntOrString($("#data_alert_most").val()),
                interval: inv,
                current: 1
            };
            change_until_option.flag = false;
            change_until_option.value = "";
            interval_obj = window.setInterval(process_proxy(p_data), inv);
            print_log("Parameters:\n" + toString(p_data), true);
            print_log("Interval " + inv + " ms, monitoring...", true);
        }
    } else {
        $(this).html("Run").attr("process-state","stop").removeClass("console-btn-cancel").addClass("console-btn-ok");
        $('.form-control:not(.depend-disabled)').removeAttr("disabled");
        $('.form-group label:not(.depend-disabled)').removeAttr("disabled");
        if(interval_obj !== undefined) {
            window.clearInterval(interval_obj);
            interval_obj = undefined;
            print_log("Monitoring stopped.", true);
        }
    }
});

/**
 * Clean logs
 */
function clean() {
    $("#log_area").html("");
}