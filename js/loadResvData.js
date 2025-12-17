const DEFAULT_RESV_LOG = './data/resv/data.json';
const SHOP_CFG_PATH = './data/shop/';
const CAST_CFG_PATH = './data/cast/';
const RESV_SLOTS = ["06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", "23:30"];
const DAYS_JP = ["日", "月", "火", "水", "木", "金", "土"];

function createHTMLElement(tagName, cls){
    let elem = document.createElement(tagName);
    if(cls){elem.setAttribute('class', cls);}
    return elem;
}

function createHTMLTextElement(tagName, cls, text){
    let elem = document.createElement(tagName);
    if(cls){elem.setAttribute('class', cls);}
    elem.innerText = text;
    return elem;
}

function createCastHeader(shopInfo, castInfo, resvInfoURL){
    let elemShopNameP = createHTMLElement('p', 'shopTitle');
    let elemShopAnchor = createHTMLTextElement('a', null, shopInfo.siteID);
    elemShopAnchor.setAttribute('href', './compList.html?shopID=' + shopInfo.siteID);
    elemShopAnchor.setAttribute('target', 'shop_info');
    elemShopNameP.appendChild(elemShopAnchor);

    let elemCastImgP = document.createElement('p');
    let elemCastImg = document.createElement('img');
    let imgURL = shopInfo.URL_INFO.CAST_THUMB1 + castInfo.imgID + shopInfo.URL_INFO.CAST_THUMB2;
    imgURL = (shopInfo.URL_INFO.CAST_THUMB1.includes('https')) ? imgURL : shopInfo.URL_INFO.BASE_URL + imgURL;
    elemCastImg.setAttribute('src', imgURL);
    elemCastImgP.appendChild(elemCastImg);

    let elemCastNameP = createHTMLTextElement('p', 'castName', '');
    let elemCastAnchor = createHTMLTextElement('a', null, castInfo.name + '(' + castInfo.age + ')');
    elemCastAnchor.setAttribute('href', resvInfoURL);
    elemCastNameP.appendChild(elemCastAnchor);
    let elemCastInfoP = createHTMLTextElement('p', null, 'B:' + castInfo.sizeInfo.B + '(' + castInfo.sizeInfo.B_Class + ')');
    elemCastInfoP.appendChild(document.createElement('br'));
    elemCastInfoP.appendChild(document.createTextNode('T: ' + castInfo.sizeInfo.T + ' W: ' + castInfo.sizeInfo.W + ' H: ' + castInfo.sizeInfo.H));

    let elemCastDiv = createHTMLElement('div', 'cast');
    elemCastDiv.appendChild(elemShopNameP);
    elemCastDiv.appendChild(elemCastImgP);
    elemCastDiv.appendChild(elemCastNameP);
    elemCastDiv.appendChild(elemCastInfoP);
    return elemCastDiv;
}

function createResvData(resvLog, dateKey, time, schedule){
    let elemTimeSlotDiv = createHTMLElement('div', 'resvList');
    //let elemTimeIndexDiv = createHTMLTextElement('div', 'time',time + '-');
    //elemTimeSlotDiv.appendChild(elemTimeIndexDiv);

    resvLog.forEach(shop => {
        shop.casts.forEach(cast => {
            let elemResvInfoDiv;
            if(schedule[cast.castID]){
                //console.log(cast.castID, time, schedule[cast.castID][time]);
                switch (schedule[cast.castID][dateKey][time]){
                    case 'CAN':
                        elemResvInfoDiv = createHTMLTextElement('div', 'resvInfo vacant', '○');
                        break;
                    case 'RESGIRL':
                        elemResvInfoDiv = createHTMLTextElement('div', 'resvInfo booked', '×');
                        break;
                    case 'TEL':
                        elemResvInfoDiv = createHTMLTextElement('div', 'resvInfo tel', 'TEL');
                        break;
                    case 'NODATA':
                        elemResvInfoDiv = createHTMLTextElement('div', 'resvInfo noservice', '？');
                        break;
                    case 'NOTGIRL':
                    default:
                        elemResvInfoDiv = createHTMLTextElement('div', 'resvInfo noservice', '-');
                }
                //elemResvInfoDiv.setAttribute('class', 'resvInfo');
                elemTimeSlotDiv.appendChild(elemResvInfoDiv);
            }
        });
    });
    return elemTimeSlotDiv;
}

function changeLog(url){
    window.location.href = url;
}

function showHistoryList(shopID, logFiles, cursor){
    let elemHistoryUL = createHTMLElement('ul', 'history');
    let index = 0;
    for(file of logFiles){
        const regex = /(20[2-9][0-9])([0-1][0-9])([0-3][0-9])_([0-2][0-9]).json/;
        let match = file.log_name.match(regex);
        if(match){
            let label = match[2] + '/' + match[3] + ' ' + match[4] + '時';
            let li = createHTMLTextElement('li', '', label);
            if(index == parseInt(cursor)){
                li.setAttribute('class', 'active');
            } else {
                li.setAttribute('onclick', "changeLog('./resv.html?shopID=" + shopID + "&history=" + index + "')");
            }
            elemHistoryUL.appendChild(li);
            index++;
        }
    }
    document.getElementById('history').appendChild(elemHistoryUL);
}

