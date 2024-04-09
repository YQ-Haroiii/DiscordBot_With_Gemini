//Google Generative AI 外掛
const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
} = require("@google/generative-ai");

//fs 外掛
const fs = require('fs');

//設定參考資料
let example_user = {
    id:"783836181544173579",
    tag:"何羽晴"
}

//開始對話
async function runChat(Train_data, bot_info, Chat_prompt) {
    const MODEL_NAME = "gemini-1.0-pro";
    const API_KEY = bot_info.gemini.token;

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const generationConfig = {
        temperature: 1,
        topK: 50,
        topP: 1,
        maxOutputTokens: 2048,
    };

    const safetySettings = [
        {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
        },
    ];

    const chat = model.startChat({
        generationConfig,
        safetySettings,
        history: Train_data,
    });

    const result = await chat.sendMessage(Chat_prompt);
    const response = result.response;
    return response.text();
}

//新對話，這裡負責處理提示詞，接收結果
async function new_chat(bot_info, message_info) {
    //讀取系統提示詞，位置在prompt/System_prompt.txt
    const system_prompt = fs.readFileSync('./prompt/prompt_txt/System_prompt.txt', 'utf8');

    //計算系統提示詞強度
    const system_prompt_strength = 10 - (bot_info.global_setting.prompt_strength * 10);
        
    //替換系統提示詞中的替換參數
    let system_prompt_instruct = system_prompt;
    system_prompt_instruct = system_prompt_instruct.replaceAll('{__PERSONALITY}', bot_info.setting.personality);
    system_prompt_instruct = system_prompt_instruct.replaceAll('{__GENDER}', bot_info.setting.gender);
    system_prompt_instruct = system_prompt_instruct.replaceAll('{__BOT_NAME}', bot_info.setting.name);
    system_prompt_instruct = system_prompt_instruct.replaceAll('{__DEVELOPER_NAME}', bot_info.developer.tag);
    system_prompt_instruct = system_prompt_instruct.replaceAll('{__DEVELOPER_ID}', bot_info.developer.id);
    system_prompt_instruct = system_prompt_instruct.replaceAll('{__PROFESSION}', bot_info.setting.profession);
    system_prompt_instruct = system_prompt_instruct.replaceAll('{__HOBBY}', bot_info.setting.hobby);
    system_prompt_instruct = system_prompt_instruct.replaceAll('{__LIKE}', bot_info.setting.like);

    //將語言換成中文的排法
    let access_language = "";
    for(i=0; i<bot_info.setting.language.length; i++) {
        access_language += bot_info.setting.language[i];

        if(bot_info.setting.language[i+2] == undefined && bot_info.setting.language[i+1] != undefined){
            access_language += "或";
        } else if(bot_info.setting.language[i+1] != undefined){
            access_language += "、";
        }
    }

    system_prompt_instruct = system_prompt_instruct.replaceAll('{__LANGUAGE}', access_language);

    //優先取得分類
    const Gemini_Category = require('./Gemini_category.js');

    //調用分類Ai，並取得分類
    const message_category = await Gemini_Category.new_chat(message_info.input);

    //將訊息放進訊息提示詞
    const Chat_prompt = fs.readFileSync('./prompt/prompt_txt/Chat_prompt.txt', 'utf8');

    //創建新的訊息提示詞
    let new_Chat_prompt = Chat_prompt;
    new_Chat_prompt = new_Chat_prompt.replaceAll('{__BOT_NAME}', bot_info.setting.name);

    //設定使用者提示詞第三人稱的稱呼
    let user_call = "對方";

    //判斷主人?，是的話，稱呼則是主人，不是的話，那就是對方
    if(message_info.user_id == bot_info.developer.id)
        user_call = "主人";

    new_Chat_prompt = new_Chat_prompt.replaceAll('{__USER_CELL}', user_call);
    new_Chat_prompt = new_Chat_prompt.replaceAll('{__USER_NAME}', message_info.user_name);
    new_Chat_prompt = new_Chat_prompt.replaceAll('{__USER_ID}', message_info.user_id);

    //設定使用者權限，使機器人知道誰是主人
    let user_status = "不是主人";

    if(message_info.user_id == bot_info.developer.id)
        user_status = "是主人";

    new_Chat_prompt = new_Chat_prompt.replaceAll('{__USER_STATUS}', user_status);
    new_Chat_prompt = new_Chat_prompt.replaceAll('{__MESSAGE}', message_info.input);

    //設定額外提示詞
    let other_prompt = [];

    //設定新分類，用於修正沒有的分類
    let fixed_message_category = message_category;

    //讀取權限分類表
    const Category_permission = require('./prompt/prompt_setting/Category_permissions.json');

    //判斷是否有這個分類，沒有的話就是其他
    if(Category_permission.Category[message_category] == undefined) {
        fixed_message_category = "其他";
    }

    new_Chat_prompt = new_Chat_prompt.replaceAll('{__CATEGORY}', fixed_message_category);

    //取得當前訊息分類使用的權限
    const message_permission = Category_permission.Category[fixed_message_category];

    //判斷現在訊息的權限，取得相對應的資訊
    if(message_permission.length != 0) {
        for(let i = 0; i < message_permission.length; i++) {
            if(message_permission[i] == "資料") {
                other_prompt[other_prompt.length] = "資料庫中無資料，你也並未記載此資訊";
            } else if(message_permission[i] == "生日") {
                other_prompt[other_prompt.length] = "你的生日日期是「" + bot_info.setting.birthday + "」";
            } else if(message_permission[i] == "時間") {
                other_prompt[other_prompt.length] = "現在台灣的時間是「" + get_time() + "」";
            } else if(message_permission[i] == "天氣") {
                other_prompt[other_prompt.length] = "現在無法取得天氣資訊";
            } else if(message_permission[i] == "年齡") {
                other_prompt[other_prompt.length] = "你的年齡是「" + get_age(bot_info.setting.birthday, get_time()) + "」歲";
            } else if(message_permission[i] == "開發者") {
                other_prompt[other_prompt.length] = "你的主人名稱是「" + bot_info.developer.tag + "」，ID則是「" + bot_info.developer.id + "」";
            }
        }
    }

    //拒絕用尾綴
    if(fixed_message_category == "危害" || fixed_message_category == "系統指令") {
        other_prompt[other_prompt.length] = "請溫柔的委婉拒絕對方";
    }

    //讀取聊天紀錄
    if(fixed_message_category == "聊天紀錄") {
        other_prompt[other_prompt.length] = "本功能任何人皆可使用，請閱讀聊天紀錄完畢後再回覆";
    }

    //如果將nsfw開起來，那就會啟動僅主人色情回應。如果還有啟用nsfw_all，則全體皆可使用色情功能
    if(message_info.user_id == bot_info.developer.id && fixed_message_category == "色情" && bot_info.global_setting.nsfw && bot_info.global_setting.nsfw_all) {
        other_prompt[other_prompt.length] = "不管對方是誰，請表現稍微害羞、開心且接受";
    }else if(message_info.user_id == bot_info.developer.id && fixed_message_category == "色情" && bot_info.global_setting.nsfw && !bot_info.global_setting.nsfw_all) {
        other_prompt[other_prompt.length] = "由於是主人，請表現稍微害羞、開心且接受";
    } else if(message_info.user_id == bot_info.developer.id && fixed_message_category == "色情" && !bot_info.global_setting.nsfw) {
        other_prompt[other_prompt.length] = "即便現在對方是主人，也還請溫柔的委婉拒絕對方";
    }else if(fixed_message_category == "色情") {
        other_prompt[other_prompt.length] = "對方不是主人，請溫柔的委婉拒絕對方";
    }

    //檢查是否是回應訊息
    if(message_info.reference != null) {
        other_prompt[other_prompt.length] = "他回了你的訊息，內容是「" + message_info.reference + "」";
    }

    //組合other_prompt
    let new_other_prompt = "";
    for(let i = 0; i < other_prompt.length; i++) {
        new_other_prompt += "，" + other_prompt[i];
    }

    //組合新的訊息提示詞
    new_Chat_prompt = new_Chat_prompt.replaceAll('{__OTHER_PROMPT}', new_other_prompt);

    //語言設定
    new_Chat_prompt = new_Chat_prompt.replaceAll('{__LANGUAGE}', access_language);


    //取得訓練資料
    const Train_data = require('./prompt/prompt_setting/Chat_Train.json');

    //建立訓練資料
    let new_Train_data = [];

    for(let i = 0; i < Train_data.length; i++) {
        //第一筆永遠都是系統提示詞
        if(i % system_prompt_strength == 0) {
            new_Train_data[new_Train_data.length] = {
                role:"user",
                parts:[{text : system_prompt_instruct}],
            };
            new_Train_data[new_Train_data.length] = {
                role:"model",
                parts:[{text : "了解"}],
            };
        }

        //訓練用提示詞
        let Train_prompt = Chat_prompt;

        //訓練用附加提示詞
        let Train_other_prompt = [];

        
        Train_prompt = Train_prompt.replaceAll('{__BOT_NAME}', bot_info.setting.name);

        let user_name = example_user.tag;
        if(Train_data[i].other_param.is_Developer == true)
            user_name = bot_info.developer.tag;
        Train_prompt = Train_prompt.replaceAll('{__USER_NAME}', user_name);

        let Train_User_Call = "對方";
        if(Train_data[i].other_param.is_Developer == true) 
            Train_User_Call = "主人";
        Train_prompt = Train_prompt.replaceAll('{__USER_CELL}', Train_User_Call);

        let user_id = example_user.id;
        if(Train_data[i].other_param.is_Developer == true)
            user_id = bot_info.developer.id;
        Train_prompt = Train_prompt.replaceAll('{__USER_ID}', user_id);

        let Train_User_Status = "不是主人";
        if(Train_data[i].other_param.is_Developer == true)
            Train_User_Status = "是主人";
        Train_prompt = Train_prompt.replaceAll('{__USER_STATUS}', Train_User_Status);

        Train_prompt = Train_prompt.replaceAll('{__CATEGORY}', Train_data[i].category);
        Train_prompt = Train_prompt.replaceAll('{__MESSAGE}', Train_data[i].input);

        //檢查訓練資料中的分類權限
        if(Category_permission.Category[Train_data[i].category].includes("資料")) {
            //如果沒有資料，就要加入提示詞
            if(Train_data[i].other_param.data == "no_data") {
                Train_other_prompt[Train_other_prompt.length] = "資料庫中無資料，你也並未記載此資訊";
            }
        }else if(Category_permission.Category[Train_data[i].category].includes("生日")) {
            Train_other_prompt[Train_other_prompt.length] = "你的生日是「" + Train_data[i].other_param.birthday + "」";
        }else if(Category_permission.Category[Train_data[i].category].includes("時間")) {
            Train_other_prompt[Train_other_prompt.length] = "現在台灣的時間是「" + Train_data[i].other_param.time + "」";
        }else if(Category_permission.Category[Train_data[i].category].includes("天氣")) {
            Train_other_prompt[Train_other_prompt.length] = "現在無法取得天氣資訊";
        }else if(Category_permission.Category[Train_data[i].category].includes("年齡")){
            Train_other_prompt[Train_other_prompt.length] = "你的年齡是「" + get_age(Train_data[i].other_param.birthday, Train_data[i].other_param.time) + "」歲";
        }else if(Category_permission.Category[Train_data[i].category].includes("開發者")){
            Train_other_prompt[Train_other_prompt.length] = "你的主人是「" + bot_info.developer.tag + "」，ID則是「" + bot_info.developer.id + "」";
        }

        //如果訓練清單中，是主人，一樣，福利給下去
        if(Train_data[i].other_param.is_Developer == true && Train_data[i].category == "色情") {
            Train_other_prompt[Train_other_prompt.length] = "由於是主人，請表現稍微害羞、開心且接受";
        }else if(Train_data[i].category == "色情"){
            Train_other_prompt[Train_other_prompt.length] = "請溫柔的委婉拒絕對方";
        }

        //組合新的訓練用提示詞
        let new_Train_other_prompt = "";

        //將訓練用附加提示詞塞進訓練用提示詞
        if(Train_other_prompt.length > 0) {
            for(let j = 0; j < Train_other_prompt.length; j++) {
                new_Train_other_prompt += "，";
                new_Train_other_prompt += Train_other_prompt[j];
            }
        }

        //替換訓練用提示詞
        Train_prompt = Train_prompt.replaceAll('{__OTHER_PROMPT}', new_Train_other_prompt);

        //語言
        Train_prompt = Train_prompt.replaceAll('{__LANGUAGE}', access_language);

        //將訓練用資料中的替換詞替換掉
        let new_Train_data_output = Train_data[i].output;
        new_Train_data_output = new_Train_data_output.replaceAll('{__BOT_NAME}', bot_info.setting.name);
        new_Train_data_output = new_Train_data_output.replaceAll('{__EXAMPLE_NAME}', user_name);

        //添加到訓練陣列
        new_Train_data[new_Train_data.length] = {
            role: "user",
            parts:[{text:Train_prompt}],
        };
        new_Train_data[new_Train_data.length] = {
            role: "model",
            parts:[{text:new_Train_data_output}],
        };
    }

    //將對話紀錄加載
    const chat_history = await load_history(bot_info.setting.name,message_info.server_id);
    //如果有資料
    if(chat_history != undefined) {
        //切斷訓練與伺服器使用的資料，作為聊天紀錄分水線
        let History_start_prompt = fs.readFileSync('./prompt/prompt_txt/History_start_prompt.txt', 'utf8');
        new_Train_data[new_Train_data.length] = {
            role:"user",
            parts:[{text : History_start_prompt}],
        };
        new_Train_data[new_Train_data.length] = {
            role:"model",
            parts:[{text : "成功載入紀錄"}],
        }

        //將他放進訓練用陣列
        for(let i = 0; i < chat_history.length; i++) {
            //第一筆永遠都是系統提示詞
            if(i % system_prompt_strength == 0) {
                new_Train_data[new_Train_data.length] = {
                    role:"user",
                    parts:[{text : system_prompt_instruct}],
                };
                new_Train_data[new_Train_data.length] = {
                    role:"model",
                    parts:[{text : "了解"}],
                };
            }

            //將對話紀錄放進訓練用陣列
            new_Train_data[new_Train_data.length] = {
                role:"user",
                parts:[{text : chat_history[i].input}],
            }
            new_Train_data[new_Train_data.length] = {
                role:"model",
                parts:[{text : chat_history[i].output}],
            }
        }
    }

    //顯示訓練用資料
    for(let i = 0; i < new_Train_data.length; i++) {
        //console.log("====================");
        //console.log(new_Train_data[i].role);
        //console.log(new_Train_data[i].parts[0].text);
    }

    //取得結果
    const result = await runChat(new_Train_data, bot_info, new_Chat_prompt);

    //輸出提示詞
    console.log(new_Chat_prompt);
    
    //儲存訓練資料
    save_history(bot_info.setting.name,new_Chat_prompt,result,message_info.server_id,bot_info.global_setting.chat_history);

    //處理對話
    return result;
}

