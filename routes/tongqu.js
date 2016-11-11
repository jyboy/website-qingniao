var express = require('express');
var router = express.Router();
var http = require('http');
var moment = require('moment');
var fs = require('fs');
var async = require('async');
var schedule = require('node-schedule');
var shttp = require('socks5-http-client');
var url = require('url');
var variables = require('../variables.js');

var updateTime = "";
var popularActivities = [];
var homeUrl = "http://www.tongqu.me";
var publicUrl = "http://www.tongqu.me/act/";

var keyIndex = variables.keyIndex;
var increaseViewsIndex = variables.increaseViewsIndex;

var consoleInfos = [];
var consoleInfosBackup = [];

fs.readFile('consoleInfo.json', function(err, data) {
    if (err) {
        return console.error(err);
    }
    consoleInfosBackup = JSON.parse(data.toString());
    consoleInfos = JSON.parse(data.toString());
    clearTrialBlacklist();
});

var rule = new schedule.RecurrenceRule();
rule.minute = 0;
schedule.scheduleJob(rule, function() {
    clearTrialBlacklist();
});

getPopularActivities();
setInterval(function() {
    getPopularActivities();
}, 300000); // 同去热门实时每5min一更新

router.get('/', function(req, res, next) {
    res.render('tongqu', {

        active: {
            index: '',
            tongqu: 'active',
            contact: ''
        },
        updateTime: updateTime,
        popularActivities: popularActivities
    });
});

router.get('/trial', function(req, res, next) {
    res.render('trial', {
        active: {
            index: '',
            tongqu: '',
            contact: ''
        }
    });
});

router.post('/trial', function(req, res, next) {
    var tongquId = req.body.content;
    if (/^\d{5}$/.test(tongquId)) {
        var trialBlacklist = consoleInfos[0].blacklist;
        if (trialBlacklist.indexOf(tongquId) == -1) {
            var isAllBusy = true;
            var k = 9;
            while (k--) {
                if (consoleInfos[k].status) {
                    var key = keyIndex[k];
                    res.redirect('console' + key);
                    getCurrentViews(tongquId, k, 0);
                    consoleInfos[0].blacklist.push(tongquId);
                    consoleInfosBackup[0].blacklist.push(tongquId);
                    isAllBusy = false;
                    break;
                }
            }
            if (isAllBusy) {
                res.redirect('consolebusy');
            }
        } else {
            res.redirect('consolewarn1');
        }
    } else {
        res.redirect('consolewarn2');
    }
});

router.get('/formal', function(req, res, next) {
    res.render('formal', {
        active: {
            index: '',
            tongqu: '',
            contact: ''
        }
    });
});
router.post('/formal', function(req, res, next) {
    var tongquId = req.body.content;
    var key = req.body.key;
    if (/^\d{5}$/.test(tongquId) && /^\d{4}$/.test(key)) {
        var k = keyIndex.indexOf(key);
        if (k > 8) {
            var trialBlacklist = consoleInfos[k].blacklist;
            if (trialBlacklist.indexOf(tongquId) == -1) {
                res.redirect('console' + key);
                getCurrentViews(tongquId, k, 0);
                consoleInfos[k].blacklist.push(tongquId);
                consoleInfosBackup[k].blacklist.push(tongquId);
            } else {
                res.redirect('consolewarn1');
            }
        } else {
            res.redirect('consolewarn3');
        }
    } else {
        res.redirect('consolewarn2');
    }
});

var j = 33;
while (j--) {
    var key = keyIndex[j];
    router.get('/console' + key, function(req, res, next) {
        res.render('console', {
            active: {
                index: '',
                tongqu: '',
                contact: ''
            }
        });
    });
}

router.get('/update', function(req, res, next) {
    var query = url.parse(req.url, true).query;
    var key = query.key;
    var k = keyIndex.indexOf(key);
    res.send(consoleInfos[k].content);
});

router.get('/consolebusy', function(req, res, next) {
    res.render('consolerror', {
        active: {
            index: '',
            tongqu: '',
            contact: ''
        },
        consolerror: {
            title: "忙碌警告",
            content: "当前没有可用免费线路"
        }
    });
});

router.get('/consolewarn1', function(req, res, next) {
    res.render('consolerror', {
        active: {
            index: '',
            tongqu: '',
            contact: ''
        },
        consolerror: {
            title: "权限警告",
            content: "由于权限问题无法为您服务"
        }
    });
});

router.get('/consolewarn2', function(req, res, next) {
    res.render('consolerror', {
        active: {
            index: '',
            tongqu: '',
            contact: ''
        },
        consolerror: {
            title: "输入警告",
            content: "您的输入不符合要求"
        }
    });
});

