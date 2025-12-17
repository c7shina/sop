const COMMON_KEYWD = 'data/bbs/commonKeys.json';

let siteCfg;
let castConf;
let shopConf;

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

function createCastInfoPanel(castID){
    const castInfo = castConf.find(cast_data => cast_data.id === castID);

    let imgURL = shopConf.URL_INFO.CAST_THUMB1 + castInfo.imgID + shopConf.URL_INFO.CAST_THUMB2;
    imgURL = (shopConf.URL_INFO.CAST_THUMB1.includes('https')) ? imgURL : shopConf.URL_INFO.BASE_URL + imgURL;

    let castInfoHTML = '<div class="cast">';
    castInfoHTML += `<p><img src="${imgURL}"></p>`;
    castInfoHTML += (castInfo.age && castInfo.age > 0) ? `<p class="castName">${castInfo.name}(${castInfo.age})</p>` : `<p class="castName">${castInfo.name}</p>`;
    castInfoHTML += `<p class="sizeInfo">B: ${castInfo.sizeInfo.B}(${castInfo.sizeInfo.B_Class})<br>T: ${castInfo.sizeInfo.T},W: ${castInfo.sizeInfo.W},H: ${castInfo.sizeInfo.H}</p>`
    castInfoHTML += '</div>';
    return castInfoHTML;

}

function highlightText(text, keywords, nameKeys){
    let orgText = text;
    keywords.filter((key) => key.type != 'spam').forEach(({type, keyword, castID}) => {
        const regex = new RegExp(`(${keyword})`, 'g');
        if(type === 'castname'){
            //if(nameKeys === undefined){
                text = text.replace(regex, `<span class="highlight-${type}" data-cast="${castID}">$1</span>`);
            //}
        } else {
            text = text.replace(regex, `<span class="highlight-${type}">$1</span>`);
        }
    })

    /*
    if (nameKeys && nameKeys.length > 0){
        nameKeys.forEach(({type, keyword, castID}) => {
            const regex = new RegExp(`(${keyword})`, 'g');
            text = text.replace(regex, `<span class="highlight-${type}" data-cast="${castID}">$1</span>`);
        })
    }
    */

    let elemTempP = document.createElement('p');
    elemTempP.innerHTML = text;

    let highlightLists = elemTempP.querySelectorAll("span");
    for(target of highlightLists){
        if(target.dataset.cast){
            // replace cast pane call.
            target.setAttribute('onmouseover', 'tooltip.Schedule(this,event)');
            target.setAttribute('tooltip', createCastInfoPanel(target.dataset.cast))
            //console.log(target.dataset.cast);
        }
    }
    return elemTempP.innerHTML;
}

function createMsgElement(msgInfo, keywords, resSource){
    let elemContainer = createHTMLElement('div', 'container');
    let elemHeader = createHTMLElement('div', 'msgHeader');
    let elemMsgID = createHTMLTextElement('div', 'msgID', msgInfo.id);
    elemMsgID.setAttribute('id', 'res' + msgInfo.id);
    let elemDate = createHTMLTextElement('div', 'date', msgInfo.date);
    //let elemCasts = createHTMLTextElement('div', 'castInfo', msgInfo.casts.join(','));
    elemHeader.appendChild(elemMsgID);
    elemHeader.appendChild(elemDate);
    //elemHeader.appendChild(elemCasts);
    elemContainer.appendChild(elemHeader);

    // レス処理
    if(msgInfo.respondTo){
        let elemReplyToDiv = createHTMLElement('div', 'replyTo');
        let elemReplyToAnchor = createHTMLTextElement('a', null, '>>' + msgInfo.respondTo);
        elemReplyToAnchor.setAttribute('onmouseover', 'tooltip.Schedule(this,event)');
        let resHTML = '';
        if(resSource){
            resSource.content.split('\n').forEach(paragraph =>{
                let elemP = createHTMLElement('p', null);
                const contentWithHighlight = highlightText(paragraph, keywords, msgInfo.names);
                elemP.innerHTML = `${contentWithHighlight}`;
                resHTML += elemP.outerHTML;
            })
        }
        elemReplyToAnchor.setAttribute('tooltip', (resSource) ? resHTML : 'NULみたい');
        elemReplyToAnchor.setAttribute('href', '#res' + msgInfo.respondTo);
        elemReplyToDiv.appendChild(elemReplyToAnchor);
        elemContainer.appendChild(elemReplyToDiv);
    }

    // 本文処理
    let elemContents = createHTMLElement('div', 'contents ' + msgInfo.type);
    
    // SPAM処理
    let spamFlag = false;
    keywords.filter((key) => key.type == 'spam').forEach(({type, keyword, castID}) => {
        if(msgInfo.content.includes(keyword)){
            spamFlag = true;
            let elemP = createHTMLElement('p', null);
            let elemSPAN = createHTMLTextElement('span', 'highlight-spam', '＝＝SPAM＝＝');
            elemSPAN.setAttribute('onmouseover', 'tooltip.Schedule(this,event)');
            elemSPAN.setAttribute('tooltip', msgInfo.content);
            elemP.appendChild(elemSPAN);
            elemContents.appendChild(elemP);
            elemContainer.appendChild(elemContents);
            return elemContainer;
        }
    })

    // 通常メッセージ処理
    if(!spamFlag){
        msgInfo.content.split('\n').forEach(paragraph => {
            //let elemP = createHTMLTextElement('p', null, paragraph);
            let elemP = createHTMLElement('p', null);
            const contentWithHighlight = highlightText(paragraph, keywords, msgInfo.names);
            elemP.innerHTML = `${contentWithHighlight}`;
            elemContents.appendChild(elemP);
        });
    }
    elemContainer.appendChild(elemContents);
    
    return elemContainer;
}

