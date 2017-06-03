const express = require('express');
const router = express.Router();
const https = require('https');
const moment = require('moment');
const fs = require('fs');
const async = require('async');
const schedule = require('node-schedule');
const url = require('url');
const variables = require('../variables.js');

let updateTime = "";
let popularActivities = [];
const homeUrl = "https://tongqu.me";
const publicUrl = "https://tongqu.me/act/";

const keyIndex = variables.keyIndex;
const increaseViewsIndex = variables.increaseViewsIndex;

let consoleInfos = [];
let consoleInfosBackup = [];

fs.readFile('consoleInfo.json', (err, data) => {
    if (err)
        return console.error(err);
    consoleInfosBackup = JSON.parse(data.toString());
    consoleInfos = JSON.parse(data.toString());
    clearTrialBlacklist();
});

const rule = new schedule.RecurrenceRule();
rule.minute = 0;
schedule.scheduleJob(rule, function() {
    clearTrialBlacklist();
});

getPopularActivities();
setInterval(function() {
    getPopularActivities();
}, 300000); // 同去热门实时每5min一更新

router.get('/', (req, res, next) => {
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

router.get('/trial', (req, res, next) => {
    res.render('trial', {
        active: {
            index: '',
            tongqu: '',
            contact: ''
        }
    });
});

router.post('/trial', (req, res, next) => {
    const tongquId = req.body.content;
    if (/^\d{5}$/.test(tongquId)) {
        let trialBlacklist = consoleInfos[0].blacklist;
        if (trialBlacklist.indexOf(tongquId) == -1) {
            let isAllBusy = true;
            let k = 9;
            while (k--) {
                if (consoleInfos[k].status) {
                    let key = keyIndex[k];
                    res.redirect('console' + key);
                    getCurrentViews(tongquId, k, 0);
                    consoleInfos[0].blacklist.push(tongquId);
                    consoleInfosBackup[0].blacklist.push(tongquId);
                    isAllBusy = false;
                    break;
                }
            }
            if (isAllBusy)
                res.redirect('consolebusy');
        } else
            res.redirect('consolewarn1');
    } else
        res.redirect('consolewarn2');
});

router.get('/formal', (req, res, next) => {
    res.render('formal', {
        active: {
            index: '',
            tongqu: '',
            contact: ''
        }
    });
});

router.post('/formal', (req, res, next) => {
    const tongquId = req.body.content;
    const key = req.body.key;
    if (/^\d{5}$/.test(tongquId) && /^\d{4}$/.test(key)) {
        let k = keyIndex.indexOf(key);
        if (k > 8) {
            let trialBlacklist = consoleInfos[k].blacklist;
            if (trialBlacklist.indexOf(tongquId) == -1) {
                res.redirect('console' + key);
                getCurrentViews(tongquId, k, 0);
                consoleInfos[k].blacklist.push(tongquId);
                consoleInfosBackup[k].blacklist.push(tongquId);
            } else
                res.redirect('consolewarn1');
        } else
            res.redirect('consolewarn3');
    } else
        res.redirect('consolewarn2');
});

let j = 33;
while (j--) {
    let key = keyIndex[j];
    router.get('/console' + key, (req, res, next) => {
        res.render('console', {
            active: {
                index: '',
                tongqu: '',
                contact: ''
            }
        });
    });
}

router.get('/update', (req, res, next) => {
    const query = url.parse(req.url, true).query;
    const key = query.key;
    const k = keyIndex.indexOf(key);
    res.send(consoleInfos[k].content);
});

router.get('/consolebusy', (req, res, next) => {
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

router.get('/consolewarn1', (req, res, next) => {
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

router.get('/consolewarn2', (req, res, next) => {
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

router.get('/consolewarn3', (req, res, next) => {
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

router.get(`/console${variables.godKey}`, (req, res, next) => {
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
    let k = 9;
    while (k--) {
        if (consoleInfos[k].status)
            consoleInfos[k].content = "";
    }
}

function getPopularActivities() {
    const indexUrl = `${homeUrl}/api/act/type?type=0&offset=0&order=`;
    let options = url.parse(indexUrl);
    options.headers = {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:54.0) Gecko/20100101 Firefox/54.0'
    };
    let getPopActs = () => {
        https.get(options, (res) => {
            let source = "";
            res.on('data', (data) => {
                source += data;
            });
            res.on('end', () => {
                source = JSON.parse(source);
                let acts = source.result.acts;
                popularActivities = [];
                for (let n = 0; n <= 9; n++) {
                    let popularActivity = {
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
        }).on('error', (err) => {
            getPopActs();
        });
    };
    getPopActs();
}

function getCurrentViews(tongquId, index, views) {
    if (!views) {
        consoleInfos[index].status = false;
        consoleInfosBackup[index].status = false;
        consoleInfos[index].content = `<p>${moment().format('HH:mm:ss')} 目标链接：${publicUrl + tongquId}</p>`;
        consoleInfos[index].content += `<p>${moment().format('HH:mm:ss')} 正在获取活动名称，更新当前浏览数...</p>`;
    }
    const indexUrl = `${homeUrl}/api/act/detail?id=${tongquId}`;
    let options = url.parse(indexUrl);
    options.headers = {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:54.0) Gecko/20100101 Firefox/54.0'
    };
    let getCurViews = () => {
        https.get(options, (res) => {
            let source = "";
            res.on('data', (data) => {
                source += data;
            });
            res.on('end', () => {
                source = JSON.parse(source);
                let main_info = source.main_info;
                let name = main_info.name;
                let currentViews = parseInt(main_info.view_count);
                if (views) {
                    if (currentViews >= views) {
                        consoleInfos[index].content += `<p>${moment().format('HH:mm:ss')} 确认完成，实际最终浏览数：${currentViews}，符合预期</p>`;
                        consoleInfos[index].content += `<p>${moment().format('HH:mm:ss')} 请 <a target='_blank' href=${publicUrl + tongquId}>点此确认</a> 如有问题，请与我们联系</p>`;
                        consoleInfosBackup[index].content = consoleInfos[index].content;
                        consoleInfos[index].status = true;
                        consoleInfosBackup[index].status = true;
                        writeConsoleInfos();
                    } else {
                        let toIncreaseViews = views - currentViews; // 要补充的浏览数
                        if (toIncreaseViews == increaseViewsIndex[index])
                            consoleInfos[index].content += `<p>${moment().format('HH:mm:ss')} 错误：监测到同去网服务器暂时不稳定，请联系我们解决</p>`;
                        else {
                            consoleInfos[index].content += `<p>${moment().format('HH:mm:ss')} 确认完成，实际最终浏览数：${currentViews}，不合预期</p>`;
                            consoleInfos[index].content += `<p>${moment().format('HH:mm:ss')} 开始补充浏览量</p>`;
                            consoleInfos[index].content += `<p>${moment().format('HH:mm:ss')} 目标浏览增长量(补充)：${toIncreaseViews}，正在准备...</p>`;
                            increaseViews(tongquId, index, currentViews, toIncreaseViews, false);
                        }
                    }
                } else {
                    let toIncreaseViews = increaseViewsIndex[index]; // 要增加的浏览数
                    consoleInfos[index].content += `<p>${moment().format('HH:mm:ss')} 已获取，活动名称：${name}</p>`;
                    consoleInfos[index].content += `<p>${moment().format('HH:mm:ss')} 已更新，当前浏览数：${currentViews}</p>`;
                    consoleInfos[index].content += `<p>${moment().format('HH:mm:ss')} 目标浏览增长量：${toIncreaseViews}，正在准备...</p>`;
                    increaseViews(tongquId, index, currentViews, toIncreaseViews, true);
                }
            });
        }).on('error', (err) => {
            getCurViews();
        });
    };
    getCurViews();
}

function increaseViews(tongquId, index, currentViews, toIncreaseViews, isFirst) {
    const indexUrl = `${homeUrl}/api/act/detail?id=${tongquId}`; // 要刷的链接
    let options = url.parse(indexUrl);
    options.headers = {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:54.0) Gecko/20100101 Firefox/54.0'
    };

    let views = currentViews; // 当前浏览数
    let concurrentNum = 1; // 设置并发数
    let updateFreq = 5; // 信息更新频率

    if (isFirst) {
        if (index > 27) {
            concurrentNum = 10;
            updateFreq = 50;
        } else {
            concurrentNum = 5;
            if (index > 19)
                updateFreq = 20;
            else {
                if (index > 8)
                    updateFreq = 10;
            }
        }
    } else
        concurrentNum = 5;

    let indexUrls = [];
    let n = toIncreaseViews;
    while (n--)
        indexUrls.push(indexUrl);
    consoleInfos[index].content += `<p>${moment().format('HH:mm:ss')} 准备完毕，正式开始</p>`;

    let keyNum = parseInt(views / updateFreq) + 1;
    let count = 0;
    let startDate = new Date();
    let handle;
    if (index < 9 && isFirst) {
        handle = (indexUrl, callback) => {
            const req = https.get(options, (res) => {
                views++;
                count++;
                let largeNum = parseInt(views / updateFreq);
                if (largeNum == keyNum) {
                    let checkDate = new Date();
                    let checkTimeDiff = checkDate.getTime() - startDate.getTime();
                    let leftTimeDiff = getDateDiff(checkTimeDiff / count * (toIncreaseViews - count));
                    consoleInfos[index].content += `<p>${moment().format('HH:mm:ss')} 最新浏览数：${views} 预计剩余时间：${leftTimeDiff[0]}时${leftTimeDiff[1]}分${leftTimeDiff[2]}秒</p>`;
                    keyNum++;
                }
                callback(null, indexUrl);
            });
            req.on('error', (err) => {
                views++;
                count++;
                let largeNum = parseInt(views / updateFreq);
                if (largeNum == keyNum) {
                    keyNum++;
                }
                callback(null, indexUrl);
                console.error(`Problem with https get: ${err.message}`);
            });
        };
    } else {
        handle = (indexUrl, callback) => {
            const req = https.get(options, (res) => {
                views++;
                count++;
                let largeNum = parseInt(views / updateFreq);
                if (largeNum == keyNum) {
                    let checkDate = new Date();
                    let checkTimeDiff = checkDate.getTime() - startDate.getTime();
                    let leftTimeDiff = getDateDiff(checkTimeDiff / count * (toIncreaseViews - count));
                    consoleInfos[index].content += `<p>${moment().format('HH:mm:ss')} 最新浏览数：${views} 预计剩余时间：${leftTimeDiff[0]}时${leftTimeDiff[1]}分${leftTimeDiff[2]}秒</p>`;
                    keyNum++;
                }
                callback(null, indexUrl);
            });
            req.on('error', (err) => {
                views++;
                count++;
                let largeNum = parseInt(views / updateFreq);
                if (largeNum == keyNum) {
                    keyNum++;
                }
                callback(null, indexUrl);
                console.error(`Problem with https get: ${err.message}`);
            });
        };
    }

    async.mapLimit(indexUrls, concurrentNum, (indexUrl, callback) => {
        handle(indexUrl, callback);
    }, (err, result) => {
        consoleInfos[index].content += `<p>${moment().format('HH:mm:ss')} 基本完成，预期最终浏览数：${views}，正在确认...`;
        getCurrentViews(tongquId, index, views);
    });
}

function getDateDiff(ms) {
    const ms1 = Math.round(ms);
    const hours = Math.floor(ms1 / (3600 * 1000));
    const leave1 = ms1 % (3600 * 1000);
    const minutes = Math.floor(leave1 / (60 * 1000));
    const leave2 = leave1 % (60 * 1000);
    const seconds = Math.round(leave2 / 1000);
    return [hours, minutes, seconds];
}

function writeConsoleInfos() {
    fs.writeFile('consoleInfo.json', JSON.stringify(consoleInfosBackup), (err) => {
        if (err)
            return console.error(err);
    });
}


module.exports = router;
