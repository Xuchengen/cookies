import common from "./asset/lib/bg.common.js"

const TAB_COOKIE_COUNT = [];
const NOTIFY_KEY = "COOKIE:NOTIFY:1";

// 右键菜单项单击时触发该事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
    // 打开Cookie控制窗口
});

// 快捷键命中时触发该事件
chrome.commands.onCommand.addListener((command) => {
    if (command === "cookie-dialog") {
        common.getCurrentTab().then((tab) => {
            if (tab) {
                // 打开Cookie控制窗口
                chrome.tabs.create({
                    url: chrome.runtime.getURL("/page/main.html")
                }, null);
            }
        });
    } else if (command === "inject-script") {
        // TODO K按键
    }
});

// Tab页完成加载后触发该事件
chrome.webNavigation.onCompleted.addListener((details) => {
    if (details.frameId === 0) {
        chrome.storage.sync.get(NOTIFY_KEY, (item) => {
            let value = item[NOTIFY_KEY];
            if (value && value.expire > new Date().getTime()) {
                return false;
            }
            // 发送通知
            chrome.notifications.create(NOTIFY_KEY, {
                type: "basic",
                title: "友情提示",
                message: "使用快捷键[Ctrl+Shift+L]即可浏览当前网站Cookie。",
                iconUrl: "/asset/logo/logo-128.png",
                buttons: [{
                    title: "我知道了",
                    iconUrl: "/asset/logo/logo-16.png"
                }]
            });
        });
    }
});

// tab激活时触发该事件
chrome.tabs.onActivated.addListener((tabId, changeInfo, tab) => {
    updateBadgeText();
});

// tab更新时触发该事件
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    updateBadgeText();
});

// 通知按钮单击时触发该事件
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
    if (notificationId === NOTIFY_KEY && buttonIndex === 0) {
        chrome.storage.sync.set({
            "COOKIE:NOTIFY:1": {
                "expire": new Date().getTime() + (30 * 86400000)
            }
        }, null);
        chrome.notifications.clear(notificationId);
    }
});

// action被单击时触发该事件
chrome.action.onClicked.addListener(() => {
    common.getCurrentTab().then((tab) => {
        if (tab) {
            // 打开Cookie控制窗口
        }
    });
});

// 浏览器启动时触发该事件
chrome.runtime.onStartup.addListener(() => {
    updateActionTitle();
});

// 扩展安装或更新时触发该事件
chrome.runtime.onInstalled.addListener(() => {
    // 创建右键菜单
    chrome.contextMenus.create({
        id: "CK001",
        type: "normal",
        title: "Cookie助手",
        documentUrlPatterns: ["http://*/*", "https://*/*"]
    });
    updateActionTitle();
});

/**
 * <b>更新Action标题</b>
 */
function updateActionTitle() {
    // 修改action按钮标题
    common.getShortKey().then((shortKey) => {
        chrome.action.setTitle({
            title: (() => {
                return "Cookie助手\n快捷键[" + shortKey + "]";
            })()
        }, null);
    });
}

/**
 * <b>更新徽章文本</b>
 */
function updateBadgeText() {

    function setBadgeTest(params) {
        chrome.action.setBadgeText({
            tabId: params.tabId,
            text: params.count + ""
        }, null);
    }

    // 更新action徽章文本
    common.getCurrentTab().then((tab) => {
        if (!tab || (tab && tab.url.length <= 0)) {
            return
        }
        let hostname = new URL(tab.url).hostname;
        let tcc = TAB_COOKIE_COUNT[hostname];
        if (tcc && tcc.expir > new Date().getTime()) {
            setBadgeTest({"tabId": tab.id, "count": tcc.count});
        } else {
            common.getCookies(tab.url).then((cookies) => {
                TAB_COOKIE_COUNT[hostname] = {
                    "expir": new Date().getTime() + (15 * 1000 * 60),
                    "count": cookies.length
                }
                setBadgeTest({"tabId": tab.id, "count": cookies.length});
            });
        }
    });
}