// call node sever api
async function loadDataList(){
    const fileListElement = document.getElementById('data_files');
    fetch('/myshps/api/json-files')
    .then(response =>{
        if(!response.ok){
            throw new Error('HTTP ERROR! status: ${response.status}');
        }
        return response.json();
    })
    .then(jsonFiles => {
        jsonFiles.forEach(file => {
            const li = document.createElement('li');
            li.textContent = file;
            fileListElement.appendChild(li);
        })
    })
    .catch(error => {
        console.error('Error fetching file list:', error);
        const errorMessage = document.createElement('li');
        errorMessage.textContent = 'Error loading file list.';
        fileListElement.appendChild(errorMessage);
    })
}


async function loadData(){
    try {
        let params = new URL(window.location.href).searchParams;

        const shopID = params.get('shopID');
        const data_path = (shopID && shopID.length > -1) ? './data/resv/' + shopID + '/' : './data/resv/';

        const historyIdx = params.get('history') ? params.get('history') : 0;

        // load data list
        let response = await fetch(data_path + 'loglist.json');
        if (!response.ok) {
            throw new Error('Failed to fetch DATA JSON: ' + data_path + 'loglist.json');
        }
        const history_log = await response.json();
        console.log(history_log);
        showHistoryList(shopID, history_log, historyIdx);

        let resvDataFile = data_path + history_log[historyIdx].log_name;
        if(params.get('resvData')){
            resvDataFile = params.get('resvData');
        }
        console.log('show: ', resvDataFile);

        // load data file
        response = await fetch(resvDataFile);
        if (!response.ok) {
            throw new Error('Failed to fetch DATA JSON: ' + resvDataFile);
        }
        const resv_log = await response.json();

        // ナビゲーションバー処理
        let dateCur = 1;
        let tmp_cur = 0;
        while(resv_log[0].casts[tmp_cur].resv_data == null){
            tmp_cur++;
        }
        const dateList = await resv_log[0].casts[tmp_cur].resv_data.flatMap(obj => Object.keys(obj));
        for(dateKey of dateList){
            //console.log(dateKey);
            document.getElementById('tab'+dateCur).textContent = dateKey+' ('+DAYS_JP[new Date(dateKey).getDay()]+')';
            dateCur++;
        }

        let schedule = {};
        for(shop of resv_log){
            // load shop cfg
            console.log('load : ', SHOP_CFG_PATH + shop.shopID + '.json')
            response = await fetch(SHOP_CFG_PATH + shop.shopID + '.json');
            if (!response.ok) {
                throw new Error('Failed to fetch DATA JSON: ' + shop.shopID);
            }
            const shopCfg = await response.json();

            // load cast list cfg
            console.log('load : ', shopCfg.dataFile)
            response = await fetch(shopCfg.dataFile);
            if (!response.ok) {
                throw new Error('Failed to fetch DATA JSON: ' + shopCfg.dataFile);
            }
            const castCfgList = await response.json();
    
            for(cast of shop.casts){
                //header処理
                const castCfg = await castCfgList.find(castInfo => castInfo.id === cast.castID);
                if(castCfg == null){
                    console.log(cast, shop.casts.indexOf(cast));
                    //shop.casts.splice(shop.casts.indexOf(cast), 1);
                    continue;
                }
                //console.log(cast, castCfg);
                let elemCastHeader = createCastHeader(shopCfg, castCfg, cast.url);
                document.getElementById('cast-info').appendChild(elemCastHeader);

                //schedule処理
                schedule[cast.castID] = {};
                if(cast.resv_data){
                    for(dateKey of dateList){
                        const resvData = cast.resv_data.find(data => data[dateKey]);
                        schedule[cast.castID][dateKey] = {};
                        if(resvData){
                            for(slot of resvData[dateKey]){
                                const time = `${slot.time.slice(0,2)}:${slot.time.slice(2)}`;
                                schedule[cast.castID][dateKey][time] = slot.acp_status_flg;
                            }
                        }
                    }
                } else {
                    // no resv data.
                    for(dateKey of dateList){
                        schedule[cast.castID][dateKey] = {};
                        for(time of RESV_SLOTS){
                            schedule[cast.castID][dateKey][time] = 'NODATA';
                        }
                    }
                }
            }
        }
        console.log(schedule);

        for(time of RESV_SLOTS){
            dateCur = 1;
            for(dateKey of dateList){
                let elemTimeSlotDiv = createResvData(resv_log, dateKey, time, schedule);
                document.getElementById('schedule'+dateCur).appendChild(elemTimeSlotDiv);
                dateCur ++;
            }
        }

    } catch (error) {
        console.error('Error reading JSON:', error.message);
    }
}

function changeTab(tabID){
    //console.log(tabID);
    document.getElementsByClassName('isActive')[0].classList.remove('isActive');
    document.getElementById('tab'+tabID).classList.add('isActive');
    //this.classList.add('isActive');

    document.getElementsByClassName('isDisplay')[0].classList.remove('isDisplay');
    document.getElementById('schedule'+tabID).classList.add('isDisplay')
}

// start process
loadData();