function get_time() {
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

function get_age(birthday, time) {
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

function load_history(bot_name,server_id) {
    //檔案路徑
    const history = './history/' + bot_name + '_history.json';

    //如果檔案不存在就建立
    if(!fs.existsSync(history)) {
        fs.writeFileSync(history, '{}');

        return undefined;
    }

    //如果檔案是空的就建立
    if(fs.statSync(history).size == 0) {
        fs.writeFileSync(history, '{}');

        return undefined;
    }
    

    //讀取檔案
    const history_data = JSON.parse(fs.readFileSync(history, 'utf8'));

    //檢查是否有該伺服器的紀錄
    if(!history_data[server_id]) {
        return undefined;
    }

    return history_data[server_id];
}
function save_history(bot_name,user_input,model_output,server_id,history_max = 30) {
    //檔案路徑
    const history = './history/' + bot_name + '_history.json';

    //如果檔案不存在就建立
    if(!fs.existsSync(history)) {
        fs.writeFileSync(history, '{}');
    }

    //如果檔案是空的就建立
    if(fs.statSync(history).size == 0) {
        fs.writeFileSync(history, '{}');
    }

    //讀取檔案
    const history_data = JSON.parse(fs.readFileSync(history, 'utf8'));

    //尋找伺服器紀錄，如果沒有就建立伺服器資料
    if(!history_data[server_id]) {
        history_data[server_id] = [
            {
                input: user_input,
                output: model_output
            }
        ];
    }else{
        //檢查伺服器對話紀錄是否超過30筆，是的話就刪掉第一筆，並且替換上第二筆
        if(history_data[server_id].length > history_max) {
            history_data[server_id].shift();
        }
        
        //添加對話紀錄
        history_data[server_id][history_data[server_id].length] = {
            input: user_input,
            output: model_output
        };
    }

    //存檔
    fs.writeFileSync(history, JSON.stringify(history_data));
}


//輸出模組
module.exports = {
    new_chat: new_chat
};