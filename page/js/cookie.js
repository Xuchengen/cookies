(() => {
    // 监听消息
    window.addEventListener("message", (event) => {
        const handler = eventHandlers[event.data.action];
        if (handler) {
            handler(event);
        }
    });

    // 表格行右键菜单
    const ROW_MENU = $("#row-menu");

    // Cookie值复选框
    const VALUE_CHECKBOX = $("#value-checkbox");

    // Cookie值隐藏域
    const VALUE_INPUT = $("#value-input");

    // Cookie值展示框
    const MAIN_PRE = $("#main-pre");

    // 菜单
    const MAIN_MENU = $("#main-menu").tree({
        onSelect: (node) => {
            sendMsg({
                "action": "GetCookieByUrl", "data": node.attributes.url
            });
        },
        onLoadSuccess: (node, data) => {
            if (data && data.length) {
                $("#" + data[0].domId).trigger("click");
            }
        }
    });

    // 表格
    const MAIN_TABLE = $("#main-table").datagrid({
        fit: true,
        border: false,
        striped: true,
        nowrap: true,
        singleSelect: true,
        remoteSort: false,
        frozenColumns: [[{
            field: "name",
            sortable: true,
            sortOrder: "asc",
            title: "Name",
            width: "15%",
            halign: "center",
            align: "left",
            frozen: true
        }]],
        columns: [[{
            field: "value",
            sortable: true,
            sortOrder: "asc",
            title: "Value",
            width: "25%",
            halign: "center",
            align: "left"
        }, {
            field: "domain",
            sortable: true,
            sortOrder: "asc",
            title: "Domain",
            width: "15%",
            halign: "center",
            align: "left"
        }, {
            field: "x_expire",
            sortable: true,
            sortOrder: "asc",
            title: "Expires / Max-Age",
            width: "12%",
            halign: "center",
            align: "left"
        }, {
            field: "x_size",
            sortable: true,
            sortOrder: "asc",
            title: "Size",
            width: "5%",
            halign: "center",
            align: "right"
        }, {
            field: "httpOnly",
            sortable: true,
            sortOrder: "asc",
            title: "HttpOnly",
            width: "5%",
            halign: "center",
            align: "center",
            formatter: (value) => {
                return value ? "✓" : "";
            }
        }, {
            field: "secure",
            sortable: true,
            sortOrder: "asc",
            title: "Secure",
            width: "5%",
            halign: "center",
            align: "center",
            formatter: (value) => {
                return value ? "✓" : "";
            }
        }, {
            field: "sameSite",
            sortable: true,
            sortOrder: "asc",
            title: "SameSite",
            width: "10%",
            halign: "center",
            align: "left",
            formatter: (value) => {
                if (value === "no_restriction") {
                    return "None";
                } else if (value === "unspecified") {
                    return "";
                } else if (value === "lax") {
                    return "Lax";
                } else if (value === "strict") {
                    return "Strict";
                }
                return value;
            }
        }]],
        onRowContextMenu: (e, index, row) => {
            e.preventDefault();
            MAIN_TABLE.datagrid("selectRow", index);
            ROW_MENU.menu('show', {
                left: e.pageX,
                top: e.pageY
            });
        },
        onSelect: (index, row) => {
            VALUE_INPUT.val(row.value);
            if (VALUE_CHECKBOX.is(":checked")) {
                MAIN_PRE.html(decodeURIComponent(row.value));
            } else {
                MAIN_PRE.html(row.value);
            }
        }
    });

    VALUE_CHECKBOX.on("change", () => {
        let value = MAIN_PRE.html();
        if (VALUE_CHECKBOX.is(":checked")) {
            MAIN_PRE.html(decodeURIComponent(value));
        } else {
            MAIN_PRE.html(VALUE_INPUT.val());
        }
    });

    MAIN_PRE.on("dblclick", () => {
        selectText(MAIN_PRE.attr("id"));
    });

    $("#copy-value").on("click", () => {
        let node = MAIN_TABLE.datagrid("getSelected");
        if (node) {
            sendMsg({
                "action": "setClipboard",
                "data": node.value
            });
        }
    });

    $("#copy-row").on("click", () => {
        let node = MAIN_TABLE.datagrid("getSelected");
        if (node) {
            sendMsg({
                "action": "setClipboard",
                "data": JSON.stringify(node, null, 4)
            });
        }
    });

    $("#copy-table").on("click", () => {
        let node = MAIN_TABLE.datagrid("getData");
        if (node) {
            sendMsg({
                "action": "setClipboard",
                "data": JSON.stringify(node, null, 4)
            });
        }
    });

    /**
     * 事件处理器
     */
    const eventHandlers = {
        "GetCookieByUrl": (event) => {
            let data = event.data.data;
            if (data) {
                MAIN_TABLE.datagrid({
                    data: (() => {
                        $.each(data, (i, e) => {
                            e.x_size = (e.name + e.value).length;
                            e.x_expire = e.session ? "Session" : new Date(e.expirationDate * 1000).toISOString();
                        });
                        return data;
                    })()
                });
            }
        }, "GetTabs": (event) => {
            let data = event.data.data;
            if (data) {
                MAIN_MENU.tree({
                    data: (() => {
                        let items = [];
                        $.each(data, (i, e) => {
                            items.push({
                                id: e.id, text: e.title, attributes: {
                                    url: e.url,
                                }
                            });
                        });
                        return items;
                    })()
                });
            }
        }
    };

    sendMsg({
        "action": "GetTabs"
    });

    /**
     * 发送消息
     * @param msg 消息体
     */
    function sendMsg(msg) {
        if (msg && msg.action && msg.action.length) {
            window.parent.postMessage(msg, "*");
        }
    }

    /**
     * 选中文本
     * @param nodeId
     */
    function selectText(nodeId) {
        const node = document.getElementById(nodeId);
        if (document.body.createTextRange) {
            const range = document.body.createTextRange();
            range.moveToElementText(node);
            range.select();
        } else if (window.getSelection) {
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(node);
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
            console.warn("Could not select text in node: Unsupported browser.");
        }
    }
})();