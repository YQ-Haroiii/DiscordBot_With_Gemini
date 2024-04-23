//取得對話分類
async function __Message_Category(config, message_info) {
    //取得系統提示詞
    const System_prompt = _Process_System_prompt();

    //取得訊息提示詞
    const Message_prompt = _Process_Message_prompt(message_info,config);

    //取得歷史訊息
    const History = _Process_History(config, message_info);

    //取得訓練資料
    const Train_Data = __Get_Train_Data();

    //組合訓練資料
    const new_Train_Data = _Process_Build_Train_Data(System_prompt, History, Train_Data);

    //加載Gemini模組
    const Gemini = require('./Gemini.js');

    //單獨設定穩定性
    const generationConfig = {
        temperature: 0.5,
        topK: 1,
        topP: 0.7,
        maxOutputTokens: 1024,
    };

    //產生分類
    const result = await Gemini.Generate_Chat(new_Train_Data, Message_prompt, config.gemini.token, generationConfig);

    //回傳結果
    return result;
}

//組合訓練資料
function _Process_Build_Train_Data(System_prompt, History, Train_Data) {
    //加載fs模組，用於讀取訊息
    const fs = require('fs');

    //讀取訓練結束提示詞
    const Train_prompt = fs.readFileSync('./chat_process/prompt/category_Train_Prompt.txt', 'utf8');
    
    //新增訓練資料
    let new_Train_Data = [];

    //系統提示詞(Gemini格式)
    let System_Prompt_Gemini = new __Get_Gemini_format();
    System_Prompt_Gemini.user.parts[0].text = System_prompt;
    System_Prompt_Gemini.model.parts[0].text = "了解";

    //放入系統提示詞
    new_Train_Data.push(System_Prompt_Gemini.user);
    new_Train_Data.push(System_Prompt_Gemini.model);

    //放入訓練資料(已經是Gemini格式)
    for(i=0; i<Train_Data.length; i++) {
        //放入訓練資料
        new_Train_Data.push(Train_Data[i]);
    }

    /*
    //訓練結束提示詞(Gemini格式)
    let Train_Prompt_Gemini = new __Get_Gemini_format();
    Train_Prompt_Gemini.user.parts[0].text = Train_prompt;
    Train_Prompt_Gemini.model.parts[0].text = "了解";

    //放入系統提示詞
    new_Train_Data.push(Train_Prompt_Gemini.user);
    new_Train_Data.push(Train_Prompt_Gemini.model);*/

    //放入歷史資料(已經是Gemini格式)
    for(i=0; i<History.length; i++) {
        //放入歷史資料
        new_Train_Data.push(History[i]);
    }

    //回傳訓練資料
    return new_Train_Data;
}

//系統提示詞
function _Process_System_prompt() {
    //加載fs模組，用於讀取訊息
    const fs = require('fs');

    //讀取系統提示詞
    const System_prompt = fs.readFileSync('./chat_process/prompt/category_System_Prompt.txt', 'utf8');

    //替換系統提示詞
    let new_System_prompt = System_prompt;

    //取得分類提示詞
    const category_prompt = __Get_Category();

    //替換提示詞
    new_System_prompt = new_System_prompt.replaceAll('{__CATEGORY}', category_prompt);

    //傳回系統提示詞
    return new_System_prompt;
}

//訊息提示詞
function _Process_Message_prompt(message_info, config) {
    //加載fs模組，用於讀取訊息
    const fs = require('fs');

    //讀取訊息提示詞
    const Message_prompt = fs.readFileSync('./chat_process/prompt/category_Input_Prompt.txt', 'utf8');

    //替換訊息提示詞
    let new_Message_prompt = Message_prompt;

    //取得分類提示詞
    const category_prompt = __Get_Category();

    //替換提示詞 / 分類
    new_Message_prompt = new_Message_prompt.replaceAll('{__CATEGORY}', category_prompt);

    //將內文中自己的名字替換
    const new_message_content = message_info.content.replaceAll(config.bot_config.name, '');

    //替換提示詞 / 內文
    new_Message_prompt = new_Message_prompt.replaceAll('{__USER_MESSAGE}', new_message_content);

    //替換提示詞 / 名稱
    new_Message_prompt = new_Message_prompt.replaceAll('{__BOT_NAME}', config.bot_config.name);
    
    //傳回訊息提示詞
    return new_Message_prompt;
}