function extractCastNames(names, id){
    return names.flatMap(name => name.split(' ').map(nameKey => nameKey.trim()).filter(nameKey => nameKey.length > 0)
    ).map(keyword => ({ type: 'castname', keyword, castID: id}));
}

async function readLocalJSON() {
    try {

        let params = new URL(window.location.href).searchParams;
        let bbsKey = params.get('bbsID');

        // load common keywords
        let response = await fetch(COMMON_KEYWD);
        if(!response.ok){
            throw new Error('Failed to fetch COMMON KEYWORDS JSON');
        }
        let keywords = await response.json();

        console.log('common keywords are loaded.')

        // load cast conf and arrange cast name keywords;
        let shopID = '';
        if(bbsKey.includes('/')){
            shopID = bbsKey.split('/')[0];
            response = await fetch('./data/shop/' + shopID + '.json');
            if(!response.ok){
                throw new Error('** Failed to fetch SHOP config : ' + shopID + '.json');
            }
            shopConf = await response.json();

            response = await fetch(shopConf.dataFile);
            if(!response.ok){
                throw new Error('** Failed to fetch CAST config : ' + shopConf.dataFile);
            }
            castConf = await response.json();

            // pickup cast name keywords
            let castNameKey = castConf.reduce((nameList, castInfo) => {
                nameList = nameList.concat(extractCastNames([castInfo.name], castInfo.id));
                if(castInfo.nameHistory){
                    nameList.push(...extractCastNames(castInfo.nameHistory, castInfo.id));
                }
                return nameList;
            }, new Array());

            keywords = keywords.concat(castNameKey);

            // _castnames.json不使用化
            //response = await fetch('data/bbs/' + shopID + '/' + shopID + '_castnames.json');
            //keywords = keywords.concat(await response.json());
        }
        console.log('KEYWD: ', keywords.length)

        console.log('LOAD LOG: ', 'data/bbs/' + bbsKey + '.json');

        response = await fetch('data/bbs/' + bbsKey + '.json');
        if (!response.ok) {
          throw new Error('Failed to fetch DATA JSON');
        }

        const threadInfo = await response.json();
        document.title = 'Bakusai : ' + threadInfo.threadTitle

        // naviエリア 処理
        Array.from(document.getElementsByClassName('thTitle')).forEach(elem => {
            if(threadInfo.originalURL){
                let anchor = createHTMLTextElement('a', '', threadInfo.threadTitle);
                anchor.setAttribute('href', threadInfo.originalURL);
                elem.appendChild(anchor);
            } else {
                elem.innerText = threadInfo.threadTitle
            }
        });
        //console.log(threadInfo.originalURL);
        //Array.from(document.getElementsByClassName('orgURL')).forEach(elem => elem.setAttribute('href', threadInfo.originalURL));
        //Array.from(document.getElementsByClassName('orgURL')).forEach(elem => elem.innerText = threadInfo.originalURL);
        Array.from(document.getElementsByClassName('thPrev')).forEach(elem => {
            let anchor = createHTMLTextElement('a', '', '<< ' + threadInfo.previousThID);
            anchor.setAttribute('href', './baksai.html?bbsID=' + shopID + '/' + threadInfo.previousThID);
            elem.appendChild(anchor);
        });
        Array.from(document.getElementsByClassName('thNext')).forEach(elem => {
            let anchor = createHTMLTextElement('a', '', threadInfo.nextThID + ' >>');
            anchor.setAttribute('href', './baksai.html?bbsID=' + shopID + '/' + threadInfo.nextThID)
            elem.appendChild(anchor);
        });
        

        for(const info of threadInfo.threadLogs){
            //console.log(info);
            if(info.respondTo){
                let resSource = threadInfo.threadLogs.find(res => res.id === info.respondTo);
                document.getElementById('msg_root').appendChild(createMsgElement(info, keywords, resSource));
            } else {
                document.getElementById('msg_root').appendChild(createMsgElement(info, keywords, null));
            }
        }

    } catch (error) {
        console.error('Error reading JSON:', error.message);
    }
}


// start process
readLocalJSON();