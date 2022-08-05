import common from "../../asset/lib/bg.common.js"

(() => {
    // 设置iframe宽高
    const iframe = document.getElementsByTagName("iframe")[0];
    iframe.width = window.innerWidth;
    iframe.height = window.innerHeight;

    window.addEventListener("resize", function () {
        iframe.width = window.innerWidth;
        iframe.height = window.innerHeight;
    });

    const eventHandlers = {
        "GetCookieByUrl": (event) => {
            common.getCookies(event.data.data).then((cookies) => {
                sendMsg({
                    "action": "GetCookieByUrl", "data": cookies
                });
            });
        }, "GetTabs": (event) => {
            chrome.tabs.query({
                url: ["http://*/*", "https://*/*"]
            }, (tabs) => {
                sendMsg({
                    "action": "GetTabs", "data": tabs
                });
            });
        }, "setClipboard": (event) => {
            navigator.clipboard.writeText(event.data.data).then((value) => {
            }).catch((reason) => {
            });
        }
    };

    // 监听消息
    window.addEventListener("message", (event) => {
        const handler = eventHandlers[event.data.action]
        if (handler) {
            handler(event);
        }
    });

    /**
     * 发送消息
     * @param msg 消息体
     */
    function sendMsg(msg) {
        if (msg && msg.action && msg.action.length) {
            iframe.contentWindow.postMessage(msg, "*");
        }
    }

})();
