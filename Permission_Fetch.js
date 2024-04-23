
function __GET_TIME() {
    //輸出成YYYY-MM-DD HH:MM:SS 格式
    const _now = new Date();
    const _year = _now.getFullYear();
    const _month = _now.getMonth() + 1;
    const _day = _now.getDate();
    const _hour = _now.getHours();
    const _minute = _now.getMinutes();
    const _second = _now.getSeconds();
    
    const _format_year = String(_year).padStart(4, '0');
    const _format_month = String(_month).padStart(2, '0');
    const _format_day = String(_day).padStart(2, '0');
    const _format_hour = String(_hour).padStart(2, '0');
    const _format_minute = String(_minute).padStart(2, '0');
    const _format_second = String(_second).padStart(2, '0');

    return `${_format_year}-${_format_month}-${_format_day} ${_format_hour}:${_format_minute}:${_format_second}`;
}

function __GET_BIRTHDAY(config) {
    return config.bot_config.birthday;
}

function __GET_AGE(config) {
    //取得生日
    const birthday = __GET_BIRTHDAY(config);
    const time = __GET_TIME();

    //birthday和time都是 YYYY-MM-DD HH:MM:SS 格式，先轉換
    const birthday_day = birthday.split(' ')[0];
    const now_day = time.split(' ')[0];

    //取得當前年月日
    const birthday_year = birthday_day.split('-');
    const now_year = now_day.split('-');

    //新增年齡
    let age = Number(now_year[0]) - Number(birthday_year[0]);

    //暴力計算天數
    if(Number(now_year[1]) < Number(birthday_year[1])) 
        age -= 1;
    else if(Number(now_year[1]) == Number(birthday_year[1]) && Number(now_year[2]) < Number(birthday_year[2]))
        age -= 1;
    
    //回傳
    return age;
}

function __GET_DEVELOPER(config) {
    return config.developer;
}

async function __GET_WEATHER(config,message) {
    //API
    const API = {
        url : "https://api.openweathermap.org/data/2.5/weather",
        key : config.openweathermap.token,
        units : "metric"
    }

    //取得訊息
    let new_message = message;

    //將訊息的臺換成台
    new_message = new_message.replace('臺','台');

    //取得中翻英
    const country_zh_to_en = require('./chat_process/setting/weather_Lenguage.json');

    //設定查詢列隊，用於將天氣放進訊息中
    let weather_queue = [];

    //檢查訊息有哪些城市
    for(let i = 0; i < country_zh_to_en.length; i++) {
        if(new_message.includes(country_zh_to_en[i].zh_name)) {
            weather_queue.push(country_zh_to_en[i]);
        }
    }

    //定義全部關鍵詞
    const all_key_words = ["所有","全部","台灣","全台"];

    //如果訊息中包含類似所有的關鍵詞，則設定為台灣
    for(let i = 0; i < all_key_words.length; i++) {
        if(new_message.includes(all_key_words[i])) {
            weather_queue = [{zh_name:"台灣",en_name:"Taiwan"}];
        }
    }

    //如果沒有任何國家
    if(weather_queue.length == 0) {
        weather_queue = [{zh_name:"台灣",en_name:"Taiwan"}];
    }

    //設定天氣陣列
    let result_weather_list = [];

    //開始查詢
    for(let i = 0; i < weather_queue.length; i++) {
        const openweathermapAPI = API.url + "?q=" + weather_queue[i].en_name + ",TW" + "&appid=" + API.key + "&units=" + API.units;
        const fetch_data = await fetch(openweathermapAPI);
        const data = await fetch_data.json();

        if(data.cod != "200") {
            return null;
        }

        //添加城市天氣
        result_weather_list.push({
            city : weather_queue[i].zh_name,
            weather : data.main.temp
        })
    }

    return result_weather_list;
}

function __GET_DATA(dataname) {
    return null;
}

function __GET_VERSION(config) {
    return config.system_setting.version;
}

//封裝
module.exports = {
    Time: __GET_TIME,
    Birthday: __GET_BIRTHDAY,
    Age: __GET_AGE,
    Developer: __GET_DEVELOPER,
    Weather: __GET_WEATHER,
    Data: __GET_DATA,
    Version: __GET_VERSION
};