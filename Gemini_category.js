//Google Generative AI 外掛
const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
} = require("@google/generative-ai");

//fs 外掛
const fs = require('fs');

//開始對話
async function runChat(input_message, input_history) {
    const new_input_message = input_message;
    const MODEL_NAME = "gemini-1.0-pro";
    const API_KEY = "AIzaSyDcgP2Af2fllfOEqCF2AC5XFfL943DZPAQ";

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const generationConfig = {
        temperature: 0.5,
        topK: 1,
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
        history: input_history,
    });
    
    const result = await chat.sendMessage(input_message);
    const response = result.response;
    return response.text();
}

//新對話，這裡負責處理提示詞，接收結果
async function new_chat(input_message) {
    //取得系統提示詞
    const system_prompt = fs.readFileSync('./prompt/prompt_txt/Category_prompt.txt', 'utf8');

    //取得訓練提示詞
    const train_prompt = fs.readFileSync('./prompt/prompt_txt/Category_chat_prompt.txt', 'utf8');

    //取得分類與訓練資料
    const category_data = require('./prompt/prompt_setting/Category_Train.json');

    //取得分類
    const category = category_data.Category;

    //分類，但是是文字
    let category_text = "";

    //將分類轉換成可讀格式，最後一個不加上、
    for(let i = 0; i < category.length; i++) {
        category_text += category[i];

        if(i < category.length - 1) {
            category_text += "、";
        }
    }

    //取得訓練資料
    const train_data = category_data.Train;

    //設定訓練資料數(一答一回)，加上系統提示詞
    const train_num = train_data.length;

    //建立訓練資料
    let new_history = [];

    //將當前的訓練數據加上訓練提示詞
    let new_train_prompt = train_prompt;
    new_train_prompt = new_train_prompt.replace('{__CATEGORY}', category_text);

    //放入資料
    for(let i = 0; i < train_num; i++) {

        //建立一個新的系統提示詞
        let new_system_prompt = system_prompt;

        //將當前的訓練數據加上系統提示詞
        new_system_prompt = new_system_prompt.replace('{__CATEGORY}', category);

        //先放上系統提示詞
        if(i % 5 == 0) {
            new_history[new_history.length] = {
                role: "user",
                parts: [{ text: new_system_prompt }],
            };
            new_history[new_history.length] = {
                role: "model",
                parts: [{ text: "了解" }],
            }
        }

        //替換訓練訊息
        let new_train_prompt_now = new_train_prompt;
        new_train_prompt_now = new_train_prompt.replace('{__MESSAGE}', train_data[i].input);
        
        new_history[new_history.length] = {
            role: "user",
            parts: [{ text: new_train_prompt_now }],
        };
        new_history[new_history.length] = {
            role: "model",
            parts: [{ text: train_data[i].output }],
        };
    }

    //替換訓練訊息
    let new_message = new_train_prompt;
    new_message = new_train_prompt.replace('{__MESSAGE}', input_message);

    const result = await runChat(new_message,new_history);
    //console.log(input_message + " : " + result);
    return result;
}

//輸出模組
module.exports = {
    new_chat: new_chat
};