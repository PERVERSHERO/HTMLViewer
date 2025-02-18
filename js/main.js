$(function () {
    try {
        const VERSION = "4.0.0.3";
        /************** 変更可能パラメータ **********/
        // コメントの最大表示数
        const DISPLAY_COMMENT = 3;
        // コメントの表示加速度(1秒以内にコメントが連続するとこの値だけ加速)
        // ※一秒以内にコメントが到着しないと速度はMIN_COMMENT_DURATIONまで戻る
        const COMMENT_ACCELERATION = 100;
        // コメントの最遅速度(初速)
        const MIN_COMMENT_DURATION = 200;
        // コメントの最速速度(最高速)
        const MAX_COMMENT_DURATION = 50;
        // コメントが追加された時に既存のコメントが上がる速度
        const COMMENT_UP_DURATION = 10;
        // 表示されたコメントが削除されるまでの時間(msec)
        // 0を指定することで自動でコメントが消えなくなります
        const DELETE_COMMENT_TIME = 0;
        // 表示されたコメントが消える場合に右に戻る速度
        const DELETE_COMMENT_DURATION = 300;
        // Sytem用のコメントです(広告とか放送閉じるとか(ニコ生))
        const IS_SHOW_SYSTEM_COMMENT = true;
        // 投稿者のコメントの表示
        const IS_SHOW_NAME = false;



        /******************************************/
        // 時間情報のDataKey
        const DATA_ADD_TIME_KEY = "ADD_TIME_KEY";

        const FIRST_ANIMATION = "FIRST_ANIMATION";
        const TYPE_SYSTEM_COMMENT = 1;

        // コメント格納用変数
        let message_box = $('#message_box');

        let STAMP_DATA = {};

        // コメント格納用配列
        let comment_array = new Array();
        let comment_add_time = new Date().getTime();
        let duration = MIN_COMMENT_DURATION;

        function deleteComment(delete_time) {
            if (delete_time <= 0) {
                return;
            }
            setInterval(function () {
                $.each(comment_array,
                    function (index, elem) {
                        let add_time = $.data(elem, DATA_ADD_TIME_KEY);
                        let now = new Date();
                        if (add_time + delete_time < now.getTime()) {
                            elem.velocity("finish").velocity({
                                translateX: ['100%']
                            }, {
                                    duration: DELETE_COMMENT_DURATION,
                                    queue: false,
                                    complete: function () {
                                        let delete_array = $.inArray(elem, comment_array)
                                        for (let i = 0; i <= delete_array; i++) {
                                            comment_array.shift().remove();
                                        }
                                    }
                                });
                            return false;
                        }
                    }
                );
            }, 500);
        }
        // コメントアニメーション計算処理
        function calcDuration(now_time) {
            let diff = now_time - comment_add_time;
            if (diff < 1500) {
                if (MAX_COMMENT_DURATION < duration) {
                    duration -= COMMENT_ACCELERATION;
                }
            } else {
                duration = MIN_COMMENT_DURATION;
            }
            comment_add_time = now_time;
            return duration;
        }

        function workCustomStamp(json_data) {
            if (STAMP_DATA[json_data.comment]) {
                let list = new Array();
                let image_obj = new Object();
                image_obj["start"] = 0;
                image_obj["end"] = 0;
                image_obj["url"] = STAMP_DATA[json_data.comment];
                json_data.comment = "";
                list.push(image_obj);
                json_data.stamp_data_list = list;
            }
        }
        function addComment(json_data, complete_function) {
            workCustomStamp(json_data);
            let name = json_data.user_data.name;
            let comment = json_data.comment;
            if (comment == null || 0 == comment.length) {
                comment = "　";
            }
            let provider = json_data.index;
            switch (SHOW_INFO) {
                case INFO_INDEX:
                    provider = json_data.index;
                    break;
                case INFO_STREAM_NAME:
                    provider = json_data.stream_data.stream_name;
                    break;
                case INFO_SERVICE_NAME:
                default:
                    provider = json_data.stream_data.service_name;
                    break;
            }
            let type = json_data.type;
            let stamp_data_list = json_data.stamp_data_list;
            createComment(name, comment, provider, type, stamp_data_list, complete_function);
        }
        // コメント追加用関数
        function createComment(name, comment, provider, type, stamp_data_list, complete_function) {
            let message = $('<p />', {
                css: {
                    left: '110%'
                }
            }).addClass('comment');
            if (IS_SHOW_SYSTEM_COMMENT && type == TYPE_SYSTEM_COMMENT) {
                message.addClass("system_comment");
            } else {
                message.addClass("white_text");
            }

            let provider_elemet = $("<span></span>").addClass("white_provider_text");
            provider_elemet.text(provider);
            if (stamp_data_list && 0 < stamp_data_list.length) {
                stamp_data_list.sort(function (a, b) {
                    return b.start - a.start;
                });
                let comment_element_array = new Array();
                let image_obj_array = new Array();
                let image_src_array = new Array();
                jQuery.each(stamp_data_list, function () {
                    let front = comment.substring(0, this.start);
                    let back = comment.slice(this.end + 1);
                    let image_elemet = $("<img/>").addClass("stamp");

                    image_obj_array.push(image_elemet);
                    image_src_array.push(this.url.replace("https", "http"));

                    // image_elemet.css("height","");
                    let back_element = $("<span></span>").text(back);
                    comment_element_array.unshift(back_element);
                    comment_element_array.unshift(image_elemet);
                    comment = front;
                });
                if (IS_SHOW_NAME) {
                    message.append($("<span></span>").text(name + ":" + comment));
                } else {
                    message.append($("<span></span>").text(comment));
                }

                jQuery.each(comment_element_array, function () {
                    message.append(this);
                });
                message.append(provider_elemet);

                let load_count = image_obj_array.length;
                for (let i = 0; i < image_obj_array.length; i++) {
                    let image_elemet = image_obj_array[i]
                    image_elemet.bind('load', function () {
                        load_count = load_count - 1;
                        if (load_count == 0) {
                            workComment(message, complete_function);
                        }
                    });
                    image_elemet.attr("src", image_src_array[i]);
                }
            } else {
                if (IS_SHOW_NAME) {
                    message.text(name + ":" + comment);
                } else {
                    message.text(comment);
                }
                message.append(provider_elemet);
                workComment(message, complete_function);
            }
        }
        function workComment(message, complete_function) {
            let now_time = new Date().getTime();
            //時刻の設定
            $.data(message, DATA_ADD_TIME_KEY, now_time);

            let comments = message_box.children();
            if (DISPLAY_COMMENT <= comments.length) {
                let delete_obj = comment_array.shift();
                if (delete_obj) {
                    delete_obj.hide();
                    delete_obj.remove();
                }
            }
            message.appendTo(message_box);
            // 新規コメントを左に移動
            message.velocity({
                translateX: ['-109%']
            }, {
                    duration: calcDuration(now_time),
                    queue: FIRST_ANIMATION,
                    complete: complete_function
                });

            if (0 < comment_array.length) {
                //コメントを上に移動 
                let move_up = message.outerHeight(true);
                let count = comment_array.length;
                $.each(comment_array,
                    function (index, elem) {
                        //elem.velocity("finish");
                        elem.velocity({
                            translateY: '-=' + move_up
                        }, {
                                queue: false,
                                duration: COMMENT_UP_DURATION,
                                easing: [0.55, 0.085, 0.68, 0.53],
                                complete: function (elements) {
                                    count = count - 1;
                                    if (count == 0) {
                                        message.dequeue(FIRST_ANIMATION);
                                        comment_array.push(message);
                                    }
                                }
                            });
                    }
                );
            } else {
                message.dequeue(FIRST_ANIMATION);
                comment_array.push(message);
            }
        }

        // コメント追加用関数

        function init() {
            const obj = new Object();
            obj["user_data"] = { name: "kui", user_id: "" };
            obj["comment"] = "Hello　MCV(^^)/" + VERSION;
            const stream_data = { stream_name: "", service_name: "" };
            obj["stream_data"] = stream_data;
            pushComment(obj);
        }

        deleteComment(DELETE_COMMENT_TIME);
        init();

        let url = location.href;
        params = url.split("?");
        if (1 < params.length) {
            mode = params[1].split("&");
            mode = mode[0].split("=");
            if (1 < mode.length && mode[0] == "mode" && mode[1] == "debug") {
                IS_DEBUG = true;
            }
        }
        // if (IS_DEBUG) {
        //     showTest();
        // } else {
        //     // 接続
        //     open();
        // }
        StartComment(addComment);
        StartReceiveComment();

    }
    catch (e) {
        alert(e);
    }
});
