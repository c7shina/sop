const CONFIG_PATH = './data/shop/';

let siteCfg;
let castList;

function createCastDataElement(castInfo){
    let elemDiv = document.createElement('div');
    elemDiv.setAttribute('class', 'thumbnail');

    let elemCastName = document.createElement('h1');
    elemCastName.setAttribute('class', 'name');
    let castNameStr = (castInfo.star) ? '★' + castInfo.name : '' + castInfo.name;
    if(castInfo.age != null && castInfo.age > 0){
        castNameStr += '(' + castInfo.age + ')';
    }
    elemCastName.innerText = castNameStr;

    elemDiv.appendChild(elemCastName);

    let elemCastRubi = document.createElement('h4');
    elemCastRubi.setAttribute('class', 'rubi');
    elemCastRubi.innerText = castInfo.rubi;
    elemDiv.appendChild(elemCastRubi);

    let elemAnchor = document.createElement('a');
    let targetURL = (castInfo.id.includes('https')) ? castInfo.id : siteCfg.URL_INFO.BASE_URL + siteCfg.URL_INFO.CAST_DETAIL + castInfo.id;
    elemAnchor.setAttribute('href', targetURL);
    elemAnchor.setAttribute('alt', castInfo.name);

    let elemImgDiv = document.createElement('div');
    elemImgDiv.setAttribute('class', 'img-container');

    let elemThumb = document.createElement('img');
    let imgURL = siteCfg.URL_INFO.CAST_THUMB1 + castInfo.imgID + siteCfg.URL_INFO.CAST_THUMB2;
    imgURL = (siteCfg.URL_INFO.CAST_THUMB1.includes('https')) ? imgURL : siteCfg.URL_INFO.BASE_URL + imgURL;
    elemThumb.setAttribute('src', imgURL);
    elemImgDiv.appendChild(elemThumb);

    if(castInfo.popularLevel && castInfo.popularLevel > 0){
        let elemPopularP = document.createElement('p');
        elemPopularP.innerText = '予約人気' + '★'.repeat(castInfo.popularLevel);
        elemPopularP.setAttribute('class', 'overlay-text');
        elemImgDiv.appendChild(elemPopularP);
    }

    elemAnchor.appendChild(elemImgDiv);
    elemDiv.appendChild(elemAnchor);

    let elemSizeB = document.createElement('h2');
    elemSizeB.setAttribute('class', 'sizeB');
    elemSizeB.innerText = 'B: ' + castInfo.sizeInfo.B;
    let elemSizeBClass = document.createElement('span');
    elemSizeBClass.setAttribute('class', 'cup');
    elemSizeBClass.innerText = castInfo.sizeInfo.B_Class;
    elemSizeB.insertBefore(elemSizeBClass, elemSizeB.firstChild);
    elemDiv.appendChild(elemSizeB);

    let elemSizeInfo = document.createElement('h3');
    elemSizeInfo.setAttribute('class', 'size');
    elemSizeInfo.innerText = 'T: ' + castInfo.sizeInfo.T + ' W: ' + castInfo.sizeInfo.W + ' H: ' + castInfo.sizeInfo.H;
    elemDiv.appendChild(elemSizeInfo);

    return elemDiv;
}

async function readLocalJSON() {
    try {

        let params = new URL(window.location.href).searchParams;
        let confFileKey = params.get('shopID');

        let response = await fetch(CONFIG_PATH + confFileKey + '.json');
        if(!response.ok){
            throw new Error('Failed to fetch CONF JSON');
        }
        siteCfg = await response.json();

        console.log(siteCfg.siteID);
        document.title = siteCfg.siteID

        response = await fetch(siteCfg.dataFile);
        if (!response.ok) {
          throw new Error('Failed to fetch DATA JSON');
        }

        castList = await response.json();

        for(const castInfo of castList){
            if(castInfo.star){
                document.getElementById('listRoot').appendChild(createCastDataElement(castInfo));
            }
            //console.log(castInfo.id, castInfo.name, castInfo.sizeInfo.B_Class, castInfo.sizeInfo.B);
        }
        for(const castInfo of castList){
            if(!castInfo.star){
                document.getElementById('listRoot').appendChild(createCastDataElement(castInfo));
            }
        }

    } catch (error) {
        console.error('Error reading JSON:', error.message);
    }
}


// start process
readLocalJSON();