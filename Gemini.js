async function Generate_Chat(Train_Data, Message, API, generationConfig){
    //判斷參數傳遞
    if(!API || !Train_Data || !Message){
        console.error("缺少必要的參數。請重新檢查參數。");
        return -1;
    }

    //Google Generative AI 外掛
    const {GoogleGenerativeAI, HarmCategory, HarmBlockThreshold,} = require("@google/generative-ai");

    //設定 : Gemini系統設定
    const MODEL_TYPE = "gemini-1.0-pro";

    //設定 : 模型設定
    const genAI = new GoogleGenerativeAI(API);
    const model = genAI.getGenerativeModel({ model: MODEL_TYPE });

    //設定 : 生成設定
    if(!generationConfig){
        generationConfig = {
            temperature: 1,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
        };
    }

    //設定 : 防護設定
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

    //設定 : 模型調整
    const chat = model.startChat({
        generationConfig,
        safetySettings,
        history: Train_Data,
    });

    //輸出 : 生成結果
    try {
        const result = await chat.sendMessage(Message);
        const response = result.response;

        const result_output = response.text();

        return response.text();
    }catch (error) {
        console.error(error);
    }    
}

//將副程式封裝
module.exports = {
    Generate_Chat: Generate_Chat
}