router.get('/consolewarn3', function(req, res, next) {
    res.render('consolerror', {
        active: {
            index: '',
            tongqu: '',
            contact: ''
        },
        consolerror: {
            title: "激活码警告",
            content: "您的激活码无效"
        }
    });
});

router.get('/console' + variables.godKey, function(req, res, next) {
    res.render('godconsole', {
        active: {
            index: '',
            tongqu: '',
            contact: ''
        },
        increaseViewsIndex: increaseViewsIndex,
        keyIndex: keyIndex,
        consoleInfos: consoleInfosBackup
    });
});

function clearTrialBlacklist() {
    consoleInfos[0].blacklist = [];
    var k = 9;
    while (k--) {
        if (consoleInfos[k].status) {
            consoleInfos[k].content = "";
        }
    }
}

function getPopularActivities() {
    var indexUrl = homeUrl + "/index.php/api/act/type?type=0&offset=0&order=";
    http.get(indexUrl, function(res) {
        var source = "";
        res.on('data', function(data) {
            source += data;
        });
        res.on('end', function() {
            source = JSON.parse(source);
            var acts = source.result.acts;
            popularActivities = [];
            for (var n = 0; n <= 9; n++) {
                var popularActivity = {
                    name: acts[n].name,
                    url: publicUrl + acts[n].actid,
                    id: acts[n].actid,
                    views: acts[n].view_count,
                    members: acts[n].member_count,
                    comments: acts[n].comment_count
                };
                popularActivities.push(popularActivity);
            }
            updateTime = moment().format('YYYY-MM-DD HH:mm');
        });
    });
}

function getCurrentViews(tongquId, index, views) {
    var indexUrl = homeUrl + "/index.php/api/act/detail?id=" + tongquId;
    if (!views) {
        consoleInfos[index].status = false;
        consoleInfosBackup[index].status = false;
        consoleInfos[index].content = "<p>" + moment().format('HH:mm:ss') + " 目标链接：" + publicUrl + tongquId + "</p>";
        consoleInfos[index].content += "<p>" + moment().format('HH:mm:ss') + " 正在获取活动名称，更新当前浏览数...</p>";
    }
    http.get(indexUrl, function(res) {
        var source = "";
        res.on('data', function(data) {
            source += data;
        });
        res.on('end', function() {
            source = JSON.parse(source);
            var main_info = source.main_info;
            var name = main_info.name;
            var currentViews = parseInt(main_info.view_count);
            if (views) {
                // 第n次确认
                if (currentViews >= views) {
                    consoleInfos[index].content += "<p>" + moment().format('HH:mm:ss') + " 确认完成，实际最终浏览数：" + currentViews + "，符合预期</p>";
                    consoleInfos[index].content += "<p>" + moment().format('HH:mm:ss') + " 请 <a target='_blank' href=" + publicUrl + tongquId + ">点此确认</a> 如有问题，请与我们联系</p>";
                    consoleInfosBackup[index].content = consoleInfos[index].content;
                    consoleInfos[index].status = true;
                    consoleInfosBackup[index].status = true;
                    writeConsoleInfos();
                } else {
                    var toIncreaseViews = views - currentViews; // 要补充的浏览数
                    if (toIncreaseViews == increaseViewsIndex[index]) {
                        consoleInfos[index].content += "<p>" + moment().format('HH:mm:ss') + " 错误：监测到同去网服务器暂时不稳定，请联系我们解决</p>";
                    } else {
                        consoleInfos[index].content += "<p>" + moment().format('HH:mm:ss') + " 确认完成，实际最终浏览数：" + currentViews + "，不合预期</p>";
                        consoleInfos[index].content += "<p>" + moment().format('HH:mm:ss') + " 开始补充浏览量</p>";
                        consoleInfos[index].content += "<p>" + moment().format('HH:mm:ss') + " 目标浏览增长量(补充)：" + toIncreaseViews + "，正在准备...</p>";
                        increaseViews(tongquId, index, currentViews, toIncreaseViews, false);
                    }
                }
            } else {
                // 第1次
                var toIncreaseViews = increaseViewsIndex[index]; // 要增加的浏览数
                consoleInfos[index].content += "<p>" + moment().format('HH:mm:ss') + " 已获取，活动名称：" + name + "</p>";
                consoleInfos[index].content += "<p>" + moment().format('HH:mm:ss') + " 已更新，当前浏览数：" + currentViews + "</p>";
                consoleInfos[index].content += "<p>" + moment().format('HH:mm:ss') + " 目标浏览增长量：" + toIncreaseViews + "，正在准备...</p>";
                increaseViews(tongquId, index, currentViews, toIncreaseViews, true);
            }
        });
    });
}

