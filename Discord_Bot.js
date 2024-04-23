//Discord js 外掛
const {
    Client,
    GatewayIntentBits,
    PermissionsBitField,
    ActivityType
} = require('discord.js');

//fs 外掛
const fs = require('fs');

//readline 外掛
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
})

//Client 權限設定
const client = new Client({
    intents: [
        3276799,
    ]
});

//預設一個config檔案，用於除錯
let config = require('./Test_config.json').Test_config;

//把機器人的需要的資訊，設定成一個空陣列
let bot_info = {};

//當機器人啟動成功時
client.on('ready', async () => {
    //清除畫面
    console.clear();

    //顯示機器人資訊
    console.log('Haroiii Ai Tech Version 4.2P');
    console.log('Build With 「Discord.js」 & 「Google Gemini」');
    console.log('Discord.js Version: 14');
    console.log('Google Gemini Version: Pro 1.0');
    console.log();
    console.log('Login as in ' + client.user.tag);
    console.log();

    //讀取機器人所需資訊
    load_bot_setting();

    //顯示機器人資訊
    console.log('Name: ' + bot_info.bot_config.name);
    console.log('Developer ID: ' + bot_info.developer.id);
    console.log('Developer Name: ' + bot_info.developer.name);

    //設定機器人狀態
    client.user.setPresence({
        status: 'online',
        activities: [{
            name: "請使用 " + bot_info.bot_config.name + " 來呼叫我呦",
            type: ActivityType.Custom
        }]
    })
});

//當機器人收到訊息時
client.on('messageCreate', async (message) => {
    //判斷訊息來源是否為機器人
    if(message.author.bot) return;

    //判斷訊息是不是自己
    if(message.author.id == client.user.id) return;

    //新增回應變數，用於儲存回應誰的ID
    let message_reference_id = null;

    //檢查回應
    if(message.reference != null && bot_info.bot_setting.reference) {
        const reference_message = await message.channel.messages.fetch(message.reference.messageId);
        message_reference_id = reference_message.author.id;
    }

    //在10字元以內呼叫機器人都有用，或者回應機器人都有用
    if((message.content.indexOf(bot_info.bot_config.name) >= 0 && message.content.indexOf(bot_info.bot_config.name) <= 10) || message_reference_id == config.discord.client_id) {
        //取得mention的人
        let mention = [];
        message.mentions.users.forEach((user) => {
            mention[mention.length] = {
                user_id: user.id,
                user_tag: user.tag
            };
        });

        let new_message_content = message.content;
        
        //將mention的ID換成名稱，讓AI讀懂是誰
        for(let i = 0; i < mention.length; i++) {
            new_message_content = new_message_content.replaceAll("<@"+mention[i].user_id+">", "「" + mention[i].user_tag + "」");
        }

        console.log(mention);

        //回應參數，用於告訴機器人使用者是否有用回應
        let reference_content = null;

        //重點回應功能，先檢查使用者是否回應喵蔥
        if(message.reference != null && bot_info.bot_setting.reference) {
            const reference_message = await message.channel.messages.fetch(message.reference.messageId);
            if(reference_message.author.id == config.discord.client_id) {
                reference_content = reference_message.content;
            }
        }

        //建立一個訊息資訊
        let message_info = {
            id: message.author.id,
            name: message.author.globalName,
            server_id: message.guild.id,
            content: new_message_content,
            reference: reference_content
        };


        //系統提示詞
        const Ai_New_Chat = require('./Output_result.js');

        //取得結果
        const result_output = await Ai_New_Chat.Process_input(config, message_info);

        //執行系統提示詞
        try {
            await message.reply(result_output);
        } catch (error) {}
    }
})

//讀取機器人所需資訊
function load_bot_setting() {
    //取得開發者名稱
    const developer_tag = client.users.cache.get(config.developer.id);

    //機器人所需資訊
    bot_info = config;

    //最後的開發者名稱
    bot_info.developer.name = developer_tag.globalName;
}

//選擇式啟動function
function start() {
    //掃描config資料夾中的所有檔案
    const __all_files = fs.readdirSync('./config');

    //如果config沒有檔案，結束程式
    if(__all_files.length == 0) {
        console.log('config folder is empty!');
        process.exit(0);
    }

    //新增一個不包含提示的陣列
    let __new_files = [];

    for(let i = 0; i < __all_files.length; i++) {
        if(__all_files[i].includes("Null") != true) {
            __new_files[__new_files.length] = __all_files[i];
        }
    }

    //顯示config資料夾中的所有檔案
    console.log("On config folder: ");
    for(i = 0; i < __new_files.length; i++) {
        console.log((i + 1) + ' : ' + __new_files[i].replaceAll('_Config.json', ''));
    }

    //讓使用者選擇檔案
    readline.question('Select config file: ', (answer) => {
        //如果選擇超出範圍，顯示沒有該檔案，結束程式
        if(answer > __all_files.length || answer < 1) {
            console.log('Not found config!');
            process.exit(0);
        }

        //讀取選擇的檔案
        config = require('./config/' + __new_files[answer - 1]);

        //登入機器人
        client.login(config.discord.token);
    })
}

//啟動機器人
//client.login(config.discord.token);   //用於除錯用直接啟動
start();    //正式版本