//取得訓練資料
function __Get_Train_Data() {
    //建立訓練資料
    let new_Train_Data = [];

    //取得訓練資料
    const Train_Data = require('./chat_process/setting/category_Train_Data.json');

    //將訓練資料放入
    for(i=0; i<Train_Data.category.length; i++) {
        //Gemini格式
        let Gemini_Train_format = {
            user : {
                role: "user",
                parts: [{ text: Train_Data.category[i].input}],
            },
            model : {
                role: "model",
                parts: [{ text: Train_Data.category[i].output}],
            }   
        }

        //放入訓練資料
        new_Train_Data.push(Gemini_Train_format.user);
        new_Train_Data.push(Gemini_Train_format.model);
    }

    //傳回訓練資料
    return new_Train_Data;
}

//處理歷史紀錄
function _Process_History(config, message_info) {
    //建立歷史紀錄表
    let history_train = [];

    //取得歷史紀錄
    const history = __Get_History(config, message_info.server_id);

    //檢查是否有歷史紀錄
    if(history == null) {
        return history_train;
    }

    //取得最大歷史紀錄上限
    const max_history = config.bot_setting.chat.chat_history;

    //取得歷史紀錄長度
    let history_length = history.length;

    //取得歷史紀錄讀取位置
    const history_read_index = (history_length - max_history) < 0 ? 0 : (history_length - max_history);

    //放入歷史紀錄
    for(i=history_read_index; i<history.length; i++) {
        
        //Gemini格式
        let Gemini_Train_format = {
            user : {
                role: "user",
                parts: [{ text: history[i].original_message}],
            },
            model : {
                role: "model",
                parts: [{ text: history[i].category}],
            }
        }

        //將歷史紀錄轉換成Gemini格式
        history_train.push(Gemini_Train_format.user);
        history_train.push(Gemini_Train_format.model);
    }

    //傳回歷史紀錄
    return history_train;
}

//取得歷史紀錄
function __Get_History(config,server_id) {
    //加載fs模組，用於讀取訊息
    const fs = require('fs');

    //歷史紀錄根目錄
    const history_root = './history/';

    //檔案名稱
    const file_name = history_root + config.bot_config.name + '_History.json';

    //如果檔案不存在，或者是空的，則回傳null
    if (!fs.existsSync(file_name)) {
        return null;
    }else if(fs.statSync(file_name).size == 0) {
        return null;
    }

    //讀取檔案
    const history_text = fs.readFileSync(file_name, 'utf8');
    const history_data = JSON.parse(history_text);

    //回傳歷史紀錄
    return history_data[server_id];
}

//取得分類
function __Get_Category() {
    //取得所有分類檔案
    const category_Permission_Data = require('./chat_process/setting/category_Permission_Data.json');

    //取得所有分類
    const all_category = Object.keys(category_Permission_Data.category);

    //分類提示詞
    let category_prompt = '';

    //將分類裝入提示詞字串
    for (let i = 0; i < all_category.length; i++) {
        category_prompt += all_category[i];

        if(i < all_category.length - 1) {
            category_prompt += '，';
        }
    }

    //傳回分類提示詞
    return category_prompt;
}

//取得Gemini格式
function __Get_Gemini_format() {
    //Gemini格式
    const Gemini_Train_format = {
        user : {
            role: "user",
            parts: [{ text: ""}],
        },
        model : {
            role: "model",
            parts: [{ text: ""}],
        }
    }

    return Gemini_Train_format;
}

//封裝模組
module.exports = {
    __Message_Category : __Message_Category,
}


//設定一個測試用陣列
const Test_message_info = require('./Test_config.json');

async function Test() {
    console.log(await __Message_Category(Test_message_info.Test_config, Test_message_info.Test_message_info));
}

//Test();