function increaseViews(tongquId, index, currentViews, toIncreaseViews, isFirst) {
    var indexUrl = homeUrl + "/index.php/api/act/detail?id=" + tongquId; // 要刷的链接
    var views = currentViews; // 当前浏览数
    var concurrentNum = 1; // 设置并发数
    var updateFreq = 5; // 信息更新频率

    if (isFirst) {
        if (index > 27) {
            concurrentNum = 10;
            updateFreq = 50;
        } else {
            concurrentNum = 5;
            if (index > 19) {
                updateFreq = 20;
            } else {
                if (index > 8) {
                    updateFreq = 10;
                }
            }
        }
    } else {
        concurrentNum = 5;
    }

    var indexUrls = [];
    var n = toIncreaseViews;
    while (n--) {
        indexUrls.push(indexUrl);
    }
    consoleInfos[index].content += "<p>" + moment().format('HH:mm:ss') + " 准备完毕，正式开始</p>";

    var keyNum = parseInt(views / updateFreq) + 1;
    var count = 0;
    var startDate = new Date();
    if (index < 9 && isFirst) {
        var handle = function(indexUrl, callback) {
            var req = http.get(indexUrl, function(res) {
                views++;
                count++;
                var largeNum = parseInt(views / updateFreq);
                if (largeNum == keyNum) {
                    var checkDate = new Date();
                    var checkTimeDiff = checkDate.getTime() - startDate.getTime();
                    var leftTimeDiff = getDateDiff(checkTimeDiff / count * (toIncreaseViews - count));
                    consoleInfos[index].content += "<p>" + moment().format('HH:mm:ss') + " 最新浏览数：" + views + " 预计剩余时间：" + leftTimeDiff[0] + "时" + leftTimeDiff[1] + "分" + leftTimeDiff[2] + "秒</p>";
                    keyNum++;
                }
                callback(null, indexUrl);
            });
            req.on('error', function(e) {
                views++;
                count++;
                var largeNum = parseInt(views / updateFreq);
                if (largeNum == keyNum) {
                    keyNum++;
                }
                callback(null, indexUrl);
                console.error('Problem with http get: ' + e.message);
            });
        };
    } else {
        var handle = function(indexUrl, callback) {
            var options = url.parse(indexUrl);
            options.socksPort = 9050; // Tor default port.
            var req = shttp.get(options, function(res) {
                views++;
                count++;
                var largeNum = parseInt(views / updateFreq);
                if (largeNum == keyNum) {
                    var checkDate = new Date();
                    var checkTimeDiff = checkDate.getTime() - startDate.getTime();
                    var leftTimeDiff = getDateDiff(checkTimeDiff / count * (toIncreaseViews - count));
                    consoleInfos[index].content += "<p>" + moment().format('HH:mm:ss') + " 最新浏览数：" + views + " 预计剩余时间：" + leftTimeDiff[0] + "时" + leftTimeDiff[1] + "分" + leftTimeDiff[2] + "秒</p>";
                    keyNum++;
                }
                callback(null, indexUrl);
            });
            req.on('error', function(e) {
                views++;
                count++;
                var largeNum = parseInt(views / updateFreq);
                if (largeNum == keyNum) {
                    keyNum++;
                }
                callback(null, indexUrl);
                console.error('Problem with shttp get: ' + e.message);
            });
        };
    }

    async.mapLimit(indexUrls, concurrentNum, function(indexUrl, callback) {
        handle(indexUrl, callback);
    }, function(err, result) {
        consoleInfos[index].content += "<p>" + moment().format('HH:mm:ss') + " 基本完成，预期最终浏览数：" + views + "，正在确认...";
        getCurrentViews(tongquId, index, views);
    });
}

function getDateDiff(ms) {
    var ms1 = Math.round(ms);
    var hours = Math.floor(ms1 / (3600 * 1000));
    var leave1 = ms1 % (3600 * 1000);
    var minutes = Math.floor(leave1 / (60 * 1000));
    var leave2 = leave1 % (60 * 1000);
    var seconds = Math.round(leave2 / 1000);
    return [hours, minutes, seconds];
}

function writeConsoleInfos() {
    fs.writeFile('consoleInfo.json', JSON.stringify(consoleInfosBackup), function(err) {
        if (err) {
            return console.error(err);
        }
    });
}


module.exports = router;
